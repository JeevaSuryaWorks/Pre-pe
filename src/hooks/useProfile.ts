/**
 * This hook is now a wrapper around the ProfileContext.
 * All application components now share a single source of truth for user profiles.
 */
export { useProfile } from '@/contexts/ProfileContext';
export type { UserProfile } from '@/contexts/ProfileContext';
