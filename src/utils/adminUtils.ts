/**
 * Admin Utils - Centralized Source of Truth for Admin Privileges
 */

export const ADMIN_EMAILS = [
    'connect.prepe@gmail.com',
    'prepeindia@zohomail.in',
    'Prepeindia@outlook.com'
];

/**
 * Checks if the given email is part of the authorized administrators.
 * Performs a case-insensitive match for security.
 */
export const isAdmin = (email?: string | null): boolean => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
};
