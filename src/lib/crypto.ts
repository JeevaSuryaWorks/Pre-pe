/**
 * Simple Encryption Utility for Sensitive KYC Data
 * Uses Web Crypto API for secure browser-based encryption.
 * Note: For a production system, keys should be managed via a KMS or Supabase Vault.
 */

const KEY_ALIAS = 'prepe_kyc_security_v1';

// In a real app, this should come from process.env or a secure vault
const SHARED_SECRET = import.meta.env.VITE_KYC_SECRET || 'prepe_default_secure_secret_32chars';

async function getEncryptionKey() {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SHARED_SECRET);

    // Hash the secret to ensure it's exactly 256 bits (32 bytes)
    const hashData = await window.crypto.subtle.digest('SHA-256', keyData);

    return await window.crypto.subtle.importKey(
        'raw',
        hashData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptSensitiveData(text: string): Promise<string> {
    if (!window.crypto || !window.crypto.subtle) {
        console.warn("[Crypto] window.crypto.subtle is not available. Falling back to plain Base64 encoding for development/non-secure context.");
        return btoa(text);
    }
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(text);

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );

    const exportData = new Uint8Array(iv.length + ciphertext.byteLength);
    exportData.set(iv);
    exportData.set(new Uint8Array(ciphertext), iv.length);

    // Convert to Base64
    return btoa(String.fromCharCode(...exportData));
}

export async function decryptSensitiveData(base64Data: string): Promise<string> {
    if (!window.crypto || !window.crypto.subtle) {
        console.warn("[Crypto] window.crypto.subtle is not available. Falling back to plain Base64 decoding.");
        try {
            return atob(base64Data);
        } catch (e) {
            return base64Data;
        }
    }
    try {
        const key = await getEncryptionKey();
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const iv = binaryData.slice(0, 12);
        const ciphertext = binaryData.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "DECRYPTION_ERROR";
    }
}

/**
 * Masking utility for Aadhaar as per RBI Guidelines
 * Show only last 4 digits: XXXX XXXX 1234
 */
export function maskAadhaar(aadhaar: string): string {
    if (!aadhaar) return "";
    const clean = aadhaar.replace(/\s/g, '');
    if (clean.length < 4) return aadhaar;
    return `XXXX XXXX ${clean.slice(-4)}`;
}

/**
 * Masking utility for PAN
 * Show: ABCDE1234F -> XXXXX1234F or ABCDE1234F (usually PAN isn't masked, but can be)
 */
export function maskPAN(pan: string): string {
    if (!pan) return "";
    if (pan.length < 5) return pan;
    return `${pan.slice(0, 5)}XXXX${pan.slice(-1)}`;
}
