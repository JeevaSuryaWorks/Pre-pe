-- Alter kyc_verifications table to allow null for pan_number (for Basic Plan users)
ALTER TABLE public.kyc_verifications ALTER COLUMN pan_number DROP NOT NULL;
