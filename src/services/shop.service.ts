import { supabase } from '@/integrations/supabase/client';
import { API_BASE_URL } from '@/utils/api-config';

export interface ProductItem {
    id: string;
    seller_id: string;
    category_id: string;
    title: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    brand: string;
    images: string[];
    rating: number;
    is_active: boolean;
    specifications: Record<string, string>;
    created_at: string;
    updated_at: string;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    variants: ProductVariant[];
    totalStock: number;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    price_override: number | null;
    stock: number;
    sku: string;
}

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    created_at: string;
    product: ProductItem;
    variant: ProductVariant | null;
    unitPrice: number;
    subtotal: number;
}

export interface AddressItem {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    street: string;
    landmark: string | null;
    city: string;
    state: string;
    postal_code: string;
    is_default: boolean;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    unit_price: number;
    product: ProductItem;
    variant: ProductVariant | null;
}

export interface OrderSummary {
    id: string;
    user_id: string;
    address_id: string;
    coupon_id: string | null;
    status: string;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total_amount: number;
    payment_method: string;
    razorpay_order: string | null;
    created_at: string;
    updated_at: string;
    address: AddressItem;
    order_items: OrderItem[];
}

export const shopService = {
    async getHeaders() {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        };
    },

    async request(path: string, method = 'GET', body?: any) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}/ecommerce${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `Request failed with code ${response.status}`);
        }

        return response.json();
    },

    // ==========================================
    // CUSTOMER: CATALOG & PRODUCTS
    // ==========================================
    async getCategories(): Promise<any[]> {
        return this.request('/products/categories');
    },

    async getProducts(params: {
        categoryId?: string;
        query?: string;
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        rating?: number;
        availability?: string;
        sortBy?: string;
    }): Promise<ProductItem[]> {
        const q = new URLSearchParams();
        if (params.categoryId) q.append('categoryId', params.categoryId);
        if (params.query) q.append('query', params.query);
        if (params.brand) q.append('brand', params.brand);
        if (params.minPrice) q.append('minPrice', params.minPrice.toString());
        if (params.maxPrice) q.append('maxPrice', params.maxPrice.toString());
        if (params.rating) q.append('rating', params.rating.toString());
        if (params.availability) q.append('availability', params.availability);
        if (params.sortBy) q.append('sortBy', params.sortBy);

        return this.request(`/products?${q.toString()}`);
    },

    async getProduct(id: string): Promise<ProductItem & { reviews: any[], seller: any }> {
        return this.request(`/products/${id}`);
    },

    async createReview(productId: string, rating: number, comment: string): Promise<any> {
        return this.request(`/products/${productId}/review`, 'POST', { rating, comment });
    },

    // ==========================================
    // CUSTOMER: CART OPERATIONS
    // ==========================================
    async getCart(): Promise<CartItem[]> {
        return this.request('/cart');
    },

    async addToCart(productId: string, variantId: string | null, quantity: number): Promise<any> {
        return this.request('/cart/add', 'POST', { productId, variantId, quantity });
    },

    async updateCart(cartItemId: string, quantity: number, variantId?: string | null): Promise<any> {
        return this.request(`/cart/${cartItemId}`, 'PUT', { quantity, variantId });
    },

    async removeFromCart(cartItemId: string): Promise<any> {
        return this.request(`/cart/${cartItemId}`, 'DELETE');
    },

    // ==========================================
    // CUSTOMER: CHECKOUT & ORDERS
    // ==========================================
    async getAddresses(): Promise<AddressItem[]> {
        return this.request('/orders/addresses');
    },

    async createAddress(address: Partial<AddressItem>): Promise<AddressItem> {
        return this.request('/orders/addresses', 'POST', address);
    },

    async verifyCoupon(code: string, subtotal: number): Promise<{ id: string, code: string, discount: number }> {
        return this.request('/orders/checkout/coupon', 'POST', { code, subtotal });
    },

    async createOrder(addressId: string, couponCode?: string): Promise<{ orderId: string, razorpayOrderId: string, amount: number, key: string }> {
        return this.request('/orders/checkout/create', 'POST', { addressId, couponCode });
    },

    async verifyOrderPayment(orderId: string, paymentData: any): Promise<any> {
        return this.request(`/orders/${orderId}/verify`, 'POST', paymentData);
    },

    async getOrders(): Promise<OrderSummary[]> {
        return this.request('/orders');
    },

    async getOrderDetails(orderId: string): Promise<OrderSummary & { coupon: any }> {
        return this.request(`/orders/${orderId}`);
    },

    // ==========================================
    // SELLER WORKFLOWS
    // ==========================================
    async registerSeller(data: any): Promise<any> {
        return this.request('/sellers/register', 'POST', data);
    },

    async getSellerProfile(): Promise<{ exists: boolean, id?: string, company_name?: string, gstin?: string, status?: string, kyc_status?: string }> {
        return this.request('/sellers/profile');
    },

    async getSellerDashboard(): Promise<any> {
        return this.request('/sellers/dashboard');
    },

    async getSellerProducts(): Promise<ProductItem[]> {
        return this.request('/sellers/products');
    },

    async createProduct(data: any): Promise<any> {
        return this.request('/sellers/products', 'POST', data);
    },

    async updateVariantStock(variantId: string, stock: number): Promise<any> {
        return this.request(`/sellers/variants/${variantId}/stock`, 'PUT', { stock });
    },

    async getSellerOrders(): Promise<any[]> {
        return this.request('/sellers/orders');
    },

    async updateShipment(orderId: string, status: string): Promise<any> {
        return this.request(`/sellers/orders/${orderId}/shipment`, 'PUT', { status });
    },

    async requestWithdrawal(amount: number): Promise<any> {
        return this.request('/sellers/withdrawals', 'POST', { amount });
    },

    async getWithdrawalHistory(): Promise<any[]> {
        return this.request('/sellers/withdrawals');
    },

    // ==========================================
    // ADMINISTRATIVE CONFIGURATOR
    // ==========================================
    async getAdminAnalytics(): Promise<any> {
        return this.request('/admin/analytics');
    },

    async getPendingSellers(): Promise<any[]> {
        return this.request('/admin/sellers/pending');
    },

    async approveSeller(sellerId: string, approve: boolean): Promise<any> {
        return this.request(`/admin/sellers/${sellerId}/approve`, 'PUT', { approve });
    },

    async approveProduct(productId: string, approve: boolean): Promise<any> {
        return this.request(`/admin/products/${productId}/approve`, 'PUT', { approve });
    },

    async createCoupon(data: any): Promise<any> {
        return this.request('/admin/coupons', 'POST', data);
    },

    async refundOrder(orderId: string, amount: number, reason: string): Promise<any> {
        return this.request(`/admin/orders/${orderId}/refund`, 'POST', { amount, reason });
    }
};
