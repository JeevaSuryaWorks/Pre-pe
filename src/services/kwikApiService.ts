import { API_BASE_URL } from '@/utils/api-config';

const PROXY_URL = `${API_BASE_URL}/kwik-proxy`;


export interface KwikOperator {
    operator_name: string;
    operator_id: string;
    service_type: string;
    status: string;
    biller_status: string;
    bill_fetch: string;
    supportValidation: string;
    bbps_enabled: string;
    message: string;
    description: string;
    amount_minimum: string;
    amount_maximum: string;
}

export interface KwikResponse {
    status: string;
    response: KwikOperator[];
}

export const fetchKwikOperators = async (): Promise<KwikOperator[]> => {
    // HARDCODED TO SAVE API CALLS
    return [
        { operator_name: "Airtel Prepaid", operator_id: "1", service_type: "MOBILE_PREPAID", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "BSNL Prepaid", operator_id: "2", service_type: "MOBILE_PREPAID", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Jio Prepaid", operator_id: "3", service_type: "MOBILE_PREPAID", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Vi Prepaid", operator_id: "4", service_type: "MOBILE_PREPAID", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Airtel Postpaid", operator_id: "14", service_type: "MOBILE_POSTPAID", status: "1", biller_status: "1", bill_fetch: "1", supportValidation: "1", bbps_enabled: "1", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "BSNL Postpaid", operator_id: "29", service_type: "MOBILE_POSTPAID", status: "1", biller_status: "1", bill_fetch: "1", supportValidation: "1", bbps_enabled: "1", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Jio Postpaid", operator_id: "172", service_type: "MOBILE_POSTPAID", status: "1", biller_status: "1", bill_fetch: "1", supportValidation: "1", bbps_enabled: "1", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Vi Postpaid", operator_id: "22", service_type: "MOBILE_POSTPAID", status: "1", biller_status: "1", bill_fetch: "1", supportValidation: "1", bbps_enabled: "1", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Tata Play", operator_id: "13", service_type: "DTH", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Airtel DTH", operator_id: "11", service_type: "DTH", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Dish TV", operator_id: "12", service_type: "DTH", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Videocon D2H", operator_id: "28", service_type: "DTH", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" },
        { operator_name: "Sun Direct", operator_id: "16", service_type: "DTH", status: "1", biller_status: "1", bill_fetch: "0", supportValidation: "0", bbps_enabled: "0", message: "", description: "", amount_minimum: "10", amount_maximum: "10000" }
    ];
};

const callProxy = async (endpoint: string, params?: Record<string, any>, method: 'GET' | 'POST' = 'GET') => {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, params, method }),
            // @ts-ignore
            signal: AbortSignal.timeout(20000) // 20 seconds frontend timeout
        });
        return await response.json();
    } catch (error: any) {
        // Transparent fallback to production proxy if local dev proxy fails
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isRelativeUrl = PROXY_URL.startsWith('/') || PROXY_URL.includes('localhost') || PROXY_URL.includes('127.0.0.1');
        
        if (isLocalHost || isRelativeUrl) {
            try {
                console.warn('[Proxy Fallback] Local proxy unreachable. Retrying via production proxy...');
                const fallbackUrl = 'https://api.pre-pe.com/api/kwik-proxy';
                const response = await fetch(fallbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint, params, method }),
                    // @ts-ignore
                    signal: AbortSignal.timeout(15000)
                });
                return await response.json();
            } catch (fallbackError) {
                console.error('[Proxy Fallback] Production proxy also unreachable:', fallbackError);
            }
        }

        if (error.name === 'TimeoutError') {
            throw new Error('Provider response timed out. Please check history.');
        }
        throw error;
    }
};

export interface KwikBalanceResponse {
    response: {
        balance: string;
        plan_credit: string;
    };
}

export const fetchWalletBalance = async (): Promise<{ balance: string; plan_credit: string } | null> => {
    try {
        const data = await callProxy('/balance.php');
        return data.response;
    } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        return null;
    }
};

export interface KwikRechargeRequest {
    number: string;
    amount: number;
    operator_id: string;
    circle_id?: string;
    client_id: string;
}

export interface KwikRechargeResponse {
    status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'ERROR';
    message: string;
    response?: {
        order_id: string;
        operator_id: string;
        balance: string;
        status: string;
        message: string;
    };
}

