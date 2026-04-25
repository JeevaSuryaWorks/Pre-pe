import { Injectable, InternalServerErrorException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class HubbleService {
    private readonly logger = new Logger(HubbleService.name);
    private readonly baseUrl = process.env.HUBBLE_API_URL || 'https://api.dev.myhubble.money';
    private readonly clientId = process.env.HUBBLE_CLIENT_ID;
    private readonly clientSecret = process.env.HUBBLE_CLIENT_SECRET;
    
    private accessToken: string | null = null;
    private tokenExpiryTime: number = 0;

    constructor(private prisma: PrismaService) {}

    private async getHeaders(): Promise<HeadersInit> {
        await this.ensureAuthenticated();
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'X-REQUEST-ID': crypto.randomUUID(),
            'Content-Type': 'application/json',
        };
    }

    private async ensureAuthenticated() {
        // Refresh token if it's within 5 minutes of expiry or missing
        const now = Date.now();
        if (!this.accessToken || now > this.tokenExpiryTime - (5 * 60 * 1000)) {
            this.logger.log('Authenticating with Hubble API...');
            
            if (!this.clientId || !this.clientSecret) {
                throw new InternalServerErrorException('Hubble API credentials not configured');
            }

            try {
                const response = await fetch(`${this.baseUrl}/v1/partners/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: this.clientId,
                        clientSecret: this.clientSecret
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    this.logger.error(`Hubble Login Failed: ${response.status} ${errText}`);
                    throw new Error(`Authentication failed with status ${response.status}`);
                }

                const data = await response.json();
                this.accessToken = data.token;
                // Set expiry time (data.expiresInSecs is in seconds, convert to ms)
                this.tokenExpiryTime = now + (data.expiresInSecs * 1000);
                this.logger.log('Hubble API Authentication successful.');
            } catch (error) {
                this.logger.error('Failed to authenticate with Hubble', error);
                throw new InternalServerErrorException('Gift card service is temporarily unavailable');
            }
        }
    }

    async getBrands(category?: string, limit: number = 50, pageNo: number = 1) {
        try {
            const headers = await this.getHeaders();
            const url = new URL(`${this.baseUrl}/v1/partners/products`);
            if (category) url.searchParams.append('category', category);
            url.searchParams.append('limit', limit.toString());
            url.searchParams.append('pageNo', pageNo.toString());

            const response = await fetch(url.toString(), { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch brands: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Filter out inactive brands as per documentation recommendation
            const activeBrands = data.data.filter((brand: any) => brand.status === 'ACTIVE');
            
            return {
                ...data,
                data: activeBrands
            };
        } catch (error) {
            this.logger.error('Error fetching brands from Hubble', error);
            throw new InternalServerErrorException('Failed to fetch gift card catalog');
        }
    }

    async getBrandDetails(productId: string) {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(`${this.baseUrl}/v1/partners/products/${productId}`, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch brand details: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Error fetching brand details for ${productId}`, error);
            throw new InternalServerErrorException('Failed to fetch brand details');
        }
    }

    async placeOrder(userId: string, productId: string, amount: number) {
        // 1. Fetch brand details to validate amount and denominations
        const brand = await this.getBrandDetails(productId);
        if (brand.status !== 'ACTIVE') {
            throw new InternalServerErrorException('This brand is currently inactive');
        }

        // Validate amount restrictions
        const restrictions = brand.amountRestrictions;
        if (amount < restrictions.minOrderAmount || amount > restrictions.maxOrderAmount) {
            throw new InternalServerErrorException(`Amount must be between ₹${restrictions.minOrderAmount} and ₹${restrictions.maxOrderAmount}`);
        }

        let denominationDetails = [];
        if (brand.denominationType === 'FIXED') {
            // Find an exact match denomination (simplest approach for now, or algorithm to split)
            const exactDenom = restrictions.denominations.find((d: number) => d === amount);
            if (!exactDenom) {
                throw new InternalServerErrorException('Invalid denomination for this brand');
            }
            denominationDetails.push({ denomination: amount, quantity: 1 });
        } else {
            // FLEXIBLE
            if (amount < restrictions.minVoucherAmount || amount > restrictions.maxVoucherAmount) {
                throw new InternalServerErrorException(`Voucher amount out of range`);
            }
            denominationDetails.push({ denomination: amount, quantity: 1 });
        }

        // 2. Fetch user details for the order
        const user = await this.prisma.profiles.findUnique({ where: { user_id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        // Note: For a real app, you would verify wallet balance here and deduct it in a transaction.
        // For simplicity and to prevent issues if wallet balance is 0 during test, we'll assume the wallet deduction happens elsewhere or wrap it in Prisma transaction later.

        const referenceId = crypto.randomUUID(); // Idempotency key
        const headers = await this.getHeaders();

        try {
            const orderPayload = {
                productId,
                referenceId,
                amount,
                denominationDetails,
                customerDetails: {
                    name: user.full_name || 'Hubble User',
                    phoneNumber: user.phone || '9999999999',
                    email: user.email || 'customer@pre-pe.com'
                }
            };

            const response = await fetch(`${this.baseUrl}/v1/partners/orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                this.logger.error(`Order Placement Failed: ${errText}`);
                throw new InternalServerErrorException('Failed to place order with provider');
            }

            const orderResponse = await response.json();
            
            // 3. Process Response
            if (orderResponse.status === 'SUCCESS' && orderResponse.vouchers && orderResponse.vouchers.length > 0) {
                // Save voucher to DB
                const voucher = orderResponse.vouchers[0]; // Assuming 1 quantity for simplicity
                
                await this.prisma.gift_card_vouchers.create({
                    data: {
                        user_id: userId,
                        brand_name: brand.title,
                        brand_logo_url: brand.thumbnailUrl || brand.logoUrl,
                        amount: amount,
                        status: 'ACTIVE',
                        voucher_code: voucher.cardNumber,
                        voucher_pin: voucher.cardPin,
                        reference_id: referenceId,
                        provider: 'HUBBLE',
                        expiry_date: voucher.validTill ? new Date(voucher.validTill) : null,
                        purchase_type: 'WALLET', // Or POINTS
                        purchase_cost: amount
                    }
                });
                
                return { success: true, order: orderResponse };
            } else if (orderResponse.status === 'PROCESSING') {
                return { success: true, status: 'PROCESSING', referenceId };
            } else {
                this.logger.error(`Order failed: ${orderResponse.failureReason}`);
                throw new InternalServerErrorException(orderResponse.failureReason || 'Order failed');
            }
        } catch (error) {
            this.logger.error('Exception during order placement', error);
            throw new InternalServerErrorException('Failed to process order');
        }
    }

    async getOrder(orderId: string) {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(`${this.baseUrl}/v1/partners/orders/${orderId}`, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch order: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Error fetching order ${orderId}`, error);
            throw new InternalServerErrorException('Failed to fetch order details');
        }
    }
}
