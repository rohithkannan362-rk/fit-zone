/**
 * FIT ZONE — Environment-Aware Authentication URL Utilities
 * 
 * Provides production-safe, environment-aware callback URLs for:
 * - Google OAuth signInWithOAuth
 * - Supabase password reset
 * 
 * Production guarantees:
 * - Production builds NEVER redirect to localhost under any circumstances.
 * - Local development continues working seamlessly on http://localhost:5173.
 */

export const PRODUCTION_APP_URL = "https://fit-zone-7d3n.vercel.app";
export const LOCAL_DEV_APP_URL = "http://localhost:5173";

/**
 * Returns the sanitized base URL of the application.
 */
export const getAppBaseUrl = (): string => {
  // 1. Check explicit VITE_APP_URL environment variable
  const envUrl = import.meta.env.VITE_APP_URL?.trim();
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, "");
    
    // Safety enforcement: If running in production mode, never allow localhost
    if (import.meta.env.PROD) {
      if (cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1")) {
        console.warn(
          "[Auth] Localhost detected in VITE_APP_URL in production build. Falling back to:",
          PRODUCTION_APP_URL
        );
        return PRODUCTION_APP_URL;
      }
    }
    return cleanUrl;
  }

  // 2. Check window.location.origin in browser environments
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, "");

    // Safety enforcement: Never allow localhost origin in production mode
    if (import.meta.env.PROD) {
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.warn(
          "[Auth] Localhost window.location.origin detected in production build. Falling back to:",
          PRODUCTION_APP_URL
        );
        return PRODUCTION_APP_URL;
      }
      return origin;
    }

    return origin;
  }

  // 3. Fallback based on build environment
  if (import.meta.env.PROD) {
    return PRODUCTION_APP_URL;
  }

  return LOCAL_DEV_APP_URL;
};

/**
 * Returns the exact, environment-aware OAuth callback URL.
 * e.g.:
 * Local dev:    http://localhost:5173/auth/callback
 * Production:   https://fit-zone-7d3n.vercel.app/auth/callback
 */
export const getOAuthCallbackUrl = (): string => {
  return `${getAppBaseUrl()}/auth/callback`;
};

/**
 * Returns the environment-aware password reset redirect URL.
 */
export const getPasswordResetCallbackUrl = (): string => {
  return `${getAppBaseUrl()}/reset-password`;
};
