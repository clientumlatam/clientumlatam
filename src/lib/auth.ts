// Neon Auth configuration — URL exposed through backend proxy endpoints
// /api/auth/neon-login and /api/auth/neon-register
// No SDK needed: auth is handled via REST API calls through the backend

export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL as string ||
  "https://ep-plain-bread-achv6ed0.neonauth.sa-east-1.aws.neon.tech/neondb/auth";
