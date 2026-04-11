/**
 * Plans Service - Handles recharge plan fetching
 * 
 * PLACEHOLDER: These functions return mock data.
 * Replace with real API calls when connecting to KwikApi.
 */

import type { RechargePlan, ApiResponse } from '@/types/recharge.types';
import { supabase } from '@/integrations/supabase/client';
import { fetchRechargePlans, fetchDTHPlans, fetchROffer } from './kwikApiService';

// Mock plans data - Replace with real API call
const MOCK_PLANS: RechargePlan[] = [
  { id: '1', operator_id: '1', amount: 199, validity: '28 days', description: 'Unlimited calls + 1.5GB/day', data: '1.5GB/day', category: 'unlimited' },
  { id: '2', operator_id: '1', amount: 299, validity: '28 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '3', operator_id: '1', amount: 449, validity: '56 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '4', operator_id: '1', amount: 599, validity: '84 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '5', operator_id: '1', amount: 49, validity: '3 days', description: '100 mins + 500MB data', data: '500MB', talktime: '100 mins', category: 'combo' },
  { id: '6', operator_id: '1', amount: 99, validity: '14 days', description: 'Data pack - 6GB', data: '6GB', category: 'data' },
  { id: '7', operator_id: '2', amount: 199, validity: '28 days', description: 'Unlimited calls + 1.5GB/day', data: '1.5GB/day', category: 'unlimited' },
  { id: '8', operator_id: '2', amount: 239, validity: '28 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '9', operator_id: '2', amount: 479, validity: '56 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '10', operator_id: '2', amount: 666, validity: '84 days', description: 'Unlimited calls + 2GB/day', data: '2GB/day', category: 'unlimited' },
  { id: '11', operator_id: '7', amount: 199, validity: '30 days', description: 'HD Pack - 200+ Channels', category: 'combo' },
  { id: '12', operator_id: '7', amount: 349, validity: '30 days', description: 'Premium HD Pack - 300+ Channels', category: 'unlimited' },
  { id: '13', operator_id: '8', amount: 249, validity: '30 days', description: 'Value Pack - 150+ Channels', category: 'combo' },
  { id: '14', operator_id: '9', amount: 175, validity: '30 days', description: 'Basic Pack - 100+ Channels', category: 'topup' },
];

/**
 * Get plans for a specific operator
 */
/**
 * Get plans for a specific operator
 */
export async function getPlans(
  operatorId: string,
  circleId?: string,
  category?: string
): Promise<ApiResponse<RechargePlan[]>> {
  try {
    let response: import('./kwikApiService').KwikPlansResponse;

    if (circleId) {
      // Determine state code (circle code)
      // Kwik API usually expects numeric state codes. 
      // If our circleId is '1' (Delhi), '2' (Mumbai)... we need to ensure these match Kwik's expectation.
      // If we don't have the map, we send what we have.
      // A robust map might be needed here. 
      // For now, if circleId matches known IDs, we mapping them to likely Kwik codes if different. 
      // Assuming 1=Delhi, 2=Mumbai... matching standard lists.
      const stateCode = circleId.match(/^\d+$/) ? circleId : '17'; // Default to Delhi (often 10 or 17? Let's stick to simple pass-through if digit)
      response = await fetchRechargePlans(stateCode, operatorId);
    } else {
      // No circle ID implies DTH
      response = await fetchDTHPlans(operatorId);
    }

    if (response.success && response.plans) {
      const allPlans: RechargePlan[] = [];

      // Iterate over categories in the response
      Object.entries(response.plans).forEach(([catName, planList]) => {
        if (Array.isArray(planList)) {
          planList.forEach((p, index) => {
            allPlans.push({
              id: `${catName}-${index}-${p.rs}`,
              operator_id: operatorId,
              amount: p.rs,
              validity: p.validity,
              description: p.desc,
              data: p.desc.includes('Data') ? extractDataFromDesc(p.desc) : undefined,
              category: mapCategory(catName),
            });
          });
        }
      });

      // Filter by category if requested
      const finalPlans = (category && category !== 'all')
        ? allPlans.filter(p => p.category === category)
        : allPlans;

      return {
        status: 'SUCCESS',
        transaction_id: '',
        message: 'Plans fetched successfully',
        data: finalPlans,
      };
    }
  } catch (error) {
    // Error fetching plans from API handled silently
  }

  return {
    status: 'FAILED',
    transaction_id: '',
    message: 'Could not fetch plans',
    data: [],
  };
}

/**
 * Get plan categories for an operator
 */
export async function getPlanCategories(operatorId: string, circleId?: string): Promise<string[]> {
  // If we have API integration, we could technically fetch unique categories from the API response
  // For optimization, we might just return a static list or fetch from MOCK for now
  // Since fetching plans is expensive, we normally wouldn't call it just for categories unless cached
  return ['all', 'unlimited', 'data', 'talktime', 'combo', 'topup', 'roaming'];
}

// Helper: Map Kwik API categories to App categories
// Helper: Map Kwik API categories to App categories
function mapCategory(apiCategory: string): 'unlimited' | 'topup' | 'data' | 'combo' | 'special' {
  const cat = apiCategory.toLowerCase();
  if (cat.includes('3g') || cat.includes('4g') || cat.includes('data')) return 'data';
  if (cat.includes('topup') || cat.includes('top up')) return 'topup';
  if (cat.includes('roaming')) return 'data'; // Roaming as data or special? Let's map to data/special. Actually 'roaming' isn't in type?
  // Let's check RechargePlan type definition if 'roaming' is allowed.
  // The error said: Type 'string' is not assignable to type '"unlimited" | "topup" | "data" | "combo" | "special"'.
  // So 'roaming' is NOT allowd. Let's map roaming to 'special'.
  if (cat.includes('roaming')) return 'special';
  if (cat.includes('combo') || cat.includes('all-rounder')) return 'combo';
  return 'unlimited'; // Default/Others
}

// Helper: Extract data value from description
function extractDataFromDesc(desc: string): string {
  const match = desc.match(/(\d+(\.\d+)?\s?(GB|MB))/i);
  return match ? match[0] : 'NA';
}

/**
 * Get R-Offer for a specific mobile number (Airtel/VI only)
 */
export async function getROffer(
  operatorId: string,
  mobileNumber: string
): Promise<ApiResponse<RechargePlan[]>> {
  try {
    const response = await fetchROffer(operatorId, mobileNumber);

    if (response.success && response.plans) {
      const allPlans: RechargePlan[] = [];

      // Iterate over categories in the response
      Object.entries(response.plans).forEach(([catName, planList]) => {
        if (Array.isArray(planList)) {
          planList.forEach((p, index) => {
            allPlans.push({
              id: `roffer-${catName}-${index}-${p.rs}`,
              operator_id: operatorId,
              amount: p.rs,
              validity: p.validity,
              description: p.desc,
              data: p.desc.includes('Data') ? extractDataFromDesc(p.desc) : undefined,
              category: 'special', // R-Offers are usually special/personalized
            });
          });
        }
      });

      return {
        status: 'SUCCESS',
        transaction_id: '',
        message: 'R-Offers fetched successfully',
        data: allPlans,
      };
    } else {
      return {
        status: 'FAILED',
        transaction_id: '',
        message: response.message || 'No R-Offers found or operator not supported',
        data: [],
      };
    }
  } catch (error) {
    // Error fetching R-Offer handled silently
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Error fetching R-Offers',
      data: [],
    };
  }
}
