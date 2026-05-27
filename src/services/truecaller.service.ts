import { supabase } from '@/integrations/supabase/client';

export interface TruecallerProfile {
  phoneNumbers: string[];
  avatarUrl?: string;
  aboutMe?: string;
  jobTitle?: string;
  companyName?: string;
  isActive: boolean;
  gender: string;
  badges: string[];
  name: {
    first: string;
    last: string;
  };
}

/**
 * Fetches the real profile name associated with a phone number from the database.
 * Matches profiles or past transactions to render verified names.
 * If not available, returns null (does not show mock names) as per specification.
 *
 * @param {string} mobileNumber - 10-digit mobile number to resolve profile for
 * @returns {Promise<TruecallerProfile | null>}
 */
export async function fetchTruecallerProfileSimulated(mobileNumber: string): Promise<TruecallerProfile | null> {
  const cleanNum = mobileNumber.replace(/\D/g, '');
  if (cleanNum.length < 10) return null;

  try {
    // 1. Try to find a registered user with this phone number in profiles
    const possibleNumbers = [
      cleanNum,
      `+91${cleanNum}`,
      `91${cleanNum}`,
      `0${cleanNum}`
    ];

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .in('phone', possibleNumbers)
      .maybeSingle();

    if (profile && profile.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      const first = parts[0] || 'User';
      const last = parts.slice(1).join(' ') || '';
      
      return {
        phoneNumbers: [cleanNum],
        isActive: true,
        gender: 'Not specified',
        badges: ['verified'],
        name: { first, last }
      };
    }

    // 2. Fallback: Search the transactions record for any previous successful recharges or references to this number
    const { data: txn } = await supabase
      .from('transactions')
      .select('metadata')
      .eq('mobile_number', cleanNum)
      .eq('status', 'SUCCESS')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (txn && txn.metadata) {
      const metadata = txn.metadata as any;
      if (metadata.customer_name || metadata.name) {
        const fullName = metadata.customer_name || metadata.name;
        const parts = fullName.trim().split(/\s+/);
        const first = parts[0] || 'User';
        const last = parts.slice(1).join(' ') || '';

        return {
          phoneNumbers: [cleanNum],
          isActive: true,
          gender: 'Not specified',
          badges: ['verified'],
          name: { first, last }
        };
      }
    }
  } catch (err) {
    console.error('Error fetching real truecaller profile:', err);
  }

  // If not available, don't show the name (return null)
  return null;
}
