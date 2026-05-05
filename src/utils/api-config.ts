/**
 * Centralized API Base URL configuration
 * Ensures the /api prefix is present for all backend calls
 */

const getApiBaseUrl = (): string => {
  // Try different env variables used across the app
  let url = import.meta.env.VITE_API_BASE_URL || 
            import.meta.env.VITE_API_URL || 
            'http://localhost:3000';
            
  // Ensure the URL ends with /api
  if (!url.endsWith('/api')) {
    url = url.endsWith('/') ? `${url}api` : `${url}/api`;
  }
  
  return url;
};

export const API_BASE_URL = getApiBaseUrl();
