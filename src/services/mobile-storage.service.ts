import { Preferences } from '@capacitor/preferences';

/**
 * Custom Storage Adapter for Supabase to use Capacitor Preferences (Native Storage)
 * This ensures session persistence even if WebView clears localStorage.
 */
export const mobileStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};
