import { supabase } from '@/integrations/supabase/client';

export interface KYCData {
    pan_number: string;
    aadhar_number: string;
    dob: string;
    gender: string;
    document_urls: {
        aadhar_front: string;
        aadhar_back: string;
        pan_card: string;
        selfie: string;
        shop_photo: string;
    };
}

export const submitKYC = async (userId: string, data: KYCData) => {
    const { error } = await supabase
        .from('kyc_verifications' as any)
        .insert({
            user_id: userId,
            pan_number: data.pan_number,
            aadhar_number: data.aadhar_number,
            dob: data.dob,
            gender: data.gender,
            document_urls: data.document_urls,
            status: 'PENDING'
        });

    if (error) throw error;
    return true;
};

export const uploadKYCDocument = async (userId: string, file: File, type: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

    if (uploadError) {
        throw uploadError;
    }

    // Get public URL (or use signed URL if private)
    // For now assuming we store the path and generate signed URLs on usage, 
    // but to keep it simple for the frontend 'submitted' view, we'll just return the path.
    return data.path;
};

export const getKYCStatus = async (userId: string) => {
    const { data, error } = await supabase
        .from('kyc_verifications' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}
