/**
 * Operator Service - Handles operator and circle detection
 * 
 * PLACEHOLDER: These functions return mock data.
 * Replace with real API calls when connecting to KwikApi.
 */

import type { Operator, Circle, ApiResponse } from '@/types/recharge.types';
import { supabase } from '@/integrations/supabase/client';

import { fetchKwikOperators, fetchOperatorDetails, KwikOperator } from './kwikApiService';

/**
 * Get all operators by type
 */

// Mock operators data - Replace with real API call
const MOCK_OPERATORS: Operator[] = [
  { id: '1', name: 'Airtel', code: 'AIRTEL', type: 'prepaid', logo: '/operators/airtel.svg' },
  { id: '2', name: 'Jio', code: 'JIO', type: 'prepaid', logo: '/operators/jio.svg' },
  { id: '3', name: 'Vi', code: 'VI', type: 'prepaid', logo: '/operators/vi.svg' },
  { id: '4', name: 'BSNL', code: 'BSNL', type: 'prepaid', logo: '/operators/bsnl.svg' },
  { id: '5', name: 'Airtel Postpaid', code: 'AIRTEL_POST', type: 'postpaid', logo: '/operators/airtel.svg' },
  { id: '6', name: 'Jio Postpaid', code: 'JIO_POST', type: 'postpaid', logo: '/operators/jio.svg' },
  { id: '7', name: 'Tata Play', code: 'TATAPLAY', type: 'dth', logo: '/operators/tataplay.png' },
  { id: '8', name: 'Airtel DTH', code: 'AIRTEL_DTH', type: 'dth', logo: '/operators/airtel-dth.jpg' },
  { id: '9', name: 'Dish TV', code: 'DISH', type: 'dth', logo: '/operators/dishtv.png' },
  { id: '10', name: 'Videocon D2H', code: 'D2H', type: 'dth', logo: '/operators/videocon-d2h.png' },
  { id: '11', name: 'Sun Direct', code: 'SUN', type: 'dth', logo: '/operators/sun-direct.png' },
];

// Mock circles data - Replace with real API call
const MOCK_CIRCLES: Circle[] = [
  { id: '1', name: 'Delhi NCR', code: 'DL' },
  { id: '2', name: 'Mumbai', code: 'MH' },
  { id: '3', name: 'Karnataka', code: 'KA' },
  { id: '4', name: 'Tamil Nadu', code: 'TN' },
  { id: '5', name: 'Andhra Pradesh', code: 'AP' },
  { id: '6', name: 'Gujarat', code: 'GJ' },
  { id: '7', name: 'Maharashtra', code: 'MH' },
  { id: '8', name: 'West Bengal', code: 'WB' },
  { id: '9', name: 'Uttar Pradesh East', code: 'UPE' },
  { id: '10', name: 'Uttar Pradesh West', code: 'UPW' },
];

/**
 * Get all operators by type
 */
export async function getOperators(type?: 'prepaid' | 'postpaid' | 'dth'): Promise<Operator[]> {
  try {
    const kwikOperators = await fetchKwikOperators();

    // Map Kwik operators to app Operator type
    const operators: Operator[] = kwikOperators.map((op) => {
      const rawType = op.service_type.toLowerCase();
      const mappedType = rawType.includes('prepaid') ? 'prepaid' 
                       : rawType.includes('postpaid') ? 'postpaid' 
                       : rawType.includes('dth') ? 'dth' 
                       : rawType as any;
      const rawName = op.operator_name.toLowerCase();
      let logoFile: string | undefined = undefined;

      if (mappedType === 'dth') {
        if (rawName.includes('tata')) logoFile = 'tataplay.png';
        else if (rawName.includes('airtel')) logoFile = 'airtel-dth.jpg';
        else if (rawName.includes('dish')) logoFile = 'dishtv.png';
        else if (rawName.includes('sun')) logoFile = 'sun-direct.png';
        else if (rawName.includes('videocon') || rawName.includes('d2h')) logoFile = 'videocon-d2h.png';
      } else {
        if (rawName.includes('airtel')) logoFile = 'airtel.svg';
        else if (rawName.includes('jio')) logoFile = 'jio.svg';
        else if (rawName.includes('vi') || rawName.includes('vodafone')) logoFile = 'vi.svg';
        else if (rawName.includes('bsnl')) logoFile = 'bsnl.svg';
      }

      return {
        id: op.operator_id,
        name: op.operator_name,
        code: op.operator_id, // Using ID as unique code
        type: mappedType,
        logo: logoFile ? `/operators/${logoFile}` : undefined
      };
    });

    // If API returns empty (e.g. invalid key or other issue)
    if (operators.length === 0) {
      return [];
    }

    if (type) {
      return operators.filter(op => op.type === type);
    }

    // Filter to supported types only if returning all
    return operators.filter(op => ['prepaid', 'postpaid', 'dth'].includes(op.type));
  } catch (error) {
    return [];
  }
}

/**
 * Get all circles
 */
export async function getCircles(): Promise<Circle[]> {
  // TODO: Replace with real API call
  // const response = await supabase.functions.invoke('get-circles');

  return MOCK_CIRCLES;
}

/**
 * Auto-detect operator from mobile number
 * Uses number prefix to determine operator
 */
/**
 * Auto-detect operator from mobile number
 * Uses Kwik API to detect operator
 */
export async function detectOperator(mobileNumber: string): Promise<ApiResponse<{ operator: Operator; circle: Circle } | null>> {
  if (mobileNumber.length < 4) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Invalid mobile number',
      data: null,
    };
  }

  try {
    // 1. Try Kwik API
    const kwikResult = await fetchOperatorDetails(mobileNumber);

    if (kwikResult.success && kwikResult.details) {
      const apiOpName = kwikResult.details.provider;
      const apiCircleName = kwikResult.details.circle_name;

      // Fetch latest operators to match against
      const operators = await getOperators('prepaid');
      // Match operator by name (loose matching)
      const matchedOp = operators.find(op =>
        op.name.toLowerCase().includes(apiOpName.toLowerCase()) ||
        apiOpName.toLowerCase().includes(op.name.toLowerCase())
      );

      // Find circle (using mock circles for now as we don't have circle API yet)
      const circles = await getCircles();
      const matchedCircle = circles.find(c =>
        c.name.toLowerCase().includes(apiCircleName.toLowerCase()) ||
        apiCircleName.toLowerCase().includes(c.name.toLowerCase())
      ) || circles[0]; // Default to first if not found

      if (matchedOp) {
        // Ensure we pass the ID that getPlans expects
        return {
          status: 'SUCCESS',
          transaction_id: '',
          message: 'Operator detected successfully',
          data: {
            operator: matchedOp,
            circle: matchedCircle,
          },
        };
      }
    }
  } catch (error) {
    // API operator detection failed silently
  }

  return {
    status: 'FAILED',
    transaction_id: '',
    message: 'Could not detect operator',
    data: null,
  };
}
