// src/lib/auth.ts — exactamente como muestran los docs de Neon Auth
// El import viene del shim local (alias de Vite → src/lib/neon-sdk/auth.ts)
import { createAuthClient } from "@neondatabase/neon-js/auth";

export const authClient = createAuthClient(
  import.meta.env.VITE_NEON_AUTH_URL
);