export const performRecharge = async (request: KwikRechargeRequest): Promise<KwikRechargeResponse> => {
    try {
        return await callProxy('/recharge.php', {
            number: request.number,
            amount: request.amount.toString(),
            opid: request.operator_id,
            order_id: request.client_id,
            state_code: request.circle_id || '0'
        }, 'GET');
    } catch (error) {
        return { status: 'FAILED', message: 'Network or Server Error' };
    }
};

export interface KwikStatusResponse {
    response: {
        order_id: string;
        operator_ref: string;
        opr_id: string;
        status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
        number: string;
        amount: string;
        service: string;
        charged_amount: string;
        closing_balance: string;
        available_balance: string;
        pid: string;
        date: string;
        message?: string;
    };
}

export const fetchTransactionStatus = async (orderId: string): Promise<KwikStatusResponse | null> => {
    try {
        return await callProxy('/status.php', { order_id: orderId }, 'GET');
    } catch (error) {
        return null;
    }
};

export interface KwikTransaction {
    trx_id: string;
    your_id: string | null;
    number: string;
    number2: string | null;
    ref_id: string;
    amount: string;
    charged_amount: string;
    date: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'CREDIT' | 'REVERSAL';
    service: string;
}

export const fetchRecentTransactions = async (): Promise<KwikTransaction[]> => {
    try {
        const data = await callProxy('/transactions.php', {}, 'GET');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
};

export interface KwikOperatorFetchResponse {
    success: boolean;
    message: string;
    details?: {
        provider: string;
        opid: string;
        circle_name: string;
        circle_code?: string;
    };
}

export const fetchOperatorDetails = async (mobileNumber: string): Promise<KwikOperatorFetchResponse> => {
    try {
        const data = await callProxy('/operator_fetch_v2.php', { number: mobileNumber }, 'POST');
        return data as KwikOperatorFetchResponse;
    } catch (error) {
        return { success: false, message: 'Network Error' };
    }
};

export interface KwikPlan {
    Type: string;
    rs: number;
    validity: string;
    desc: string;
}

export interface KwikPlansResponse {
    success: boolean;
    hit_credit?: string;
    api_started?: string;
    api_expiry?: string;
    operator?: string;
    circle?: string;
    message?: string;
    plans?: Record<string, KwikPlan[]>;
}

export const fetchRechargePlans = async (stateCode: string, operatorId: string): Promise<KwikPlansResponse> => {
    try {
        return await callProxy('/recharge_plans.php', { state_code: stateCode, opid: operatorId }, 'POST');
    } catch (error) {
        return { success: false, message: 'Network Error' };
    }
};

export const fetchDTHPlans = async (operatorId: string): Promise<KwikPlansResponse> => {
    try {
        return await callProxy('/DTH_plans.php', { opid: operatorId }, 'POST');
    } catch (error) {
        return { success: false, message: 'Network Error' };
    }
};

export interface DTHCustomerInfoResponse {
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    message: string;
    response?: {
        operator_id: string;
        customer_id: string;
        info: {
            balance: string;
            customerName: string;
            status: string;
            NextRechargeDate: string;
            lastrechargeamount: string;
            lastrechargedate: string;
            planname: string;
            monthlyRecharge: string;
        }[];
    };
}

export const fetchDTHCustomerDetails = async (operatorId: string, customerId: string): Promise<DTHCustomerInfoResponse> => {
    try {
        return await callProxy('/dth_customer_info.php', { opid: operatorId, customer_id: customerId }, 'POST');
    } catch (error) {
        return { status: 'FAILED', message: 'Network Error' };
    }
};

export const fetchROffer = async (operatorId: string, mobileNumber: string): Promise<KwikPlansResponse> => {
    try {
        return await callProxy('/R-OFFER_check.php', { opid: operatorId, mobile: mobileNumber }, 'POST');
    } catch (error) {
        return { success: false, message: 'Network Error' };
    }
};

export interface KwikBillPaymentRequest {
    number: string;
    amount: number;
    operator_id: string;
    order_id: string;
    mobile: string;
    reference_id?: string;
}

export const payBill = async (request: KwikBillPaymentRequest): Promise<KwikRechargeResponse> => {
    try {
        return await callProxy('/bills/payments.php', {
            number: request.number,
            amount: request.amount.toString(),
            opid: request.operator_id,
            order_id: request.order_id,
            mobile: request.mobile,
            opt8: 'Bills',
            ...(request.reference_id ? { refrence_id: request.reference_id } : {})
        }, 'GET');
    } catch (error) {
        return { status: 'FAILED', message: 'Network or Server Error' };
    }
};

export interface KwikPayoutRequest {
    account_no: string;
    amount: number;
    order_id: string;
    ifsc_code: string;
    bene_name: string;
}

export interface KwikPayoutResponse {
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ERROR';
    message: string;
    response?: any;
}

export const processPayout = async (request: KwikPayoutRequest): Promise<KwikPayoutResponse> => {
    try {
        return await callProxy('/payments/index.php', {
            account_no: request.account_no,
            amount: request.amount.toString(),
            order_id: request.order_id,
            ifsc_code: request.ifsc_code,
            bene_name: request.bene_name
        }, 'POST');
    } catch (error) {
        return { status: 'FAILED', message: 'Network or Server Error' };
    }
};

export interface KwikValidationRequest {
    number: string;
    account: string;
    ifsc: string;
    order_id: string;
}

export interface KwikValidationResponse {
    success: boolean;
    status: string;
    message: string;
    order_id: string;
    utr?: string;
    ben_name?: string;
    verify_status?: string;
}

export const validateBankAccount = async (request: KwikValidationRequest): Promise<KwikValidationResponse> => {
    try {
        return await callProxy('/dmt/account_validate_route2', {
            number: request.number,
            account: request.account,
            ifsc: request.ifsc,
            order_id: request.order_id
        }, 'POST');
    } catch (error) {
        return { success: false, status: 'FAILED', message: 'Network Error', order_id: request.order_id };
    }
};

export interface KwikBillFetchRequest {
    number: string;
    operator_id: string;
    order_id: string;
    mobile: string;
    opt1?: string;
    opt2?: string;
    opt3?: string;
    opt4?: string;
    opt5?: string;
    opt6?: string;
    opt7?: string;
    opt8?: string;
    opt9?: string;
    opt10?: string;
}

export interface KwikBillFetchResponse {
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ERROR';
    message: string;
    response?: {
        due_amount?: string;
        customer_name?: string;
        bill_date?: string;
        due_date?: string;
        ref_id?: string;
        [key: string]: any;
    };
}

export const fetchBill = async (request: KwikBillFetchRequest): Promise<KwikBillFetchResponse> => {
    try {
        return await callProxy('/bills/validation.php', {
            number: request.number,
            opid: request.operator_id,
            order_id: request.order_id,
            mobile: request.mobile,
            ...(request.opt1 ? { opt1: request.opt1 } : {}),
            ...(request.opt2 ? { opt2: request.opt2 } : {}),
            ...(request.opt3 ? { opt3: request.opt3 } : {}),
            ...(request.opt4 ? { opt4: request.opt4 } : {}),
            ...(request.opt5 ? { opt5: request.opt5 } : {}),
            ...(request.opt6 ? { opt6: request.opt6 } : {}),
            ...(request.opt7 ? { opt7: request.opt7 } : {}),
            ...(request.opt8 ? { opt8: request.opt8 } : {}),
            ...(request.opt9 ? { opt9: request.opt9 } : {}),
            ...(request.opt10 ? { opt10: request.opt10 } : {})
        }, 'GET');
    } catch (error) {
        return { status: 'FAILED', message: 'Network Error' };
    }
};

export interface KwikBillerDetailsResponse {
    success: boolean;
    message: string;
    details?: any;
}

export const fetchBillerDetails = async (operatorId: string): Promise<KwikBillerDetailsResponse> => {
    try {
        return await callProxy('/operatorFetch.php', { opid: operatorId }, 'POST');
    } catch (error) {
        return { success: false, message: 'Network Error' };
    }
};

export interface KwikCircleCodesResponse {
    status: string;
    response?: {
        circle_code: string;
        circle_name: string;
    }[];
    message?: string;
}

export const fetchCircleCodes = async (): Promise<KwikCircleCodesResponse> => {
    try {
        return await callProxy('/circle_codes.php', {}, 'GET');
    } catch (error) {
        return { status: 'FAILED', message: 'Network Error' };
    }
};

export interface KwikIPDetectResponse {
    success: boolean;
    your_ip?: string;
    message?: string;
}

export const detectIP = async (): Promise<KwikIPDetectResponse> => {
    try {
        return await callProxy('/ip_detect.php', {}, 'GET');
    } catch (error) {
        return { success: false, message: 'Network Error' };
    }
};

