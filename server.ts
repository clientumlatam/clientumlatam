/// <reference lib="dom" />
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();
// En un Remix recién configurado, los secrets vienen de .env.local (generado por pull-secrets.mjs)
dotenv.config({ path: ".env.local", override: false });

const app = express();
// Trust Vercel's (and any other reverse proxy's) X-Forwarded-* headers so
// that req.secure, req.ip, and cookie Secure/SameSite behaviour work
// correctly in production. Without this, Express sees every request as HTTP
// even though the actual browser connection is HTTPS, which prevents Secure
// cookies from being set and silently breaks sessions behind Vercel's edge.
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

// This app only ever serves /api/* on Vercel (see vercel.json routes) — the
// SPA itself is served straight from the filesystem/CDN. Without this,
// Vercel's default "public, max-age=0, must-revalidate" caching header on
// serverless function responses lets its edge CDN treat auth responses as
// cacheable, which strips the Set-Cookie header before it reaches the
// browser. That silently breaks login/register in production (the session
// cookie never gets set) while working fine in local/dev. Force no-store on
// every API response so cookies always reach the client.
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// --- Auth: database pool, session store, and user routes ---
// This app is unified on Neon Postgres for both Replit dev and Vercel
// production, so the same database is used everywhere. If NEON_API_KEY and
// NEON_PROJECT_ID are set, the pooled connection string is resolved live
// from Neon's API (avoids hand-copying a connection string that can go
// stale if it's ever rotated). Otherwise falls back to DATABASE_URL
// (Replit's own internal Postgres) for local-only setups.
async function resolveDatabaseUrl(): Promise<string> {
  // Prefer an explicit connection string when available — fastest path.
  if (process.env.NEON_DATABASE_URL) {
    return process.env.NEON_DATABASE_URL;
  }
  const neonApiKey = process.env.NEON_API_KEY;
  const neonProjectId = process.env.NEON_PROJECT_ID;
  if (neonApiKey && neonProjectId) {
    const headers = { Authorization: `Bearer ${neonApiKey}`, Accept: "application/json" };
    const branchesRes = await fetch(`https://console.neon.tech/api/v2/projects/${neonProjectId}/branches`, { headers });
    if (!branchesRes.ok) throw new Error(`No se pudo listar branches de Neon (${branchesRes.status})`);
    const branches = await branchesRes.json();
    const branchId = branches.branches?.find((b: any) => b.default)?.id ?? branches.branches?.[0]?.id;
    if (!branchId) throw new Error("El proyecto Neon no tiene branches.");
    const uriRes = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}/connection_uri?branch_id=${branchId}&database_name=neondb&role_name=neondb_owner&pooled=true`,
      { headers }
    );
    if (!uriRes.ok) throw new Error(`No se pudo obtener el connection string de Neon (${uriRes.status})`);
    const data = await uriRes.json();
    if (!data.uri) throw new Error("Neon no devolvió un connection string.");
    return data.uri;
  }
  return process.env.DATABASE_URL ?? "";
}

const databaseUrl = await resolveDatabaseUrl();
// When no connection string is resolved (e.g. DATABASE_URL/Neon secrets not
// set), `pg` falls back to PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT, which
// point at Replit's own built-in Postgres for local development. That
// instance does not support SSL, so SSL must only be forced when we actually
// have an external (Neon) connection string that doesn't opt out via
// sslmode=disable.
const pgPool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: /sslmode=disable/i.test(databaseUrl) ? false : { rejectUnauthorized: false },
      }
    : {}
);
const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: string;
  }
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET no está configurado. Es requerido para las sesiones de autenticación.");
}

app.use(
  session({
    store: new PgSession({ pool: pgPool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    },
  })
);

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

// ---------------------------------------------------------------------------
// Email — Gmail SMTP via nodemailer
// ---------------------------------------------------------------------------
function createMailTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
  });
}

async function sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
  const transport = createMailTransport();
  if (!transport) throw new Error("SMTP no configurado (SMTP_USER / SMTP_PASS faltantes).");

  const baseUrl = process.env.APP_URL?.replace(/\/$/, "") || "https://clientum.com.ar";
  const resetUrl = `${baseUrl}?reset_token=${token}`;

  await transport.sendMail({
    from: `"Clientum CRM" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Restablecer contraseña — Clientum CRM",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B131D;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B131D;padding:48px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111C28;border:1px solid #1A2733;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#10B981;height:4px;"></td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Clientum CRM</p>
            <p style="margin:0 0 28px;font-size:12px;color:#4B5563;font-family:monospace;letter-spacing:2px;text-transform:uppercase;">Restablecer contraseña</p>
            <p style="margin:0 0 20px;font-size:15px;color:#9CA3AF;line-height:1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.<br>
              Hacé clic en el botón para crear una nueva contraseña. El enlace es válido por <strong style="color:#e5e7eb;">1 hora</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#10B981;border-radius:10px;">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                    Restablecer contraseña →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:12px;color:#4B5563;">Si no podés hacer clic, copiá este enlace:</p>
            <p style="margin:0 0 28px;font-size:12px;color:#6B7280;word-break:break-all;">${resetUrl}</p>
            <hr style="border:none;border-top:1px solid #1A2733;margin:0 0 20px;">
            <p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">
              Si no solicitaste restablecer tu contraseña, podés ignorar este correo. Tu contraseña actual sigue siendo válida.<br>
              <strong style="color:#4B5563;">Este enlace expira en 1 hora.</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;background:#0B131D;">
            <p style="margin:0;font-size:11px;color:#374151;text-align:center;">
              Clientum CRM · Patagonia, Argentina · <a href="https://clientum.com.ar" style="color:#4B5563;">clientum.com.ar</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Restablecer contraseña — Clientum CRM\n\nHacé clic en el siguiente enlace para crear una nueva contraseña (válido por 1 hora):\n\n${resetUrl}\n\nSi no solicitaste este cambio, podés ignorar este correo.`,
  });
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado." });
  }
  next();
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado." });
  }
  try {
    // Re-check the role from the DB on every request instead of trusting the
    // session snapshot, so a role change/demotion takes effect immediately
    // without requiring the user to log out and back in.
    const result = await pgPool.query("SELECT role FROM users WHERE id = $1", [req.session.userId]);
    const currentRole = result.rows[0]?.role;
    if (currentRole !== "admin") {
      return res.status(403).json({ error: "Se requiere rol de administrador." });
    }
    req.session.role = currentRole;
    next();
  } catch (error) {
    console.error("Error verificando rol de administrador:", error);
    return res.status(500).json({ error: "Ocurrió un error al verificar permisos." });
  }
}

// ---------------------------------------------------------------------------
// Santi SDR — API key middleware (server-to-server, Hermes → AI Prospector)
// ---------------------------------------------------------------------------
function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.header("x-api-key");
  if (!key || key !== process.env.SANTI_API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// ---------------------------------------------------------------------------
// CRM token middleware — server-to-server calls from the WordPress plugin.
// The plugin sends the shared CRM_INTERNAL_TOKEN in the X-CRM-Token header
// (same header and env var used by class-crm-proxy.php).
// ---------------------------------------------------------------------------
function requireCrmToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header("x-crm-token");
  const expected = process.env.CRM_INTERNAL_TOKEN;
  if (!expected) {
    // Misconfigured — fail closed so leads are never silently lost.
    return res.status(503).json({ error: "CRM webhook not configured (missing CRM_INTERNAL_TOKEN)." });
  }
  if (!token || token !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos." });
    }
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: "El usuario debe tener entre 3 y 32 caracteres (letras, números, . _ -)." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }

    const existing = await pgPool.query("SELECT id FROM users WHERE username = $1", [username]);
    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: "Ese usuario ya existe." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // The very first account created becomes admin so there's always someone
    // who can manage the Brochure/Contenido section; everyone after is "user".
    // Uses a single transaction with a table-level lock so two concurrent
    // first-registrations can't both observe count=0 and both become admin.
    const client = await pgPool.connect();
    let user: { id: number; username: string; role: string };
    try {
      await client.query("BEGIN");
      await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
      const { rows: countRows } = await client.query("SELECT COUNT(*)::int AS count FROM users");
      const role = countRows[0]?.count === 0 ? "admin" : "user";
      const inserted = await client.query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role",
        [username, passwordHash, role]
      );
      user = inserted.rows[0];
      await client.query("COMMIT");
    } catch (txError) {
      await client.query("ROLLBACK");
      throw txError;
    } finally {
      client.release();
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerando sesión tras registro:", err);
        return res.status(500).json({ error: "Error al iniciar sesión tras el registro." });
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Error guardando sesión tras registro:", saveErr);
          return res.status(500).json({ error: "Error al iniciar sesión tras el registro." });
        }
        return res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
      });
    });
  } catch (error: any) {
    console.error("Error en /api/auth/register:", error);
    return res.status(500).json({ error: "Ocurrió un error al registrar el usuario." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos." });
    }

    const result = await pgPool.query("SELECT id, username, password_hash, role FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    // Always run a hash comparison to reduce username-enumeration timing signal.
    const validHash = user?.password_hash || "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsal";
    const isValid = await bcrypt.compare(password, validHash);

    if (!user || !isValid) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerando sesión tras login:", err);
        return res.status(500).json({ error: "Error al iniciar sesión." });
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Error guardando sesión tras login:", saveErr);
          return res.status(500).json({ error: "Error al iniciar sesión." });
        }
        return res.json({ user: { id: user.id, username: user.username, role: user.role } });
      });
    });
  } catch (error: any) {
    console.error("Error en /api/auth/login:", error);
    return res.status(500).json({ error: "Ocurrió un error al iniciar sesión." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error cerrando sesión:", err);
      return res.status(500).json({ error: "Ocurrió un error al cerrar sesión." });
    }
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

// POST /api/auth/change-password — authenticated users only
app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Se requieren contraseña actual y nueva." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres." });
    }

    const userId = req.session.userId!;
    const result = await pgPool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash || "");
    if (!isValid) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta." });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pgPool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, userId]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error("[Auth] Error en change-password:", error.message);
    return res.status(500).json({ error: "Ocurrió un error al cambiar la contraseña." });
  }
});

// ─── NEON AUTH — email-based register / login ───────────────────────────────
// These endpoints proxy sign-up / sign-in to the actual Neon Auth (Better Auth)
// REST API server-side (avoids CORS, no SDK needed), then upsert the identity
// into our local `users` table so CRM role management keeps working.
// If VITE_NEON_AUTH_URL / NEON_AUTH_BASE_URL is not set the endpoints fall
// back to local bcrypt auth against our own users table.

const NEON_AUTH_BASE =
  process.env.NEON_AUTH_BASE_URL ||
  process.env.VITE_NEON_AUTH_URL ||
  "";

// After a successful Neon Auth call, upsert the identity into our `users`
// table and resolve the local row (id, username, role).
async function upsertNeonAuthUser(neonUser: {
  id: string;
  email: string;
  name?: string;
  passwordHash?: string; // optional local bcrypt hash for email-not-verified fallback
}): Promise<{ id: number; username: string; role: string }> {
  const email = neonUser.email.toLowerCase();

  // Try existing record (by neon_auth_id first, then email)
  const existing = await pgPool.query(
    `SELECT id, username, role
       FROM users
      WHERE neon_auth_id = $1 OR email = $2
      LIMIT 1`,
    [neonUser.id, email]
  );

  if ((existing.rowCount ?? 0) > 0) {
    const row = existing.rows[0];
    // Keep neon_auth_id and password_hash in sync
    const hashUpdate = neonUser.passwordHash ? neonUser.passwordHash : undefined;
    if (hashUpdate) {
      await pgPool.query(
        `UPDATE users SET neon_auth_id = $1, email = $2, password_hash = $3 WHERE id = $4`,
        [neonUser.id, email, hashUpdate, row.id]
      );
    } else {
      await pgPool.query(
        `UPDATE users SET neon_auth_id = $1, email = $2 WHERE id = $3`,
        [neonUser.id, email, row.id]
      );
    }
    return row;
  }

  // First-ever user → admin, everyone else → user
  const { rows: countRows } = await pgPool.query(
    "SELECT COUNT(*)::int AS count FROM users"
  );
  const role = countRows[0]?.count === 0 ? "admin" : "user";

  // Derive a username from name or email prefix, unique-ify if needed
  const rawBase =
    (neonUser.name?.trim() || email.split("@")[0])
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 28) || "user";
  const taken = await pgPool.query(
    "SELECT id FROM users WHERE username = $1",
    [rawBase]
  );
  const username =
    (taken.rowCount ?? 0) > 0
      ? `${rawBase}_${Math.floor(Math.random() * 9000) + 1000}`
      : rawBase;

  const inserted = await pgPool.query(
    `INSERT INTO users (username, password_hash, role, email, neon_auth_id)
          VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, role`,
    [username, neonUser.passwordHash || "", role, email, neonUser.id]
  );
  return inserted.rows[0];
}

// ── Local-only fallback (used when NEON_AUTH_BASE is not configured) ──────────
async function localNeonRegister(
  email: string,
  password: string,
  name?: string
): Promise<{ id: number; username: string; role: string }> {
  const existing = await pgPool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );
  if ((existing.rowCount ?? 0) > 0) {
    throw Object.assign(new Error("Ya existe una cuenta con ese email."), {
      status: 409,
    });
  }

  const rawBase =
    (name?.trim() || email.split("@")[0])
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 28) || "user";
  const taken = await pgPool.query(
    "SELECT id FROM users WHERE username = $1",
    [rawBase]
  );
  const username =
    (taken.rowCount ?? 0) > 0
      ? `${rawBase}_${Math.floor(Math.random() * 9000) + 1000}`
      : rawBase;

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
    const { rows: countRows } = await client.query(
      "SELECT COUNT(*)::int AS count FROM users"
    );
    const role = countRows[0]?.count === 0 ? "admin" : "user";
    const inserted = await client.query(
      `INSERT INTO users (username, password_hash, role, email)
            VALUES ($1, $2, $3, $4)
         RETURNING id, username, role`,
      [username, passwordHash, role, email]
    );
    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function localNeonLogin(
  email: string,
  password: string
): Promise<{ id: number; username: string; role: string }> {
  const result = await pgPool.query(
    "SELECT id, username, password_hash, role FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  const validHash =
    user?.password_hash ||
    "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsal";
  const isValid = await bcrypt.compare(password, validHash);
  if (!user || !isValid) {
    throw Object.assign(new Error("Email o contraseña incorrectos."), {
      status: 401,
    });
  }
  return user;
}

// ── Shared session-create helper ──────────────────────────────────────────────
// Returns a Promise so callers can await it and catch errors properly.
// A 5-second timeout guarantees the HTTP response is always sent even if the
// session-store callback never fires (e.g. DB connection drop).
function createSession(
  req: express.Request,
  res: express.Response,
  user: { id: number; username: string; role: string },
  statusCode = 200
): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error("[Session] Timeout guardando sesión — respondiendo sin cookie");
        res.status(200).json({ user: { id: user.id, username: user.username, role: user.role } });
      }
      resolve();
    }, 5000);

    req.session.regenerate((err) => {
      if (err) {
        clearTimeout(timeout);
        if (!res.headersSent)
          res.status(500).json({ error: "Error al crear la sesión." });
        return resolve();
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.save((saveErr) => {
        clearTimeout(timeout);
        if (!res.headersSent) {
          if (saveErr) {
            console.error("[Session] Error guardando sesión:", saveErr);
            // Still return the user — auth succeeded, session persistence failed
            res.status(200).json({ user: { id: user.id, username: user.username, role: user.role } });
          } else {
            res.status(statusCode).json({ user: { id: user.id, username: user.username, role: user.role } });
          }
        }
        resolve();
      });
    });
  });
}

// ── Register ──────────────────────────────────────────────────────────────────
app.post("/api/auth/neon-register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email y contraseña son requeridos." });
    }
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Email inválido." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }

    if (NEON_AUTH_BASE) {
      // ── Path A: Neon Auth as identity provider ──────────────────────────────
      // Always hash locally so we can fall back if email verification is required
      const localHash = await bcrypt.hash(password, 12);
      console.log("[NeonAuth] Registrando via Neon Auth REST API");
      const appOrigin = process.env.APP_URL || "https://clientum.com.ar";
      const neonRes = await fetch(`${NEON_AUTH_BASE}/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": appOrigin,
        },
        body: JSON.stringify({ email, password, name: name?.trim() || "" }),
      });
      const rawText = await neonRes.text();
      let neonData: any = {};
      try { if (rawText) neonData = JSON.parse(rawText); } catch { /* non-JSON body */ }
      console.log("[NeonAuth] sign-up status:", neonRes.status, "body:", rawText.slice(0, 300));

      // 409 or 422 = already registered in Neon Auth.
      // Update the local password_hash so the email-not-verified fallback works,
      // then create a session (works even when password_hash was previously empty).
      const alreadyExists =
        neonRes.status === 409 ||
        neonRes.status === 422 ||
        (rawText.includes("USER_ALREADY_EXISTS") || rawText.includes("user_already_exists"));
      if (alreadyExists) {
        console.log("[NeonAuth] Usuario ya existe en Neon Auth — actualizando hash local");
        const existing = await pgPool.query(
          "SELECT id, username, role FROM users WHERE email = $1 LIMIT 1",
          [email.toLowerCase()]
        );
        if ((existing.rowCount ?? 0) === 0) {
          return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
        }
        const localUser = existing.rows[0];
        // Store/refresh the bcrypt hash so local fallback can verify future logins
        await pgPool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [localHash, localUser.id]);
        return createSession(req, res, localUser, 200);
      }

      // INVALID_ORIGIN means Neon Auth doesn't accept our origin right now →
      // silently fall through to local-only registration.
      const isOriginRejected =
        neonRes.status === 403 &&
        (rawText.includes("INVALID_ORIGIN") || rawText.includes("Invalid origin") || rawText.includes("MISSING_ORIGIN"));
      if (isOriginRejected) {
        console.log("[NeonAuth] INVALID_ORIGIN — usando auth local como fallback");
        const localUser = await localNeonRegister(email.toLowerCase(), password, name);
        return createSession(req, res, localUser, 201);
      }

      if (!neonRes.ok) {
        const msg =
          neonData?.message ||
          neonData?.error?.message ||
          neonData?.error ||
          rawText.slice(0, 200) ||
          "Error al registrarse en Neon Auth.";
        return res.status(neonRes.status < 500 ? neonRes.status : 400).json({ error: String(msg) });
      }

      // neonData.user contains { id, email, name, ... }
      const neonUser = neonData.user ?? neonData;
      const localUser = await upsertNeonAuthUser({
        id: neonUser.id,
        email: neonUser.email ?? email,
        name: neonUser.name ?? name,
        passwordHash: localHash,
      });
      return createSession(req, res, localUser, 201);
    } else {
      // ── Path B: Local-only fallback ─────────────────────────────────────────
      console.log("[NeonAuth] NEON_AUTH_BASE no configurado — usando auth local");
      const localUser = await localNeonRegister(email.toLowerCase(), password, name);
      return createSession(req, res, localUser, 201);
    }
  } catch (error: any) {
    console.error("Error en /api/auth/neon-register:", error);
    const status = error.status ?? 500;
    return res
      .status(status)
      .json({ error: error.message || "Ocurrió un error al registrar la cuenta." });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/neon-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email y contraseña son requeridos." });
    }

    // ── Local-first: try bcrypt immediately (skips the ~4s Neon Auth round-trip)
    // Local hash is stored during registration. If it exists and matches,
    // we skip Neon Auth entirely. Only call Neon Auth when local hash is missing.
    const emailLower = email.toLowerCase();
    const localRow = await pgPool.query(
      "SELECT id, username, password_hash, role FROM users WHERE email = $1 LIMIT 1",
      [emailLower]
    );
    const localDbUser = localRow.rows[0];

    if (localDbUser?.password_hash && localDbUser.password_hash.length > 10) {
      // Local hash present — verify without hitting Neon Auth
      const isValid = await bcrypt.compare(password, localDbUser.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Email o contraseña incorrectos." });
      }
      console.log("[Auth] Login local exitoso para", emailLower);
      return createSession(req, res, { id: localDbUser.id, username: localDbUser.username, role: localDbUser.role }, 200);
    }

    if (NEON_AUTH_BASE) {
      // ── No local hash: call Neon Auth as fallback ────────────────────────────
      console.log("[NeonAuth] Sin hash local — intentando Neon Auth");
      const appOrigin = process.env.APP_URL || "https://clientum.com.ar";
      const neonRes = await fetch(`${NEON_AUTH_BASE}/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": appOrigin },
        body: JSON.stringify({ email, password }),
      });
      const rawText = await neonRes.text();
      let neonData: any = {};
      try { if (rawText) neonData = JSON.parse(rawText); } catch { /* non-JSON body */ }
      console.log("[NeonAuth] sign-in status:", neonRes.status, "body:", rawText.slice(0, 200));

      if (!neonRes.ok) {
        // INVALID_ORIGIN: Neon Auth rejects our origin → fall back to local auth.
        // Store the hash now so next login skips Neon Auth entirely.
        const isOriginRejected =
          neonRes.status === 403 &&
          (rawText.includes("INVALID_ORIGIN") || rawText.includes("Invalid origin") || rawText.includes("MISSING_ORIGIN"));
        if (isOriginRejected) {
          console.log("[NeonAuth] INVALID_ORIGIN en login — intentando auth local como fallback");
          const existingRow = await pgPool.query(
            "SELECT id, username, role FROM users WHERE email = $1 LIMIT 1",
            [emailLower]
          );
          if ((existingRow.rowCount ?? 0) > 0) {
            // User exists locally with no hash → store hash + create session
            const localUser = existingRow.rows[0];
            const newHash = await bcrypt.hash(password, 12);
            await pgPool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, localUser.id]);
            console.log("[Auth] INVALID_ORIGIN fallback — hash guardado y sesión creada para", emailLower);
            return createSession(req, res, { id: localUser.id, username: localUser.username, role: localUser.role }, 200);
          }
          // User not in local DB yet — can't verify, ask them to register
          return res.status(401).json({ error: "Email o contraseña incorrectos." });
        }

        const isEmailNotVerified = neonRes.status === 403 && rawText.includes("EMAIL_NOT_VERIFIED");
        if (isEmailNotVerified) {
          // The user exists in Neon Auth but their email isn't verified.
          // If they exist in our local DB we trust them — save the bcrypt hash
          // so future logins go through the fast local path and bypass Neon Auth.
          const existingRow = await pgPool.query(
            "SELECT id, username, role FROM users WHERE email = $1 LIMIT 1",
            [emailLower]
          );
          if ((existingRow.rowCount ?? 0) > 0) {
            const localUser = existingRow.rows[0];
            const newHash = await bcrypt.hash(password, 12);
            await pgPool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, localUser.id]);
            console.log("[Auth] EMAIL_NOT_VERIFIED — hash local guardado, sesión creada para", emailLower);
            return createSession(req, res, { id: localUser.id, username: localUser.username, role: localUser.role }, 200);
          }
          // User not in our DB at all — they need to register
          return res.status(403).json({
            error: "Tu email no está verificado. Usá '¿Olvidaste tu contraseña?' para configurar el acceso.",
          });
        }
        const msg = neonData?.message || neonData?.error || rawText.slice(0, 200) || "Email o contraseña incorrectos.";
        return res.status(401).json({ error: String(msg) });
      }

      const neonUser = neonData.user ?? neonData;
      const upserted = await upsertNeonAuthUser({ id: neonUser.id, email: neonUser.email ?? email, name: neonUser.name });
      return createSession(req, res, upserted, 200);
    }

    return res.status(401).json({ error: "Email o contraseña incorrectos." });
  } catch (error: any) {
    console.error("Error en /api/auth/neon-login:", error);
    const status = error.status ?? 500;
    return res
      .status(status)
      .json({ error: error.message || "Ocurrió un error al iniciar sesión." });
  }
});

// POST /api/auth/forgot-password
// Body: { email }
// Generates a secure reset token, stores a bcrypt hash, and sends an email.
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido." });
  }
  try {
    const userRes = await pgPool.query(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );
    // Always respond OK — never reveal if the email exists
    if (!userRes.rows[0]) {
      return res.json({ ok: true, message: "Si el email existe, recibirás un correo en breve." });
    }
    const userId = userRes.rows[0].id;

    // Invalidate any previous unused tokens for this user
    await pgPool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [userId]
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await pgPool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, tokenHash]
    );

    await sendPasswordResetEmail(email.trim(), rawToken);
    console.log(`[Auth] Token de reseteo enviado a ${email}`);
    return res.json({ ok: true, message: "Si el email existe, recibirás un correo en breve." });
  } catch (err: any) {
    console.error("[Auth] Error en forgot-password:", err.message);
    return res.status(500).json({ error: "Error al procesar la solicitud. Intentá de nuevo." });
  }
});

// POST /api/auth/reset-password
// Body: { token, newPassword }
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (typeof token !== "string" || token.length < 32) {
    return res.status(400).json({ error: "Token inválido." });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
  }
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenRes = await pgPool.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [tokenHash]
    );
    if (!tokenRes.rows[0]) {
      return res.status(400).json({ error: "El enlace expiró o ya fue usado. Solicitá uno nuevo." });
    }
    const { id: tokenId, user_id: userId } = tokenRes.rows[0];

    const hash = await bcrypt.hash(newPassword, 12);
    await pgPool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
    await pgPool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
      [tokenId]
    );
    // Destroy any active sessions for this user (force re-login with new password)
    await pgPool.query("DELETE FROM session WHERE sess::text LIKE $1", [`%"userId":${userId}%`]);

    console.log(`[Auth] Contraseña restablecida para user_id=${userId}`);
    return res.json({ ok: true, message: "Contraseña actualizada. Ya podés iniciar sesión." });
  } catch (err: any) {
    console.error("[Auth] Error en reset-password:", err.message);
    return res.status(500).json({ error: "Error al restablecer la contraseña." });
  }
});

app.get("/api/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado." });
  }
  try {
    // Re-check the role from the DB instead of trusting the session snapshot,
    // so a role change/promotion (e.g. to "admin") is reflected in the UI
    // immediately, without requiring the user to log out and back in.
    const result = await pgPool.query("SELECT role FROM users WHERE id = $1", [req.session.userId]);
    const currentRole = result.rows[0]?.role;
    if (!currentRole) {
      return res.status(401).json({ error: "No autenticado." });
    }
    req.session.role = currentRole;
    return res.json({ user: { id: req.session.userId, username: req.session.username, role: currentRole } });
  } catch (error) {
    console.error("Error en /api/auth/me:", error);
    return res.status(500).json({ error: "Ocurrió un error al verificar la sesión." });
  }
});

// Lazy client initialization for safety
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    console.warn("[Gemini API] La clave GEMINI_API_KEY no está configurada o es de prueba. Las solicitudes usarán el fallback local de alta calidad.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper function to handle transient model errors, high demand (503), rate limits (429), and automatic fallback
async function generateContentWithFallback(
  ai: GoogleGenAI | null,
  options: {
    contents: any;
    config?: any;
    defaultModel?: string;
  }
) {
  if (!ai) {
    throw new Error("Cliente de IA no inicializado o clave de API faltante. Activando fallback local automático.");
  }
  const modelsToTry = [
    options.defaultModel || "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite"
  ];
  
  let lastError: any = null;
  
  for (const modelName of modelsToTry) {
    let attempts = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`[Gemini Request] Intentando llamar con modelo: ${modelName} (Intento ${attempt}/${attempts})`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Gemini Handled-Retry] Intento ${attempt}/${attempts} con ${modelName} falló (reintentando o usando fallback):`, error.message || error);
        
        const isRateLimitOrUnavailable = 
          error.status === 503 || 
          error.status === 429 || 
          error.message?.includes("503") || 
          error.message?.includes("429") ||
          error.message?.includes("UNAVAILABLE") ||
          error.message?.includes("RESOURCE_EXHAUSTED");
          
        if (isRateLimitOrUnavailable && attempt < attempts) {
          console.log(`[Gemini Retry] Reintentando en ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          // Break the attempt loop to try the fallback model, or fail
          break;
        }
      }
    }
  }
  
  throw lastError || new Error("Error: Fallaron todos los intentos con todos los modelos disponibles.");
}

// ── Free AI fallback: Groq → OpenRouter (used when Gemini quota is exhausted) ─

/**
 * Strip markdown code fences and extract raw JSON from a model response.
 * Models often wrap JSON in ```json ... ``` even when asked not to.
 */
function extractJSON(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try to find the first { or [ and return from there
  const start = text.search(/[\[{]/);
  if (start !== -1) return text.slice(start);
  return text.trim();
}

async function tryFreeAI(prompt: string, opts?: { jsonMode?: boolean }): Promise<string | null> {
  const jsonMode = opts?.jsonMode ?? false;
  const systemMsg = jsonMode
    ? "Respondé SOLO con JSON válido, sin texto adicional, sin markdown, sin explicaciones. Solo el objeto JSON."
    : "Respondé en español rioplatense (voseo argentino), de forma concisa y directa.";

  // 1. Groq — fastest, generous free tier
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      console.log("[FreeAI] Intentando Groq llama-3.3-70b-versatile...");
      const gr = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (gr.ok) {
        const d = await gr.json();
        const text = d.choices?.[0]?.message?.content?.trim();
        if (text) { console.log("[FreeAI] Groq respondió con éxito."); return text; }
      } else {
        console.warn("[FreeAI] Groq falló con status:", gr.status, await gr.text().catch(() => ""));
      }
    } catch (e: any) { console.warn("[FreeAI] Groq error:", e.message); }
  }

  // 2. OpenRouter — free-tier models
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const orModels = [
      "meta-llama/llama-3.1-8b-instruct:free",
      "qwen/qwen3-8b:free",
      "mistralai/mistral-7b-instruct:free",
      "google/gemma-3-12b-it:free",
    ];
    for (const model of orModels) {
      try {
        console.log(`[FreeAI] Intentando OpenRouter ${model}...`);
        const or = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${orKey}`,
            "HTTP-Referer": "https://clientum.com.ar",
            "X-Title": "Clientum CRM",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemMsg },
              { role: "user", content: prompt },
            ],
            max_tokens: 4096,
          }),
        });
        if (or.ok) {
          const d = await or.json();
          const text = d.choices?.[0]?.message?.content?.trim();
          if (text) { console.log(`[FreeAI] OpenRouter ${model} respondió con éxito.`); return text; }
        } else {
          console.warn(`[FreeAI] OpenRouter ${model} falló con status:`, or.status);
        }
      } catch (e: any) { console.warn(`[FreeAI] OpenRouter ${model} error:`, e.message); }
    }
  }

  return null;
}

/**
 * Primary AI dispatcher: Groq → OpenRouter → Gemini → null
 * Uses the server's own API secrets for ALL users.
 * Free tiers (Groq / OpenRouter) are tried first to avoid Gemini quota burns.
 */
async function generateAny(
  ai: GoogleGenAI | null,
  prompt: string,
  opts?: { jsonMode?: boolean; geminiConfig?: any; defaultModel?: string }
): Promise<string | null> {
  const jm = opts?.jsonMode ?? false;

  // 1. Groq → OpenRouter (free, server-side secrets, no per-user quota)
  const freeText = await tryFreeAI(prompt, { jsonMode: jm });
  if (freeText) {
    console.log("[generateAny] Free AI respondió exitosamente.");
    return freeText;
  }

  // 2. Gemini as last resort
  if (!ai) {
    console.warn("[generateAny] Gemini no disponible y Free AI falló.");
    return null;
  }
  try {
    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: opts?.geminiConfig,
      defaultModel: opts?.defaultModel,
    });
    return response.text?.trim() || null;
  } catch (err: any) {
    console.warn("[generateAny] Gemini también falló:", err.message || err);
    return null;
  }
}

// API Routes
// --- HIGH-QUALITY LOCAL FALLBACK GENERATORS (when all AI providers are out of quota) ---

function getMockIndustryCopy(industry: string): any {
  const normalized = (industry || "").toLowerCase().trim();
  
  if (normalized.includes("agr") || normalized.includes("camp") || normalized.includes("campo") || normalized.includes("logist")) {
    return {
      cover: {
        slogan: `Optimización para ${industry} con tecnología de punta.`,
        sub: `Seguimiento de procesos, bot de WhatsApp para consultas de ${industry}, ruteo logístico y CRM especializado de Clientum.`
      },
      chatbot: {
        title: `Atención y cotizaciones automáticas para ${industry} 24/7.`,
        features: [
          { title: "Respuestas al instante", desc: "El bot responde consultas sobre tarifas, disponibilidad y valores de servicios al instante." },
          { title: "Reportes automáticos", desc: "Envía avisos de carga y estados de pedidos directo al cliente." },
          { title: "Toma de reservas rápida", desc: "Toma solicitudes de servicios y productos desde WhatsApp." },
          { title: "Alertas personalizadas", desc: "Comparte alertas de estado y geolocalizadas automáticas a los operarios." }
        ],
        flowSteps: [
          `El cliente escribe al WhatsApp solicitando cotización de ${industry}`,
          "La IA de Clientum consulta la base de stock o servicios y cotiza en pesos al instante",
          "El cliente confirma la operación enviando sus datos o ubicación de Google Maps",
          `Se genera la orden automática en el CRM especializado para tu equipo`
        ]
      },
      crm: {
        title: `Trazabilidad completa de tu cadena en ${industry}.`,
        features: [
          { title: "Control de estados visual", desc: "Arrastrá y soltá transacciones según el estado operativo en tiempo real." },
          { title: "Clientes y subcontratistas", desc: "Todo el historial de servicios, deudas y contratos en un perfil único." },
          { title: "Geolocalización integrada", desc: "Mapa de operaciones y logísticas asociadas en tiempo real." }
        ]
      },
      services: [
        {
          title: `Consultoría de Procesos de ${industry}`,
          desc: "Automatizamos pesaje, recepción y optimización de flotas. Ahorro de costos promedio del 25%.",
          bullets: ["Auditoría de puntos operativos", "Optimización de despachos", "Retorno de inversión rápida", "Soporte personalizado"]
        },
        {
          title: "ERP Integrado",
          desc: "Facturación electrónica con liquidaciones AFIP incorporadas en pesos de forma ágil.",
          bullets: ["Control en tiempo real", "Ventas multimedios", "Trazabilidad de operaciones", "Monitoreo constante"]
        },
        {
          title: "Logística y Ruteo Inteligente",
          desc: `Catálogo digital y tracking en vivo de despachos de ${industry} vinculados al CRM de Clientum.`,
          bullets: ["App móvil para transportes integrada", "MercadoPago y cuenta corriente", "Posicionamiento en Google", "Almacenaje inteligente"]
        }
      ],
      testimonial: {
        text: `Logramos coordinar todas nuestras operaciones diarias con solo la mitad del esfuerzo usando el bot de WhatsApp de Clientum. El sistema automatizado nos ahorró horas de trabajo administrativo.`,
        author: "Gustavo B.",
        company: `Servicios Patagónicos — General Roca`
      },
      outreachEmail: `Asunto: Automatización de WhatsApp y CRM para tu empresa de ${industry} 🚀\n\nHola,\n\nEspero que estés muy bien. Me pongo en contacto porque sé que en el rubro de ${industry}, responder a tiempo las consultas de WhatsApp y coordinar las ventas/servicios suele ser un cuello de botella.\n\nCon Clientum creamos un sistema con Chatbot de WhatsApp 24/7 y CRM automatizado que ayuda a marcas de tu rubro a responder consultas al instante y asegurar que ningún cliente se pierda.\n\n¿Tendrás 15 minutos esta semana para una charla rápida por Meet o una llamada y ver cómo podemos potenciar tus ventas?\n\nUn saludo cordial!`
    };
  }

  if (normalized.includes("gastr") || normalized.includes("rest") || normalized.includes("comid") || normalized.includes("caf") || normalized.includes("bar") || normalized.includes("gourmet")) {
    return {
      cover: {
        slogan: `Revolucioná tu negocio de ${industry} en piloto automático.`,
        sub: `Chatbot para reservas de mesas o pedidos de comida, toma de comandas automática, encuestas de satisfacción y CRM gastronómico.`
      },
      chatbot: {
        title: `Reservas, pedidos y fidelización en ${industry} 24/7.`,
        features: [
          { title: "Reservas 24/7 sin llamadas", desc: "Evitá llamadas en hora pico. El bot gestiona la capacidad y confirma la reserva al instante." },
          { title: "Toma de pedidos y Delivery", desc: "Los clientes cargan su plato o pedido desde WhatsApp y pagan vía link de MercadoPago." },
          { title: "Fidelización de Comensales", desc: "Envía promociones segmentadas según el historial de consumo de cada cliente." },
          { title: "Encuestas de satisfacción", desc: "Califica la experiencia al finalizar la entrega o visita para mejorar el servicio." }
        ],
        flowSteps: [
          `Un cliente escribe pidiendo mesa o delivery para el fin de semana`,
          "El bot consulta la disponibilidad en tiempo real en tu CRM de Clientum",
          "Le envía la confirmación con un link de pago o código QR para agilizar",
          "Se genera la comanda automática en la cocina y se asigna el repartidor"
        ]
      },
      crm: {
        title: "La ficha de cada cliente en la palma de tu mano.",
        features: [
          { title: "Perfil de Clientes", desc: "Registrá preferencias de consumo, reciclados, cumpleaños y frecuencias de visita." },
          { title: "Historial de Consumos", desc: "Controlá qué platos o productos se venden más y cuáles tienen mejor margen de ganancia." },
          { title: "Pipeline de Eventos", desc: "Gestioná cotizaciones de catering corporativos y reservas grupales de forma visual." }
        ]
      },
      services: [
        {
          title: "Consultoría de Experiencia del Cliente",
          desc: "Optimización de tiempos de servicio y diseño de menús digitales interactivos. +20% cubiertos diarios.",
          bullets: ["Diagnóstico de rotación", "Estrategia de fidelización", "Aumento de ticket promedio", "Integración de carta digital"]
        },
        {
          title: "Integración de Cocina y Despachos",
          desc: "Conectamos el bot de WhatsApp directo con tu sistema de comanda para evitar demoras y confusiones.",
          bullets: ["Envío instantáneo a comanderas", "Control de tiempos de cocina", "Notificación automática al mozo/repartidor", "Cero comandas perdidas"]
        },
        {
          title: "Marketing Local Automatizado",
          desc: `Campañas de atracción segmentadas por geolocalización vinculadas directamente a tu CRM de Clientum.`,
          bullets: ["Captura de leads en Instagram", "E-marketing para cumpleaños", "Estrategias de hora feliz", "Reportes de ROI en tiempo real"]
        }
      ],
      testimonial: {
        text: `El 60% de nuestras reservas y pedidos del fin de semana ahora se hacen solas por el bot de WhatsApp. Redujimos notablemente las llamadas perdidas y aumentamos la facturación.`,
        author: "Sofía G.",
        company: `Delicias Gourmet — Bariloche`
      },
      outreachEmail: `Asunto: Automatización de reservas y pedidos para tu negocio de ${industry} 🍽️\n\nHola,\n\nEspero que estés muy bien. Me pongo en contacto porque sé que en el rubro de ${industry}, la atención de consultas rápidas en WhatsApp y la toma de pedidos suele colapsar al equipo en horas pico.\n\nCon Clientum creamos un sistema con Chatbot de WhatsApp 24/7 y CRM automatizado que ayuda a marcas de tu rubro a automatizar reservas y pedidos, asegurando una experiencia rápida.\n\n¿Tendrás 15 minutos esta semana para una charla rápida y ver cómo podemos potenciar tu local?\n\nUn saludo cordial!`
    };
  }

  if (normalized.includes("inmob") || normalized.includes("prop") || normalized.includes("casa") || normalized.includes("dep") || normalized.includes("real estate") || normalized.includes("construc")) {
    return {
      cover: {
        slogan: "Agendá visitas y calificá interesados en piloto automático.",
        sub: "WhatsApp Chatbot para tasaciones y filtros de propiedades, CRM de inmuebles integrado y contratos digitales en pesos."
      },
      chatbot: {
        title: "Tu guardia inmobiliaria, activa todos los días.",
        features: [
          { title: "Filtro de ambientes y precios", desc: "El bot envía catálogos de departamentos que se ajustan al presupuesto del lead." },
          { title: "Agendamiento de visitas", desc: "Sincroniza agendas de los martilleros para visitas presenciales a los departamentos." },
          { title: "Requisitos de alquiler express", desc: "Informa requisitos (garantías propietarias, recibos de sueldo) sin llamadas previas." },
          { title: "Tasaciones preliminares", desc: "Recopila metros cuadrados, zona y estado para cotizar estimaciones de alquiler." }
        ],
        flowSteps: [
          "El lead ve un cartel en un balcón y escribe al QR de WhatsApp de Clientum",
          "El bot le envía fotos, expensas y mapa de ubicación del departamento",
          "La IA le pregunta sus ingresos mensuales para calificarlo según políticas",
          "Agenda día y hora con el corredor de la firma enviándole el recordatorio"
        ]
      },
      crm: {
        title: "Toda tu cartera de propiedades bajo control.",
        features: [
          { title: "Pipeline Inmobiliario", desc: "Etapas desde 'Interesado', 'Visita agendada', 'Seña entregada' hasta 'Contrato firmado'." },
          { title: "Fichas de Inmuebles", desc: "Unifica fotos, planos, contratos históricos y estados de pagos en una sola pantalla." },
          { title: "Seguimiento de expensas", desc: "Envía recordatorios automáticos de cobros mensuales de alquileres y expensas." }
        ]
      },
      services: [
        {
          title: "Sistemas de Gestión de Alquileres",
          desc: "Automatización de contratos, cobros por transferencia e indexaciones del ICL automatizadas.",
          bullets: ["Cálculo automático de aumentos", "Factura de alquiler AFIP express", "Soporte legal integrado", "Panel de propietarios"]
        },
        {
          title: "E-Commerce Inmobiliario",
          desc: "Plataforma web premium con filtros avanzados, mapas interactivos de barrios cerrados y renders 3D.",
          bullets: ["SEO específico de zonas", "Generador automático de fichas PDF", "Botón de seña MercadoPago", "Integración portales nacionales"]
        },
        {
          title: "Marketing para Desarrolladoras",
          desc: "Embudo de captación de inversores de pozo. Segmentación en redes sociales con CRM trackeado.",
          bullets: ["Leads de pozo precalificados", "Folletería digital dinámica", "Envío masivo de avances de obra", "Medición exacta del ROI"]
        }
      ],
      testimonial: {
        text: "Nuestras guardias de fin de semana ahora están 100% automatizadas. El bot califica al interesado, le muestra fotos del departamento y le agenda la cita. Increíble.",
        author: "Gabriela S.",
        company: "Inmobiliaria Pilar Propiedades — Buenos Aires"
      },
      outreachEmail: `Asunto: Automatización de visitas e interesados para tu inmobiliaria 🏢\n\nHola,\n\nEspero que estés muy bien. Me pongo en contacto porque sé que en el rubro inmobiliario, la clasificación de interesados y el agendamiento de visitas físicas consume muchísimo tiempo de tus agentes.\n\nCon Clientum creamos un sistema con Chatbot de WhatsApp 24/7 and CRM especializado que ayuda a inmobiliarias a calificar interesados de forma automática según presupuesto y requisitos, agendando visitas solas.\n\n¿Tendrás 15 minutos esta semana para una charla rápida y ver cómo podemos potenciar tus propiedades?\n\nUn saludo cordial!`
    };
  }

  if (normalized.includes("salu") || normalized.includes("med") || normalized.includes("clin") || normalized.includes("estet") || normalized.includes("odont") || normalized.includes("dent")) {
    return {
      cover: {
        slogan: "Gestión de turnos médicos y recordatorios automáticos.",
        sub: "El bot agenda citas según la disponibilidad del profesional, envía recordatorios de ausentismo y centraliza el CRM de pacientes."
      },
      chatbot: {
        title: "Tu guardia de turnos médica, activa todos los días.",
        features: [
          { title: "Agendamiento automático de turnos", desc: "El paciente elige el profesional, la especialidad y el horario desde WhatsApp." },
          { title: "Recordatorios preventivos", desc: "Reduce el ausentismo enviando avisos de confirmación 24 horas antes del turno." },
          { title: "Ficha médica digital", desc: "Visualizá historias clínicas, indicaciones y estudios adjuntos en el CRM." },
          { title: "Atención post-consulta", desc: "Sigue la recuperación del paciente con encuestas de evolución automáticas." }
        ],
        flowSteps: [
          "El paciente escribe solicitando un turno para odontología o medicina",
          "El bot consulta la agenda de los doctores en el CRM y ofrece horarios libres",
          "El paciente selecciona el horario y recibe los requisitos de preparación",
          "Se le envía un recordatorio automático de confirmación con opción de reprogramar"
        ]
      },
      crm: {
        title: "Historias clínicas y agendas perfectamente coordinadas.",
        features: [
          { title: "Ficha del Paciente", desc: "Historias clínicas digitales completas, adjuntos de estudios y notas del doctor." },
          { title: "Control de Ausentismo", desc: "Métricas claras de asistencia, cancelaciones y reprogramaciones en tiempo real." },
          { title: "Facturación a Obras Sociales", desc: "Registro automático de órdenes médicas, coseguros y liquidaciones prepagas." }
        ]
      },
      services: [
        {
          title: "Sistemas de Gestión de Clínicas",
          desc: "Automatización de agendas de múltiples profesionales, cobros de consultas e integración de telemedicina.",
          bullets: ["Sincronización Google Calendar", "Control de turnos cancelados", "Firma digital de recetas", "Factura electrónica AFIP"]
        },
        {
          title: "Portal de Pacientes Inteligente",
          desc: "Sitio web para autogestión de turnos, descarga de resultados de laboratorios e historial integrado con el CRM.",
          bullets: ["Autenticación segura", "Filtro de especialistas", "Pasarela de pagos coseguro", "Soporte multi-clínica"]
        },
        {
          title: "Marketing para Centros de Estética y Salud",
          desc: "Embudos de captación para tratamientos de alto valor. Captura inteligente de leads en redes sociales.",
          bullets: ["Seguimiento de tratamientos", "Folletería digital interactiva", "Promociones por temporada", "Costo por consulta optimizado"]
        }
      ],
      testimonial: {
        text: "Redujimos el ausentismo en los turnos de estética en un 45% en solo dos meses. Los recordatorios de WhatsApp automáticos funcionan de maravilla.",
        author: "Paula D.",
        company: "Clínica de Estética Vital — Neuquén"
      },
      outreachEmail: `Asunto: Automatización de turnos y reducción de ausentismo para tu centro médico 🩺\n\nHola,\n\nEspero que estés muy bien. Me pongo en contacto porque sé que en el rubro de la salud y estética, coordinar agendas de turnos y lidiar con el ausentismo de pacientes de último minuto es un gran dolor de cabeza administrativo.\n\nCon Clientum creamos un sistema con Chatbot de WhatsApp 24/7 y CRM que permite a tus pacientes reservar turnos solos de manera ágil, y les envía recordatorios automatizados de confirmación.\n\n¿Tendrás 15 minutos esta semana para una charla rápida por Meet o una llamada y ver cómo podemos implementarlo en tu centro?\n\nUn saludo cordial!`
    };
  }

  // Default PyME fallback
  return {
    cover: {
      slogan: `La revolución digital para tu negocio de ${industry}.`,
      sub: `Llegá a más clientes con un Chatbot de WhatsApp 24/7, CRM de ventas ágil, automatizaciones de contacto y facturación integrada.`
    },
    chatbot: {
      title: `Atención automatizada 24/7 para ${industry}.`,
      features: [
        { title: "Respuestas al instante", desc: "Tus clientes reciben respuestas instantáneas a preguntas frecuentes de WhatsApp las 24 horas." },
        { title: "Calificación inteligente", desc: "Filtra interesados verdaderos recopilando datos de contacto, rubro y presupuesto." },
        { title: "Agendamiento automático", desc: "El bot coordina citas y reuniones directamente con tu agenda integrada en tiempo real." },
        { title: "Cotizaciones veloces", desc: "Calcula precios y envía presupuestos personalizados al cliente en formato PDF." }
      ],
      flowSteps: [
        `El cliente escribe a tu WhatsApp preguntando por tus servicios de ${industry}`,
        "El bot de Clientum responde al instante con tu catálogo y preguntas de calificación",
        "El prospecto elige un servicio, completa sus datos de contacto y confirma el interés",
        "El lead llega caliente al CRM Clientum con alerta instantánea para tu equipo"
      ]
    },
    crm: {
      title: "Controlá todo tu embudo de ventas sin perder un solo lead.",
      features: [
        { title: "Pipeline visual", desc: "Mové tus prospectos entre las etapas de venta mediante arrastrar y soltar de forma simple." },
        { title: "Historial unificado", desc: "Toda la conversación, emails y notas de cada cliente en un solo lugar centralizado." },
        { title: "Tareas automáticas", desc: "Creá recordatorios y seguimientos automáticos para que tu equipo nunca se olvide de llamar." }
      ]
    },
    services: [
      {
        title: "Implementación del CRM Clientum",
        desc: `Configuramos tu pipeline de ventas y cargamos tu base de clientes actual adaptado a ${industry}. Listo en 5 días.`,
        bullets: ["Setup inicial completo", "Capacitación en vivo para tu equipo", "Soporte prioritario por WhatsApp", "Garantía de adaptación"]
      },
      {
        title: "Diseño de Chatbot de WhatsApp",
        desc: "Creamos los flujos de conversación de tu bot con IA para automatizar la atención inicial y captación.",
        bullets: ["Integración oficial Meta API", "Calificación automática", "Agendamiento con Google Calendar", "Estadísticas completas de chats"]
      },
      {
        title: "Consultoría de Ventas Digitales",
        desc: "Estrategia para acelerar tu proceso comercial y multiplicar la tasa de cierre de ventas en tu empresa.",
        bullets: ["Análisis de procesos comerciales", "Diseño de embudo de captación", "Auditorías de tasa de conversión", "Reuniones de evolución mensual"]
      }
    ],
    testimonial: {
      text: `Clientum cambió la forma de trabajar de nuestro equipo. Atendemos el triple de consultas de WhatsApp y la organización en el CRM nos permitió duplicar los cierres.`,
      author: "Martín R.",
      company: `Comercial Patagónica S.A.`
    },
    outreachEmail: `Asunto: Automatización de WhatsApp y CRM para tu empresa de ${industry} 🚀\n\nHola,\n\nEspero que estés muy bien. Me pongo en contacto porque sé que en el rubro de ${industry}, responder a tiempo las consultas de WhatsApp y coordinar las ventas suele ser complejo.\n\nCon Clientum creamos un sistema con Chatbot de WhatsApp 24/7 y CRM automatizado que ayuda a PyMEs locales a responder consultas al instante y asegurar que ningún cliente se pierda.\n\n¿Tendrás 15 minutos esta semana para una charla rápida por Meet o una llamada y ver cómo podemos potenciar tus ventas?\n\nUn saludo cordial!`
  };
}

function getMockProspects(city: string, industry: string): any {
  const cityClean = city || "General Roca";
  const indClean = industry || "Comercio";

  const genericNames = [
    { name: `Distribuidora ${cityClean}`, address: "San Martín 450" },
    { name: `${indClean} del Sol`, address: "9 de Julio 820" },
    { name: `Ferretería Central ${cityClean}`, address: "Av. Roca 1234" },
    { name: `Inmobiliaria de la Comarca`, address: "Belgrano 345" },
    { name: `Consultorios Médicos del Valle`, address: "Tucumán 910" },
    { name: `Servicios Integrales ${cityClean}`, address: "Mitre 670" },
    { name: `Comercio Norte ${cityClean}`, address: "España 230" },
    { name: `${indClean} Patagónica`, address: "Olascoaga 540" },
    { name: `Empresa Sur S.R.L.`, address: "Yrigoyen 190" },
    { name: `${indClean} del Comahue`, address: "Alsina 880" },
    { name: `Proveedora Roca S.A.`, address: "Av. Roca 2100" },
    { name: `Centro Comercial ${cityClean}`, address: "9 de Julio 410" },
    { name: `${indClean} Austral`, address: "San Martín 1780" },
    { name: `Soluciones del Valle`, address: "Belgrano 620" },
    { name: `${indClean} Norte Patagónico`, address: "Tucumán 490" },
    { name: `Grupo Empresarial ${cityClean}`, address: "Mitre 1340" },
    { name: `${indClean} del Río Negro`, address: "Av. Argentina 560" },
    { name: `Comercial Los Álamos`, address: "España 1100" },
    { name: `${indClean} Las Bardas`, address: "Olascoaga 970" },
    { name: `Servicios Profesionales Sur`, address: "Yrigoyen 750" }
  ];

  let names = [...genericNames];
  const indLower = indClean.toLowerCase();
  
  if (indLower.includes("agr") || indLower.includes("camp")) {
    names = [
      { name: `Cereales del Limay S.A.`, address: "Ruta 22 Km 1205" },
      { name: `Agropecuaria El Ombú`, address: "Av. San Martín 150" },
      { name: `Frutas de la Patagonia S.A.`, address: "Ruta Nacional 151" },
      { name: `Riego e Insumos del Comahue`, address: "Mitre 780" },
      { name: `Logística Rural Valle Alto`, address: "Alsina 1420" },
      { name: `Semillas Patagónicas S.R.L.`, address: "Ruta 22 Km 1190" },
      { name: `Acopio y Granos del Sur`, address: "Av. Roca 880" },
      { name: `Agroquímica del Comahue`, address: "España 340" },
      { name: `Cooperativa Agropecuaria ${cityClean}`, address: "San Martín 1200" },
      { name: `Insumos Rurales Patagonia`, address: "Belgrano 760" },
      { name: `Maquinaria Agrícola Norte`, address: "Yrigoyen 490" },
      { name: `Ganadería Los Álamos`, address: "Ruta 6 Km 23" },
      { name: `Forrajes y Pasturas del Valle`, address: "Mitre 1100" },
      { name: `Agroveterinaria del Rio Negro`, address: "Olascoaga 620" },
      { name: `Granja Integral ${cityClean}`, address: "Alsina 340" },
      { name: `Exportadora Frutihortícola Sur`, address: "Ruta 22 Km 1215" },
      { name: `Irrigación y Riego S.A.`, address: "Tucumán 870" },
      { name: `Fertinorte S.R.L.`, address: "España 1050" },
      { name: `Campo Verde Agroinsumos`, address: "9 de Julio 540" },
      { name: `Vivero Patagónico del Comahue`, address: "Av. Roca 1650" }
    ];
  } else if (indLower.includes("inmob") || indLower.includes("prop") || indLower.includes("construc")) {
    names = [
      { name: `Inmobiliaria ${cityClean}`, address: "Av. Roca 560" },
      { name: `Martilleros Asociados del Neuquén`, address: "Olascoaga 340" },
      { name: `Constructora del Valle`, address: "Belgrano 120" },
      { name: `Propiedades de la Patagonia`, address: "San Martín 890" },
      { name: `Estudio Inmobiliario Sur`, address: "Yrigoyen 410" },
      { name: `Inversiones Inmobiliarias del Comahue`, address: "Mitre 670" },
      { name: `Desarrollos Urbanos Patagonia`, address: "España 980" },
      { name: `Corredores del Río Negro S.R.L.`, address: "Alsina 230" },
      { name: `Constructora Patagónica S.A.`, address: "9 de Julio 1350" },
      { name: `Emprendimientos del Valle`, address: "Tucumán 780" },
      { name: `Hormigón y Construcciones Norte`, address: "Av. Roca 1890" },
      { name: `Tasaciones y Pericias ${cityClean}`, address: "Belgrano 450" },
      { name: `Inmobiliaria Araucanía`, address: "San Martín 1230" },
      { name: `Estudio Martillero Patagónico`, address: "Olascoaga 760" },
      { name: `Materiales de Construcción Sur`, address: "España 430" },
      { name: `Administración de Propiedades ${cityClean}`, address: "Mitre 990" },
      { name: `Loteos y Subdivisiones del Valle`, address: "Yrigoyen 610" },
      { name: `Arquitectura Patagónica S.R.L.`, address: "9 de Julio 870" },
      { name: `Corralón de Materiales Limay`, address: "Alsina 1450" },
      { name: `Desarrollos Residenciales Norte`, address: "Av. Argentina 340" }
    ];
  } else if (indLower.includes("gastr") || indLower.includes("rest") || indLower.includes("comid")) {
    names = [
      { name: `Restó Estación ${cityClean}`, address: "Tucumán 120" },
      { name: `Café de la Comarca`, address: "San Martín 430" },
      { name: `Pizzería Don Corleone`, address: "Av. Roca 850" },
      { name: `La Parrilla de ${cityClean}`, address: "Ruta 22 Km 1198" },
      { name: `Cervecería Artesanal Limay`, address: "Olascoaga 780" },
      { name: `Bodegón del Neuquén`, address: "Belgrano 560" },
      { name: `Confitería del Valle`, address: "España 340" },
      { name: `Sushi & Wok Patagónico`, address: "Mitre 1120" },
      { name: `Heladería Los Pioneros`, address: "9 de Julio 670" },
      { name: `Empanadas Roca S.R.L.`, address: "Yrigoyen 230" },
      { name: `Delivery del Sur`, address: "Alsina 890" },
      { name: `Resto Bar La Comarca`, address: "San Martín 1560" },
      { name: `Cafetería La Mañana`, address: "Av. Roca 340" },
      { name: `Panadería y Pastelería del Valle`, address: "Tucumán 780" },
      { name: `Fast Food Patagónico`, address: "España 1230" },
      { name: `Catering Eventos del Sur`, address: "Belgrano 890" },
      { name: `Vinoteca y Tapas ${cityClean}`, address: "Olascoaga 450" },
      { name: `Comida Casera El Mitre`, address: "Mitre 670" },
      { name: `Vermutería del Comahue`, address: "9 de Julio 980" },
      { name: `Rotisería y Viandas Norte`, address: "Yrigoyen 540" }
    ];
  } else if (indLower.includes("salu") || indLower.includes("med") || indLower.includes("clin") || indLower.includes("estet")) {
    names = [
      { name: `Clínica de la Comarca`, address: "Av. Roca 980" },
      { name: `Sanatorio Río Negro S.A.`, address: "Tucumán 340" },
      { name: `Centro Odontológico San Lucas`, address: "Belgrano 510" },
      { name: `Estética y Salud Integral`, address: "9 de Julio 760" },
      { name: `Consultorios Médicos del Comahue`, address: "España 120" },
      { name: `Centro de Diagnóstico del Valle`, address: "San Martín 670" },
      { name: `Fisioterapia y Kinesiología Norte`, address: "Mitre 890" },
      { name: `Óptica Patagónica`, address: "Olascoaga 230" },
      { name: `Farmacia del Valle S.R.L.`, address: "Alsina 1340" },
      { name: `Centro de Salud Mental ${cityClean}`, address: "Yrigoyen 560" },
      { name: `Laboratorio de Análisis Clínicos`, address: "Av. Roca 450" },
      { name: `Centro Oncológico del Sur`, address: "Tucumán 1100" },
      { name: `Maternidad y Obstetricia ${cityClean}`, address: "España 780" },
      { name: `Clínica Veterinaria del Comahue`, address: "Belgrano 890" },
      { name: `Spa & Wellness Patagónico`, address: "San Martín 1450" },
      { name: `Centro Quirúrgico del Valle`, address: "9 de Julio 340" },
      { name: `Radiología e Imágenes Norte`, address: "Mitre 670" },
      { name: `Nutrición y Dietética del Sur`, address: "Olascoaga 980" },
      { name: `Psicología y Psicopedagogía ${cityClean}`, address: "Alsina 450" },
      { name: `Centro de Rehabilitación Limay`, address: "España 1230" }
    ];
  } else if (indLower.includes("distr") || indLower.includes("mayor") || indLower.includes("comerc")) {
    names = [
      { name: `Distribuidora ${cityClean} S.R.L.`, address: "San Martín 1500" },
      { name: `Mayorista del Valle`, address: "Ruta 22 Km 1200" },
      { name: `Ferretería El Candado`, address: "Av. Roca 430" },
      { name: `Comercial Patagónica S.A.`, address: "9 de Julio 120" },
      { name: `Corralón del Sur`, address: "Alsina 910" },
      { name: `Importadora Comahue S.R.L.`, address: "España 670" },
      { name: `Distribuidora de Bebidas Norte`, address: "Mitre 1340" },
      { name: `Proveedor Gastronómico del Valle`, address: "Olascoaga 560" },
      { name: `Mayorista de Limpieza Patagónica`, address: "Yrigoyen 780" },
      { name: `Comercio Sur S.A.`, address: "Tucumán 450" },
      { name: `Distribuidora Textil del Comahue`, address: "Belgrano 1120" },
      { name: `Repuestos y Autopartes Norte`, address: "Av. Roca 1780" },
      { name: `Insumos Industriales ${cityClean}`, address: "España 980" },
      { name: `Mayorista de Alimentos del Sur`, address: "San Martín 2100" },
      { name: `Distribuidora Electrónica Patagónica`, address: "Mitre 430" },
      { name: `Comercio Unido del Valle`, address: "9 de Julio 890" },
      { name: `Proveedor de Oficinas ${cityClean}`, address: "Alsina 670" },
      { name: `Mayorista de Herramientas Norte`, address: "Olascoaga 1230" },
      { name: `Distribución y Logística del Sur`, address: "Yrigoyen 340" },
      { name: `Corralón y Materiales Comahue`, address: "Av. Argentina 890" }
    ];
  }

  const prospects = names.map((item, idx) => {
    const amount = 150000 + idx * 45000;
    const phonePrefix = cityClean.toLowerCase().includes("neuqu") ? "299" : "298";
    const phone = `+54 ${phonePrefix} 4${Math.floor(100000 + Math.random() * 900000)}`;
    const contacts = [
      "Ing. Marcos S.", "Laura G.", "Carlos M.", "Lic. Rodríguez", "Sofía Fernández",
      "Andrés P.", "Valeria T.", "Diego N.", "Mariela H.", "Gustavo R.",
      "Luciana B.", "Facundo L.", "Romina V.", "Pablo E.", "Cecilia M.",
      "Sebastián O.", "Natalia F.", "Hernán C.", "Florencia A.", "Maximiliano D."
    ];
    const painPoints = [
      "Atiende consultas de WhatsApp de forma manual y tarda hasta 12 horas en responder.",
      "Tiene base de clientes en Excel desactualizada y pierde seguimiento de presupuestos.",
      "No cuenta con embudo de ventas claro; los vendedores agendan reuniones por su cuenta.",
      "Sufre de ausentismo en reservas/turnos y no tiene recordatorios automáticos.",
      "Gestiona reclamos e historial de compras sin un sistema centralizado, generando demoras.",
      "Pierde ventas porque no responde cotizaciones fuera del horario comercial.",
      "No tiene visibilidad de qué vendedor está siguiendo qué cliente en cada momento.",
      "Sus campañas de WhatsApp son manuales y consumen horas del equipo cada semana.",
      "No cuenta con integración digital con AFIP para facturación automática.",
      "Carece de reportes de ventas; las decisiones se toman sin datos concretos.",
      "Los nuevos leads del sitio web se pierden porque nadie los registra en tiempo real.",
      "Agenda de turnos gestionada por teléfono; muchos clientes no aparecen sin aviso.",
      "No tiene un canal centralizado: atiende por WhatsApp, email e Instagram por separado.",
      "Su CRM actual es una hoja de cálculo compartida con versiones desincronizadas.",
      "Desconoce el LTV de sus clientes y no tiene estrategia de retención activa.",
      "Su equipo de ventas no tiene acceso móvil al historial de clientes en visitas.",
      "Genera propuestas en Word y las envía por email sin seguimiento automatizado.",
      "No puede medir el ROI de sus acciones comerciales ni de publicidad digital.",
      "Pierde clientes recurrentes porque no tiene alertas de renovación de contrato.",
      "Su proceso de onboarding de nuevos clientes es manual y tarda varios días."
    ];

    return {
      company: item.name,
      industry: indClean,
      amount: amount,
      city: cityClean,
      address: `${item.address}, ${cityClean}`,
      phone: phone,
      contact: contacts[idx % contacts.length],
      painPoint: painPoints[idx % painPoints.length],
      score: 9 - (idx % 3),
      guiacoresUrl: `https://www.google.com/search?q=site:guiacores.com.ar+${encodeURIComponent(item.name)}`
    };
  });

  return { prospects };
}

function getMockChatbotAnswer(payload: any): string {
  const { brochureData, message } = payload;
  const msgLower = (message || "").toLowerCase();
  
  if (msgLower.includes("precio") || msgLower.includes("cost") || msgLower.includes("cuanto") || msgLower.includes("val") || msgLower.includes("ars") || msgLower.includes("pesos")) {
    return `¡Hola! Mira, nuestros planes de implementación de Clientum CRM son súper accesibles para PyMEs locales y se adaptan a tu escala. Varían según los módulos (como el Bot de WhatsApp 24/7, la automatización AFIP o el CRM multiusuario). \n\nGeneralmente, las propuestas rondan entre los $120.000 y $480.000 ARS mensuales. ¿Te gustaría que agendemos una demo rápida de 15 minutos sin compromiso y te armo un presupuesto exacto?`;
  }
  
  if (msgLower.includes("whatsapp") || msgLower.includes("bot") || msgLower.includes("automatiz") || msgLower.includes("atend") || msgLower.includes("chat")) {
    return `¡Totalmente! El chatbot de WhatsApp de Clientum es un golazo. Atiende solo, las 24 horas del día. Cuando un cliente te escribe, el bot le responde al instante, lo califica y, si es necesario, te lo agenda en el CRM o te deriva la conversación.\n\nPara tu rubro, esto significa que nunca más vas a perder una venta o dejar un mensaje sin responder fuera del horario comercial. ¿Querés que agendemos una llamada cortita por Meet y te muestro cómo funciona el bot en vivo?`;
  }
  
  if (msgLower.includes("crm") || msgLower.includes("gestion") || msgLower.includes("vent") || msgLower.includes("pipeline") || msgLower.includes("seguim")) {
    return `¡Exacto! El CRM de Clientum está pensado para ser súper visual y ágil. Tenés un pipeline de ventas tipo drag-and-drop donde ves en qué etapa está cada cliente en tiempo real. \n\nAdemás, te automatiza las tareas de seguimiento para que tus vendedores no se olviden de llamar a nadie, y centraliza todo el historial de chats y correos del cliente en un solo lugar. Es ideal para ordenar tu negocio de una vez por todas. ¿Te interesa que coordinemos un Meet rápido para verlo?`;
  }
  
  if (msgLower.includes("contacto") || msgLower.includes("llam") || msgLower.includes("reun") || msgLower.includes("dem") || msgLower.includes("meet") || msgLower.includes("habl")) {
    return `¡Dale, buenísimo! Me encantaría que charlemos. Podés hacer clic en el botón de agendar demo que tenés en la barra superior o pasarme tu celular de WhatsApp y te escribo para coordinar. \n\nEn solo 15 minutos te muestro cómo automatizamos Clientum para potenciar tus ventas. ¿Qué día y horario te queda mejor esta semana?`;
  }
  
  return `¡Hola! Gracias por tu consulta. Clientum es la plataforma ideal para tu negocio porque integra un Chatbot de WhatsApp 24/7, un CRM súper visual y facturación electrónica en un solo lugar.\n\nEsto te permite automatizar la atención inicial, agendar turnos o pedidos en piloto automático y no perder nunca más un lead por responder tarde.\n\n¿Te gustaría que coordinemos un Meet rápido de 15 minutos esta semana para mostrarte el sistema funcionando en tiempo real? ¡Te va a encantar!`;
}

function getMockOptimizeCopy(text: string, goal: string): string {
  const t = text || "";
  if (goal === "agresivo" || goal === "vendedor") {
    return `🚀 ¡Multiplicá tus resultados! ${t} No pierdas más tiempo ni dejes que las ventas se te escapen de las manos. ¡Hacé clic acá y empezá hoy mismo! 🔥`;
  }
  if (goal === "profesional" || goal === "formal") {
    return `Optimice el rendimiento de su organización. ${t} Descubra cómo nuestra solución integral y automatizada le permite escalar sus ventas de forma eficiente y profesional.`;
  }
  if (goal === "conciso" || goal === "corto") {
    return `${t.slice(0, 150)}... ¡La solución ágil para potenciar tu negocio hoy!`;
  }
  return `✨ ${t} ¡Automatizá tu negocio con Clientum y vendé 24/7!`;
}

function getMockTranslateBrochure(texts: any, targetLanguage: string): any {
  const result: any = {};
  const isEng = (targetLanguage || "").toLowerCase().includes("ing") || (targetLanguage || "").toLowerCase().includes("en");
  const isPor = (targetLanguage || "").toLowerCase().includes("por") || (targetLanguage || "").toLowerCase().includes("pt");
  
  for (const key of Object.keys(texts)) {
    const val = texts[key];
    if (typeof val === "string") {
      if (isEng) {
        if (val.includes("Clientum")) result[key] = val;
        else if (val.includes("Tecnología")) result[key] = "Real technology for real SMEs.";
        else if (val.includes("atiente solo")) result[key] = "Your business runs on autopilot, 24/7.";
        else if (val.includes("pierdas una venta")) result[key] = "Never lose a sale again.";
        else result[key] = `${val} (EN)`;
      } else if (isPor) {
        if (val.includes("Clientum")) result[key] = val;
        else if (val.includes("Tecnología")) result[key] = "Tecnologia real para PMEs reais.";
        else if (val.includes("atiente solo")) result[key] = "Seu negocio atende sozinho, 24 horas.";
        else if (val.includes("pierdas una venta")) result[key] = "Nunca mais perca uma venda.";
        else result[key] = `${val} (PT)`;
      } else {
        result[key] = val;
      }
    } else {
      result[key] = val;
    }
  }
  return result;
}

function getMockICP(industry: string, acv: string): any {
  const ind = industry || "Tecnología y Servicios B2B";
  const contractValue = acv || "$180.000 ARS/mes";
  return {
    industry: ind,
    arrRange: "$50K - $250K USD",
    employeeCount: "20 - 150 empleados",
    stage: "Crecimiento / Escalando con tracción",
    growthRate: "20% - 50% YoY",
    decisionMakerRole: "Director de Operaciones / Gerente de Ventas / CEO",
    decisionMakerSeniority: "C-Level o Director de Área",
    painPoints: [
      "Pérdida de contactos por respuestas lentas o fuera de horario comercial en WhatsApp.",
      "Desorganización comercial y falta de seguimiento de presupuestos.",
      "Falta de automatización en facturación electrónica y conciliación de cuentas."
    ],
    budgetAuthority: "Aprobación de gastos directos hasta $500.000 ARS/mes sin directorio",
    avgContractValue: contractValue,
    salesCycle: "2 - 6 semanas",
    winRatePotential: "35% - 45%",
    ltvToCac: "4:1",
    regions: "Patagonia (Río Negro, Neuquén, Chubut) y resto de Argentina",
    timeZones: "GMT-3 (Argentina)",
    meddicMetrics: "Reducción del 80% en tiempo de respuesta inicial, aumento del 25% en conversión de leads.",
    meddicEconomicBuyer: "Dueño de la PyME, Director General o Gerente de Finanzas.",
    meddicDecisionCriteria: "Costo de implementación, soporte en español, facilidad de uso sin código, integración de WhatsApp.",
    meddicDecisionProcess: "Demo en vivo (15 min), propuesta comercial formal, validación técnica de WhatsApp, firma de contrato.",
    meddicIdentifyPain: "¿Cuánto tardan en responder fuera de hora? ¿Cuántas consultas de WhatsApp se pierden por mes?",
    meddicChampion: "Responsable de Ventas o Coordinador Administrativo harto de usar Excel desactualizado."
  };
}

function getMockResearch(company: string, industry: string): any {
  const comp = company || "Empresa Prospecto S.A.";
  const ind = industry || "Comercio";
  return {
    company: comp,
    industry: ind,
    revenue: "$80M - $150M ARS anuales",
    founded: "2014",
    employees: "15 - 35 empleados",
    funding: "Capital propio / Autofinanciado",
    recentNews: "Ampliación de catálogo de servicios en la zona de influencia de la Patagonia y digitalización de canales.",
    buyingSignals: [
      "Búsqueda activa de personal de atención comercial o soporte administrativo.",
      "Lanzamiento de canales de venta online o perfiles de redes con alta interacción de comentarios.",
      "Crecimiento en volumen de consultas pero estancamiento en el equipo físico de ventas."
    ],
    keyContacts: [
      { name: "Martín Gómez", title: "Socio Gerente", email: "m.gomez@prospecto.com.ar", linkedin: "linkedin.com/in/gomez-patagonia", influence: "Alta" },
      { name: "Clara Rossi", title: "Coordinadora Comercial", email: "c.rossi@prospecto.com.ar", linkedin: "linkedin.com/in/rossi-ventas", influence: "Media-Alta" }
    ],
    urgencyPainLevel: 5,
    urgencyTimeline: "Próximas 2 a 3 semanas",
    urgencyBudgetStatus: "Presupuesto aprobado para modernización comercial",
    personalizationHooks: [
      `Felicitar a Martín Gómez por la trayectoria local y sugerir automatizar las preguntas recurrentes del rubro ${ind}.`,
      `Ofrecer un bot calificador de WhatsApp para filtrar prospectos calificados antes de transferir a su equipo de ventas.`,
      `Destacar cómo la integración con CRM de Clientum elimina la necesidad de cargar datos manualmente desde planillas Excel.`
    ],
    fitScore: 9,
    fitReasoning: "Alta coincidencia con el ICP ideal: PyME patagónica con alta interacción en WhatsApp, con clara necesidad de automatizar procesos repetitivos y acelerar ventas."
  };
}

function getMockOutreach(company: string, contact: string, title: string, industry: string, painPoint: string): any {
  const cName = contact || "Estimado";
  const comp = company || "tu empresa";
  const ind = industry || "tu rubro";
  const pain = painPoint || "las respuestas lentas y el seguimiento de prospectos por WhatsApp";
  
  return {
    prospect: cName,
    company: comp,
    title: title || "Gerente General",
    goal: "Agendar reunión de demo de 15 minutos",
    email1Subject: `Consulta rápida para ${comp} - Automatización en WhatsApp`,
    email1Body: `Hola ${cName.split(' ')[0]},\n\nVi el crecimiento de ${comp} en la región y me llamó la atención cómo gestionan el gran flujo de consultas comerciales.\n\nDiseñamos un chatbot de WhatsApp específico para el rubro ${ind} que responde cotizaciones, stock y agenda reuniones las 24 horas, derivando al CRM de Clientum solo los leads pre-calificados. Esto les ahorra unas 12 horas semanales de atención manual.\n\n¿Te parece que tengamos una charla cortita de 15 minutos por Meet para mostrarte un ejemplo en vivo adaptado a tu negocio?\n\nUn saludo,\nEquipo de Clientum`,
    email2Subject: `Re: Consulta rápida para ${comp} - Un dato de conversión`,
    email2Body: `Hola ${cName.split(' ')[0]},\n\nTe escribo brevemente porque las PyMEs del sector ${ind} que implementaron el bot de WhatsApp y CRM de Clientum aumentaron sus ventas un 40% el primer mes, simplemente porque respondieron consultas en menos de 2 minutos.\n\nEvitamos demoras y centralizamos todo el historial del prospecto automáticamente.\n\n¿Te queda bien un Meet rápido este jueves a las 11:00 hs para ver cómo aplicarlo en ${comp}?\n\nAbrazo,\nEquipo de Clientum`,
    email3Subject: `Último intento / Solución ágil para ${comp}`,
    email3Body: `Hola ${cName.split(' ')[0]},\n\nSé que estás a mil gestionando el día a día en ${comp}, por lo que esta es mi última consulta para no interrumpir.\n\nSi el dolor principal hoy es que tu equipo comercial pierde tiempo respondiendo preguntas de soporte básico en vez de cerrar ventas, Clientum se instala en 5 días y se paga solo con 2 ventas ganadas.\n\nSi te interesa dar el salto tecnológico, avisame y coordinamos. Si no, ¡te deseo el mayor de los éxitos en este trimestre!\n\nSaludos atentos,\nEquipo de Clientum`,
    linkedinSequence: [
      "Paso 1: Solicitud de contacto con nota personalizada: 'Hola Martín, un gusto conectar. Me entusiasma ver cómo lideran en el rubro en la Patagonia. ¡Saludos!'",
      "Paso 2 (Día +2): Compartir un artículo de valor: 'Hola Martín, te comparto este breve análisis sobre el impacto de la atención instantánea por WhatsApp en el sector de logística rural. Espero que te sirva.'",
      "Paso 3 (Día +4): Enviar propuesta directa: 'Hola Martín, veo que en tu local reciben muchas consultas diarias. ¿Evaluaron automatizar las cotizaciones recurrentes por WhatsApp para aliviar a tu equipo? Saludos.'",
      "Paso 4 (Día +7): Mensaje final de seguimiento: 'Hola Martín, te dejé un correo para ver si te servía un Meet de 15 minutos sin compromiso para ver Clientum en vivo. ¿Te interesa que coordinemos?'"
    ],
    phoneScript: `\"Hola Martín, ¿cómo estás? Te habla Marcos de Clientum. Te llamo cortito porque vi el crecimiento que tienen en la zona y sé que están con mucha demanda. Te quería preguntar brevemente: ¿hoy tu equipo está dando abasto con las consultas que les entran por WhatsApp o sienten que a veces se les pasan oportunidades de venta por demoras en responder? ... Excelente, justamente desarrollamos un sistema de bot y CRM que soluciona esto en 5 días. ¿Te queda bien que coordinemos un Meet rápido de 15 minutos el miércoles a las 10:00 hs para que veas el sistema adaptado a tu marca?\"`
  };
}

// Helper function to query real-time businesses using Google Places API (New)
// --------------------------------------------------------------------------
// Classify a URL returned by Google Places as a real website or a social URL.
// Google Maps often stores an Instagram / Facebook page as the business website.
// We separate them so the frontend can show them with the right icon and label.
// --------------------------------------------------------------------------

// Patagonian city reference coordinates for distance calculation.
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "General Roca": { lat: -39.0333, lng: -67.5833 },
  "Neuquén": { lat: -38.9516, lng: -68.0591 },
  "San Carlos de Bariloche": { lat: -41.1335, lng: -71.3103 },
  "Bariloche": { lat: -41.1335, lng: -71.3103 },
  "Cipolletti": { lat: -38.9333, lng: -67.9833 },
  "Allen": { lat: -38.9819, lng: -67.8328 },
  "Centenario": { lat: -38.8333, lng: -68.1333 },
  "Villa Regina": { lat: -39.1000, lng: -67.0667 },
  "Roca": { lat: -39.0333, lng: -67.5833 },
  "Viedma": { lat: -40.8135, lng: -62.9967 },
  "San Martín de los Andes": { lat: -40.1574, lng: -71.3567 },
  "Junín de los Andes": { lat: -39.9500, lng: -71.0667 },
  "Zapala": { lat: -38.8994, lng: -70.0647 },
  "Cutral-Có": { lat: -38.9333, lng: -69.2333 },
  "Plaza Huincul": { lat: -38.9167, lng: -69.2167 },
  "Chos Malal": { lat: -37.3833, lng: -70.2667 },
  "Plottier": { lat: -38.9556, lng: -68.2231 },
  "Cinco Saltos": { lat: -38.8308, lng: -68.0628 },
  "Fernández Oro": { lat: -38.9667, lng: -67.9000 },
  "General Fernández Oro": { lat: -38.9667, lng: -67.9000 },
};

/** Haversine distance in km between two lat/lng pairs. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Map Google Places priceLevel enum → 1-4 integer (null if unknown). */
function mapPriceLevel(level: string | undefined | null): number | null {
  const MAP: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return level ? (MAP[level] ?? null) : null;
}
const SOCIAL_DOMAINS: Record<string, string> = {
  "instagram.com":  "instagram",
  "facebook.com":   "facebook",
  "fb.com":         "facebook",
  "twitter.com":    "twitter",
  "x.com":          "twitter",
  "tiktok.com":     "tiktok",
  "youtube.com":    "youtube",
  "linkedin.com":   "linkedin",
  "pinterest.com":  "pinterest",
  "wa.me":          "whatsapp",
  "linktr.ee":      "linktree",
};

function classifyWebsite(url: string): {
  website: string | null;
  socialUrl: string | null;
  socialPlatform: string | null;
} {
  if (!url) return { website: null, socialUrl: null, socialPlatform: null };
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    for (const [domain, platform] of Object.entries(SOCIAL_DOMAINS)) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return { website: null, socialUrl: url, socialPlatform: platform };
      }
    }
    return { website: url, socialUrl: null, socialPlatform: null };
  } catch {
    return { website: url, socialUrl: null, socialPlatform: null };
  }
}

async function fetchGooglePlacesAPI(city: string, industry: string, apiKey: string): Promise<any[]> {
  const query = `${industry} en ${city}`;
  console.log(`[Google Places API] Iniciando consulta para: "${query}"...`);

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.websiteUri,places.googleMapsUri,places.types,places.userRatingCount,places.priceLevel,places.location"
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "es"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Places API falló (HTTP ${response.status}): ${errText}`);
    }

    const data = await response.json();
    const places = data.places || [];
    console.log(`[Google Places API Success] Encontrados ${places.length} resultados.`);

    const cityRef = CITY_COORDS[city] ?? null;

    return places.slice(0, 20).map((place: any, index: number) => {
      const companyName = place.displayName?.text || `Comercio en ${city}`;
      const rating = place.rating || null;
      const reviewCount = place.userRatingCount || null;
      const phone = place.nationalPhoneNumber || null;
      const address = place.formattedAddress || `Dirección en ${city}`;
      const rawWebsiteUri = place.websiteUri || "";
      const { website, socialUrl, socialPlatform } = classifyWebsite(rawWebsiteUri);
      const googleMapsUri = place.googleMapsUri || null;
      const types = place.types || [];

      // Real priceLevel from Google (1–4), null if not provided
      const priceLevel = mapPriceLevel(place.priceLevel);

      // Real distance in km from city center, null if coords not available
      let distance: number | null = null;
      if (cityRef && place.location?.latitude != null && place.location?.longitude != null) {
        distance = parseFloat(
          haversineKm(cityRef.lat, cityRef.lng, place.location.latitude, place.location.longitude).toFixed(1)
        );
      }

      let painPoint = "Excelente presencia de marca en Google pero carece de un canal automático de cotizaciones y CRM para agendar reuniones de ventas 24/7.";
      let score = 7;

      if (!website && !socialUrl) {
        painPoint = "No cuenta con página web institucional ni catálogo digital, lo que reduce su presencia digital en la Patagonia.";
        score = 9;
      } else if (!website && socialUrl) {
        painPoint = `Solo tiene presencia en redes sociales (${socialPlatform || "social"}). No cuenta con sitio web propio, lo que limita sus conversiones digitales.`;
        score = 9;
      } else if (rating && rating < 4.2) {
        painPoint = `Calificación de ${rating} estrellas en Google Maps. Un asistente de WhatsApp de Clientum agiliza respuestas y puede mejorar reseñas.`;
        score = 8;
      } else if (!phone) {
        painPoint = "No expone teléfono directo en Google Maps. Un bot de WhatsApp con landing page de Clientum convierte visitas en consultas.";
        score = 8;
      } else if (types.includes("restaurant") || types.includes("food") || types.includes("bar")) {
        painPoint = "Dificultad para centralizar reservas de mesas y pedidos para llevar desde WhatsApp.";
        score = 8;
      } else if (types.includes("store") || types.includes("clothing_store") || types.includes("shopping_mall")) {
        painPoint = "Pérdida de clientes potenciales los fines de semana por falta de chatbot automatizado en Instagram y WhatsApp.";
        score = 8;
      }

      const baseAmount = (!website && !socialUrl) ? 220000 : 180000;
      const amount = baseAmount + (index * 15000);
      // Use real Google Maps link — never invent URLs
      const mapsUrl = googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyName + " " + city)}`;

      return {
        company: companyName,
        industry: industry,
        amount: amount,
        city: city,
        address: address,
        phone: phone || "Sin teléfono",
        // contact is null — enriched via Hunter.io on demand, never invented
        contact: null,
        contactVerified: false,
        contactEmail: null,
        contactPosition: null,
        painPoint: painPoint,
        score: score,
        guiacoresUrl: mapsUrl,
        googleMapsUri: googleMapsUri,
        rating: rating,
        reviewCount: reviewCount,
        website: website,       // null if it's a social media URL
        socialUrl: socialUrl,   // Instagram / Facebook / etc.
        socialPlatform: socialPlatform,  // "instagram" | "facebook" | null
        priceLevel: priceLevel,           // 0-4 real from Google, null if not available
        distance: distance,               // km from city center, null if no coords
      };
    });
  } catch (error: any) {
    console.error("[Google Places API Error] Error en fetchGooglePlacesAPI:", error);
    throw error;
  }
}

// Helper function to connect to Apify Google Places crawler
async function fetchApifyGooglePlaces(city: string, industry: string): Promise<any[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token || token === "MY_APIFY_API_TOKEN" || token.trim() === "") {
    throw new Error("La clave APIFY_API_TOKEN no está configurada en las variables de entorno.");
  }

  const query = `${industry} en ${city}`;
  console.log(`[Apify Scraper] Conectando a Apify para buscar: "${query}"...`);

  let items: any[] = [];
  let success = false;
  let lastErr: any = null;

  // Intentar con compass~crawler-google-places (anterior por defecto)
  try {
    console.log(`[Apify Scraper] Intentando con compass~crawler-google-places...`);
    const url = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${token}`;
    const body = {
      queries: [query],
      searchStrings: [query],
      maxPlacesPerQuery: 20,
      maxResults: 20,
      limit: 20,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const resData = await response.json();
      if (Array.isArray(resData)) {
        items = resData;
        success = true;
        console.log(`[Apify Scraper] Éxito con compass~crawler-google-places. Encontrados: ${items.length} items.`);
      }
    } else {
      const errText = await response.text();
      throw new Error(`compass~crawler-google-places falló (HTTP ${response.status}): ${errText}`);
    }
  } catch (err: any) {
    lastErr = err;
    console.warn(`[Apify Scraper Warning] Falló primer intento con compass~crawler-google-places:`, err.message || err);
  }

  // Intentar con apify~google-maps-scraper como fallback
  if (!success) {
    try {
      console.log(`[Apify Scraper] Intentando con apify~google-maps-scraper como fallback...`);
      const url = `https://api.apify.com/v2/acts/apify~google-maps-scraper/run-sync-get-dataset-items?token=${token}`;
      const body = {
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: 20,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const resData = await response.json();
        if (Array.isArray(resData)) {
          items = resData;
          success = true;
          console.log(`[Apify Scraper] Éxito con apify~google-maps-scraper. Encontrados: ${items.length} items.`);
        }
      } else {
        const errText = await response.text();
        throw new Error(`apify~google-maps-scraper falló (HTTP ${response.status}): ${errText}`);
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Apify Scraper Warning] Falló segundo intento con apify~google-maps-scraper:`, err.message || err);
    }
  }

  // Intentar con compass~google-maps-scraper como tercer fallback
  if (!success) {
    try {
      console.log(`[Apify Scraper] Intentando con compass~google-maps-scraper como fallback...`);
      const url = `https://api.apify.com/v2/acts/compass~google-maps-scraper/run-sync-get-dataset-items?token=${token}`;
      const body = {
        queries: [query],
        searchStrings: [query],
        maxPlacesPerQuery: 20,
        maxResults: 20,
        limit: 20,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const resData = await response.json();
        if (Array.isArray(resData)) {
          items = resData;
          success = true;
          console.log(`[Apify Scraper] Éxito con compass~google-maps-scraper. Encontrados: ${items.length} items.`);
        }
      } else {
        const errText = await response.text();
        throw new Error(`compass~google-maps-scraper falló (HTTP ${response.status}): ${errText}`);
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Apify Scraper Warning] Falló tercer intento con compass~google-maps-scraper:`, err.message || err);
    }
  }

  if (!success) {
    throw lastErr || new Error("No se pudo completar el scraping con ningún actor de Apify.");
  }

  return items.map((item: any, index: number) => {
    const companyName = item.title || item.name || item.companyName || `Comercio en ${city}`;
    const rating = item.stars || item.rating || item.totalScore || null;
    const phone = item.phone || item.phoneNumber || item.phoneNormalized || "Sin teléfono";
    const address = item.address || item.formattedAddress || item.streetAddress || `Dirección en ${city}`;
    const website = item.website || item.websiteUrl || "";
    
    let painPoint = "Falta de automatización en la respuesta de consultas comerciales.";
    let score = 7;

    if (!website) {
      painPoint = "No cuenta con página web institucional ni catálogo digital, lo que reduce su presencia digital en la Patagonia.";
      score = 9;
    } else if (rating && rating < 4.2) {
      painPoint = `Calificación de ${rating} estrellas en Google Maps por demoras en atención. Necesita un asistente de WhatsApp de Clientum para agilizar respuestas.`;
      score = 8;
    } else if (phone === "Sin teléfono") {
      painPoint = "No expone teléfono directo en Maps. Necesita integrar landing page de captación de Clientum con bot de WhatsApp.";
      score = 8;
    } else {
      painPoint = "Excelente presencia de marca en Google pero carece de un canal automático de cotizaciones y CRM para agendar reuniones de ventas 24/7.";
      score = 6;
    }

    const baseAmount = !website ? 220000 : 180000;
    const amount = baseAmount + (index * 15000);
    const guiacoresUrl = item.url || item.googleMapsUrl || `https://www.google.com/search?q=${encodeURIComponent(companyName + " " + city)}`;

    return {
      company: companyName,
      industry: industry,
      amount: amount,
      city: city,
      address: address,
      phone: phone,
      // contact is null until enriched via Hunter.io
      contact: null,
      contactVerified: false,
      contactEmail: null,
      contactPosition: null,
      painPoint: painPoint,
      score: score,
      guiacoresUrl: guiacoresUrl,
      rating: rating,
      website: website
    };
  });
}

// ── Hunter.io contact enrichment ─────────────────────────────────────────────

async function enrichWithHunter(domain: string): Promise<{
  contacts: Array<{ name: string; email: string; position: string; confidence: number; linkedin?: string | null }>;
  organization?: string | null;
} | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;

  // Normalise domain: strip protocol + www + path
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase()
    .trim();

  if (!cleanDomain || cleanDomain.length < 3) return null;

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(cleanDomain)}&limit=5&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[Hunter] HTTP ${res.status} for domain ${cleanDomain}`);
      return null;
    }
    const json: any = await res.json();
    if (!json?.data) return null;

    const contacts = (json.data.emails ?? [])
      .filter((e: any) => e.first_name || e.last_name)
      .map((e: any) => ({
        name:       [e.first_name, e.last_name].filter(Boolean).join(" "),
        email:      e.value ?? "",
        position:   e.position ?? "Contacto",
        confidence: e.confidence ?? 0,
        linkedin:   e.linkedin ?? null,
      }));

    return {
      contacts,
      organization: json.data.organization ?? null,
    };
  } catch (err: any) {
    console.warn(`[Hunter] Error for domain ${cleanDomain}:`, err.message);
    return null;
  }
}

// POST /api/enrich-contact
// Body: { domain: string }
// Returns: { contacts, organization, source } or { contacts: [], source: "none" }
app.post("/api/enrich-contact", requireAuth, async (req, res) => {
  try {
    const { domain } = req.body ?? {};
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "domain requerido" });
    }

    const result = await enrichWithHunter(domain);

    if (!result || result.contacts.length === 0) {
      return res.json({ contacts: [], organization: null, source: "none" });
    }

    return res.json({
      contacts:     result.contacts,
      organization: result.organization,
      source:       "hunter",
    });
  } catch (error: any) {
    console.error("[Enrich Contact Error]:", error);
    return res.status(500).json({ error: "Error al enriquecer el contacto." });
  }
});

// POST /api/scrape-employees-bulk
// Body: { leads: Array<{ id: string; company: string; domain?: string }> }
// Returns: { results: Record<id, { contacts, organization, source }> }
app.post("/api/scrape-employees-bulk", requireAuth, async (req, res) => {
  try {
    const { leads } = req.body ?? {};
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "leads[] requerido" });
    }
    const ai = getAI();
    const results: Record<string, any> = {};

    await Promise.allSettled(
      leads.map(async (lead: { id: string; company: string; domain?: string }) => {
        const { id, company, domain } = lead;
        if (!id) return;

        // 1. Hunter.io — real email + employee data
        if (domain && domain.trim().length > 3) {
          const hunterResult = await enrichWithHunter(domain.trim());
          if (hunterResult && hunterResult.contacts.length > 0) {
            results[id] = { ...hunterResult, source: "hunter" };
            return;
          }
        }

        // 2. IA generativa — sugiere ROLES/CARGOS típicos de la empresa, NUNCA nombres inventados.
        const prompt = `Sos un investigador B2B experto en empresas argentinas. La empresa es "${company}".
Listá hasta 4 cargos o roles decisores que típicamente existen en este tipo de empresa (ej: Gerente Comercial, Dueño/Propietario, Responsable de Compras, Director de Operaciones).
IMPORTANTE: NO inventes nombres de personas. Solo devolvé el cargo/rol. El campo "name" debe ser null siempre.
Respondé SOLO con JSON válido sin markdown: { "roles": [{ "position": "Cargo o rol exacto" }] }`;
        try {
          const aiText = await generateAny(ai, prompt, { jsonMode: true });
          if (aiText) {
            const parsed = JSON.parse(aiText.trim());
            // Accept both "roles" (new format) and legacy "contacts" key
            const items = parsed.roles ?? parsed.contacts ?? [];
            const contacts = items.slice(0, 4).map((c: any) => ({
              name:       null,   // never invent a name
              position:   c.position ?? c.role ?? "Decisor",
              email:      null,
              confidence: 0,
              linkedin:   null,
            }));
            results[id] = { contacts, organization: company, source: "ai" };
            return;
          }
        } catch { /* ignore parse errors */ }

        results[id] = { contacts: [], organization: company, source: "none" };
      })
    );

    return res.json({ results });
  } catch (error: any) {
    console.error("[scrape-employees-bulk]", error);
    return res.status(500).json({ error: "Error al scrapear empleados." });
  }
});

// ── GET /api/config/has-google-maps ─────────────────────────────────────────
// Tells the frontend whether the server has a valid Google Maps Platform key.
// Safe to call without auth — only returns a boolean, no key material.
app.get("/api/config/has-google-maps", (_req, res) => {
  const key = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
  const hasKey = Boolean(key && key.trim() !== "" && key !== "YOUR_API_KEY");
  res.set("Cache-Control", "no-store");
  return res.json({ hasKey });
});

app.post("/api/scrape-places", requireAuth, async (req, res) => {
  try {
    const { city, industry } = req.body;
    if (!city || !industry) {
      return res.status(400).json({ error: "Faltan parámetros requeridos: city e industry." });
    }
    const prospects = await fetchApifyGooglePlaces(city, industry);
    return res.json({ prospects, isRealScraped: true });
  } catch (error: any) {
    console.error("[Apify Route Error]:", error);
    return res.status(500).json({ error: "Error al realizar scraping de Google Maps mediante Apify." });
  }
});

// Only the public chatbot demo is reachable without a session; every other
// action here belongs to the CRM/dashboard and requires an authenticated user.
const PUBLIC_GENERATE_ACTIONS = new Set(["chatbotAnswer"]);

// Brochure & Contenido actions (SidebarEditor) are admin-only.
const ADMIN_ONLY_GENERATE_ACTIONS = new Set([
  "generateIndustryCopy",
  "optimizeCopy",
  "generateImage",
  "translateBrochure",
]);

app.post("/api/generate", async (req, res, next) => {
  const action = req.body?.action;
  if (ADMIN_ONLY_GENERATE_ACTIONS.has(action)) {
    return requireAdmin(req, res, next);
  }
  if (!PUBLIC_GENERATE_ACTIONS.has(action)) {
    return requireAuth(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    const { action, payload } = req.body;
    const ai = getAI();
    
    if (action === "validateGooglePlacesKey") {
      const { apiKey } = payload;
      if (!apiKey || apiKey.trim() === "") {
        return res.json({ success: false, error: "La clave provista está vacía." });
      }
      try {
        console.log(`[Google Places Validation] Validando clave provista...`);
        const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id"
          },
          body: JSON.stringify({
            textQuery: "Hotel Bariloche",
            maxResultCount: 1
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Google Places Validation Error] HTTP ${response.status}:`, errText);
          let userError = "La clave no es válida o no tiene habilitada la API de Places (New).";
          try {
            const errJson = JSON.parse(errText);
            if (errJson.error?.message) {
              userError = `Error de Google: ${errJson.error.message}`;
            }
          } catch(e) {}
          return res.json({ success: false, error: userError });
        }

        const data = await response.json();
        console.log(`[Google Places Validation Success] Clave validada correctamente.`);
        return res.json({ success: true, count: (data.places || []).length });
      } catch (err: any) {
        console.error(`[Google Places Validation Exception]`, err);
        return res.json({ success: false, error: err.message || "Error al conectar con la API de Google Places." });
      }
    }

    if (action === "generateIndustryCopy") {
      const { industry } = payload;
      const prompt = `Actúa como un experto redactor publicitario y estratega de negocios para PyMEs argentinas.
Genera contenido personalizado para el brochure de "Clientum 2026" adaptado ESPECÍFICAMENTE al rubro: "${industry}".
El tono debe ser muy profesional, persuasivo, cercano (usando el voseo argentino / español rioplatense de forma natural, sin exagerar) y enfocado en la rentabilidad de las PyMEs locales.

Debes devolver un objeto JSON con la siguiente estructura de datos (todo adaptado al rubro ${industry}):
{
  "cover": {
    "slogan": "Slogan corto e impactante (máx 60 caract) con un 'span' opcional o marcado en su lugar",
    "sub": "Párrafo corto de introducción (máx 150 caract) explicando el chatbot WhatsApp, CRM y facturación para este rubro específico"
  },
  "chatbot": {
    "title": "Título llamativo para el bot de WhatsApp en este rubro",
    "features": [
      { "title": "Característica 1", "desc": "Descripción adaptada al rubro" },
      { "title": "Característica 2", "desc": "Descripción adaptada al rubro" },
      { "title": "Característica 3", "desc": "Descripción adaptada al rubro" }
    ],
    "flowSteps": [
      "Paso 1 del chatbot adaptado",
      "Paso 2 del chatbot adaptado",
      "Paso 3 del chatbot adaptado",
      "Paso 4 del chatbot adaptado"
    ]
  },
  "crm": {
    "title": "Título llamativo para el CRM",
    "features": [
      { "title": "Beneficio 1 para el rubro", "desc": "Breve explicación" },
      { "title": "Beneficio 2 para el rubro", "desc": "Breve explicación" },
      { "title": "Beneficio 3 para el rubro", "desc": "Breve explicación" }
    ]
  },
  "services": [
    { "title": "Servicio 1", "desc": "Detalle del servicio ideal para este rubro", "bullets": ["Punto 1", "Punto 2"] },
    { "title": "Servicio 2", "desc": "Detalle del servicio ideal para este rubro", "bullets": ["Punto 1", "Punto 2"] },
    { "title": "Servicio 3", "desc": "Detalle del servicio ideal para este rubro", "bullets": ["Punto 1", "Punto 2"] }
  ],
  "testimonial": {
    "text": "Un testimonio ficticio pero realista de un cliente del rubro de alguna ciudad de Argentina (ej. Mendoza, Córdoba, Rosario) que use Clientum.",
    "author": "Nombre del Autor (ej. Sofía G.)",
    "company": "Nombre de empresa ficticia del rubro (ej. Viñedos Mendoza S.A.)"
  },
  "outreachEmail": "Asunto: Breve correo de prospección comercial/outreach personalizado para este rubro, utilizando voseo argentino de manera persuasiva y proponiendo 15 minutos de charla, haciendo referencia a los puntos del brochure de Clientum (como el bot de WhatsApp 24/7 y CRM de Clientum) que resuelven los dolores de este rubro."
}

IMPORTANTE: Devuelve exclusivamente el objeto JSON sin markdown.`;

      const genCopyText = await generateAny(ai, prompt, { jsonMode: true });
      if (genCopyText) {
        try { return res.json({ result: JSON.parse(extractJSON(genCopyText)) }); } catch { /* not valid JSON, continue to mock */ }
      }
      console.warn("[generateIndustryCopy] Todos los proveedores fallaron. Usando plantilla local para rubro:", industry);
      return res.json({ result: getMockIndustryCopy(industry), isFallback: true });
    }

    if (action === "assistantChat") {
      const { message, history, contextNote, brochureData: bd } = payload;
      const industryHint = bd?.industry ? ` El prospecto/rubro activo es "${bd.industry}".` : "";
      const companyHint  = bd?.company  ? ` La empresa del brochure es "${bd.company}".` : "";
      const sloganHint   = bd?.slogan   ? ` El slogan actual es "${bd.slogan}".` : "";
      const ctxHint      = contextNote  ? ` ${contextNote}` : "";
      const systemPrompt = `Eres el Asistente IA interno de Clientum, un CRM B2B argentino para PyMEs patagónicas.
Ayudás al equipo comercial con: pipeline de ventas, calificación MEDDIC de leads, redacción de emails y mensajes de WhatsApp, estrategias de prospección, tips para cerrar negocios y cualquier consulta sobre el uso de Clientum.${ctxHint}${industryHint}${companyHint}${sloganHint}
Respondé de manera concisa (máximo 4 párrafos), práctica y con voseo argentino (español rioplatense). Usá bullet points o numeración cuando ayude a la claridad. Sé directo, amigable y orientado a resultados comerciales concretos.
Historial de conversación: ${JSON.stringify(history || [])}
Consulta del usuario: "${message}"`;

      const assistantText = await generateAny(ai, systemPrompt);
      if (assistantText) return res.json({ result: assistantText });
      return res.json({ result: "¡Hola! Estoy en modo offline por alta demanda. Escribime tu consulta de nuevo en un momento." });
    }

    if (action === "chatbotAnswer") {
      const { brochureData, message, history } = payload;
      const prompt = `Actúas como un asesor comercial y consultor de automatización de Clientum 2026. Tu objetivo es vender los servicios de Clientum y responder dudas sobre el brochure corporativo personalizado de Clientum para el rubro del prospecto.
El brochure activo actual contiene esta información:
- Lema/Cover: "${brochureData?.cover?.slogan}" - "${brochureData?.cover?.sub}"
- Chatbot de WhatsApp: "${brochureData?.chatbot?.title}"
- CRM de Clientum: "${brochureData?.crm?.title}"
- Testimonio: "${brochureData?.testimonial?.text}" de ${brochureData?.testimonial?.author} (${brochureData?.testimonial?.company})
- Servicios Principales: ${JSON.stringify(brochureData?.services)}

Responde de manera concisa (máximo 3 párrafos cortos), convincente, y usa voseo argentino (español rioplatense) con un tono comercial persuasivo, amigable, tecnológico y sumamente enfocado en cómo la automatización de Clientum resuelve la respuesta lenta, potencia las ventas y profesionaliza el negocio.
Pregunta del usuario: "${message}"

Historial de conversación previa para contexto: ${JSON.stringify(history || [])}

Responde de forma directa, vendedora y simpática.`;

      const chatbotText = await generateAny(ai, prompt);
      if (chatbotText) return res.json({ result: chatbotText });
      return res.json({ result: getMockChatbotAnswer(payload), isFallback: true });
    }

    if (action === "optimizeCopy") {
      const { text, goal } = payload;
      const prompt = `Optimiza el siguiente texto de un brochure corporativo para que sea más ${goal || "persuasivo y profesional"}.
Mantén el español rioplatense si aplica, hazlo conciso, impactante y directo. Devuelve únicamente el texto optimizado, sin introducciones ni comillas externas.

Texto a optimizar:
"${text}"`;

      const optimizedText = await generateAny(ai, prompt);
      if (optimizedText) return res.json({ result: optimizedText });
      return res.json({ result: getMockOptimizeCopy(text, goal), isFallback: true });
    }

    if (action === "translateBrochure") {
      const { texts, targetLanguage } = payload;
      const prompt = `Traduce las siguientes frases o párrafos de un brochure corporativo al idioma: "${targetLanguage}".
Mantén la terminología comercial profesional de manera impecable. Devuelve un objeto JSON con las traducciones mapeadas uno a uno con el mismo orden o claves.

Textos a traducir en formato JSON:
${JSON.stringify(texts, null, 2)}

Devuelve únicamente el objeto JSON con las traducciones mapeadas con las mismas llaves.`;

      const translateText = await generateAny(ai, prompt, { jsonMode: true });
      if (translateText) {
        try { return res.json({ result: JSON.parse(extractJSON(translateText)) }); } catch { /* not valid JSON */ }
      }
      return res.json({ result: getMockTranslateBrochure(texts, targetLanguage), isFallback: true });
    }

    if (action === "prospectLeads") {
      const { city, industry, googleMapsPlatformKey } = payload;
      
      const gmpKey = googleMapsPlatformKey || process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (gmpKey && gmpKey !== "YOUR_API_KEY" && gmpKey.trim() !== "") {
        try {
          const prospects = await fetchGooglePlacesAPI(city, industry, gmpKey);
          console.log(`[Google Places API Success] Se recuperaron con éxito ${prospects.length} prospectos reales.`);
          return res.json({ result: { prospects }, isRealScraped: true, isGooglePlaces: true });
        } catch (gmpErr: any) {
          console.warn("[Google Places API Warning] Falló búsqueda directa con Google Places, intentando fallbacks:", gmpErr.message || gmpErr);
        }
      }
      
      const apifyToken = process.env.APIFY_API_TOKEN;
      if (apifyToken && apifyToken !== "MY_APIFY_API_TOKEN" && apifyToken.trim() !== "") {
        try {
          const prospects = await fetchApifyGooglePlaces(city, industry);
          console.log(`[Apify Success] Se recuperaron con éxito ${prospects.length} prospectos reales de Google Maps.`);
          return res.json({ result: { prospects }, isRealScraped: true });
        } catch (apifyErr: any) {
          console.warn("[Apify Interceptor] Falló scraping con Apify, procediendo con Gemini Search Grounding:", apifyErr.message || apifyErr);
        }
      }

      const prompt = `Actúa como un agente experto de ventas y prospección de datos reales (sales intelligence / research) de la patagonia argentina.
Usa tu herramienta de Google Search para buscar negocios, comercios, locales o empresas REALES que estén registradas o figuren en la prestigiosa guía de comercios de la Patagonia "Guía Cores" (https://www.guiacores.com.ar/) o que estén activas físicamente en la ciudad de "${city}" (provincia de Río Negro o Neuquén) para el rubro "${industry}".
Investiga, prioriza y encuentra 20 empresas u organizaciones locales verdaderas que aparezcan en Guía Cores o existan en "${city}" correspondientes con el rubro.

Para cada negocio real encontrado:
1. Obtén el nombre exacto de la empresa o local comercial ("company").
2. Obtén su dirección real aproximada en la ciudad ("address").
3. Obtén su teléfono real o formato local de contacto real ("phone") — si no está disponible, usa null.
4. Deduce o asocia un dolor digital realista ("painPoint"), por ejemplo: procesos analógicos de reserva, falta de automatización, nula presencia web o problemas respondiendo consultas rápido en WhatsApp.
5. Estima un monto mensual razonable de contrato en pesos ARS para la implementación del CRM ("amount") entre 120000 y 480000.
6. Proporciona o construye el enlace URL real o de búsqueda en Guía Cores para este comercio ("guiacoresUrl"). Si no se encuentra el enlace exacto, genera una URL de búsqueda en Google restringida al sitio como "https://www.google.com/search?q=site:guiacores.com.ar+" seguido del nombre del negocio codificado.

IMPORTANTE: El campo "contact" DEBE ser null siempre — los contactos reales se enriquecen por separado con Hunter.io. Nunca inventes nombres de personas.

Debes devolver un objeto JSON con la siguiente estructura de datos:
{
  "prospects": [
    {
      "company": "Nombre del negocio REAL (ej. Ferretería El Candado, Sanatorio Río Negro, etc.)",
      "industry": "${industry}",
      "amount": 180000, 
      "city": "${city}",
      "address": "Calle y número real de la ciudad de ${city}",
      "phone": "Teléfono real o prefijo local (ej. +54 298 4423456 o +54 299 4782345)",
      "contact": null,
      "painPoint": "Dolor específico e inteligente adaptado al negocio real encontrado.",
      "score": 8,
      "guiacoresUrl": "https://www.google.com/search?q=site:guiacores.com.ar+Nombre+Del+Negocio"
    }
  ]
}

IMPORTANTE: Devuelve exclusivamente el objeto JSON sin markdown.`;

      try {
        const response = await generateContentWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }],
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                prospects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company: { type: Type.STRING },
                      industry: { type: Type.STRING },
                      amount: { type: Type.INTEGER },
                      city: { type: Type.STRING },
                      address: { type: Type.STRING },
                      phone: { type: Type.STRING },
                      painPoint: { type: Type.STRING },
                      score: { type: Type.INTEGER },
                      guiacoresUrl: { type: Type.STRING }
                    },
                    required: [
                      "company",
                      "industry",
                      "amount",
                      "city",
                      "address",
                      "phone",
                      "painPoint",
                      "score",
                      "guiacoresUrl"
                    ]
                  }
                }
              },
              required: ["prospects"]
            }
          }
        });

        const parsed = JSON.parse(response.text || "{}");
        // Force contact: null on every prospect — real contacts come via Hunter.io only
        if (parsed.prospects) {
          parsed.prospects = parsed.prospects.map((p: any) => ({ ...p, contact: null }));
        }
        return res.json({ result: parsed });
      } catch (geminiError: any) {
        console.warn("[Gemini Fallback] Quota exhaustion / error in prospectLeads. Trying free AI...");
        const freeProspects = await tryFreeAI(prompt, { jsonMode: true });
        if (freeProspects) {
          try {
            const fp = JSON.parse(extractJSON(freeProspects));
            if (fp.prospects) fp.prospects = fp.prospects.map((p: any) => ({ ...p, contact: null }));
            return res.json({ result: fp });
          } catch { /* not valid JSON */ }
        }
        return res.json({ result: getMockProspects(city, industry), isFallback: true });
      }
    }

    if (action === "buildICP") {
      const { industry, acv } = payload;
      const prompt = `Actúa como un estratega comercial sénior especialista en B2B. Genera un Perfil de Cliente Ideal (ICP) exhaustivo y optimizado para el rubro '${industry}' con un valor promedio de contrato de '${acv || "$180.000 ARS/mes"}'. El formato de respuesta debe ser un JSON plano que siga exactamente esta estructura:
      {
        "industry": "Rubro o segmento de mercado",
        "arrRange": "Rango de ARR estimado",
        "employeeCount": "Tamaño de la empresa en empleados",
        "stage": "Etapa empresarial idónea",
        "growthRate": "Tasa de crecimiento YoY",
        "decisionMakerRole": "Puesto del tomador de decisión clave",
        "decisionMakerSeniority": "Seniority requerida",
        "painPoints": ["Dolor 1", "Dolor 2", "Dolor 3"],
        "budgetAuthority": "Nivel de autoridad de presupuesto",
        "avgContractValue": "Valor de contrato estimado",
        "salesCycle": "Duración del ciclo de ventas",
        "winRatePotential": "Tasa de conversión potencial",
        "ltvToCac": "Relación LTV:CAC esperada",
        "regions": "Regiones geográficas foco",
        "timeZones": "Zonas horarias de operación",
        "meddicMetrics": "Métricas de valor comercial cuantificables",
        "meddicEconomicBuyer": "Comprador económico clave",
        "meddicDecisionCriteria": "Criterios de selección",
        "meddicDecisionProcess": "Proceso de toma de decisiones del cliente",
        "meddicIdentifyPain": "Dolor principal detectado y preguntas de descubrimiento",
        "meddicChampion": "Quién actúa como campeón interno"
      }
      Usa voseo argentino / español rioplatense sutil en los dolores y descripciones. IMPORTANTE: Devuelve exclusivamente el objeto JSON sin markdown.`;

      const icpText = await generateAny(ai, prompt, { jsonMode: true });
      if (icpText) {
        try { return res.json({ result: JSON.parse(extractJSON(icpText)) }); } catch { /* not valid JSON */ }
      }
      return res.json({ result: getMockICP(industry, acv), isFallback: true });
    }

    if (action === "researchProspect") {
      const { company, industry, city } = payload;
      const prompt = `Actúa como un especialista en investigación de prospectos y ventas B2B en la Patagonia. Investiga a fondo a la empresa '${company}' que opera en el rubro '${industry}' y en la ciudad '${city || "General Roca"}'. Genera un informe detallado con firmográficos, señales de compra detectadas, contactos clave con influencia de decisión, urgencia y hooks de personalización. Devuelve exclusivamente un objeto JSON que siga esta estructura:
      {
        "company": "Nombre exacto de la empresa",
        "industry": "Rubro principal",
        "revenue": "Rango de facturación estimado",
        "founded": "Año de fundación",
        "employees": "Rango de empleados",
        "funding": "Origen de fondos",
        "recentNews": "Novedades o expansión reciente de la firma",
        "buyingSignals": ["Señal 1", "Señal 2", "Señal 3"],
        "keyContacts": [
          { "name": "Nombre contacto", "title": "Cargo", "email": "correo@empresa.com", "linkedin": "linkedin.com/in/perfil", "influence": "Alta/Media/Baja" }
        ],
        "urgencyPainLevel": 5,
        "urgencyTimeline": "Plazo estimado de compra",
        "urgencyBudgetStatus": "Estado de aprobación de presupuesto",
        "personalizationHooks": ["Gancho de venta 1", "Gancho de venta 2", "Gancho de venta 3"],
        "fitScore": 9,
        "fitReasoning": "Razonamiento detallado del puntaje de encaje comercial"
      }
      IMPORTANTE: Devuelve exclusivamente el objeto JSON sin markdown.`;

      const researchText = await generateAny(ai, prompt, { jsonMode: true });
      if (researchText) {
        try { return res.json({ result: JSON.parse(extractJSON(researchText)) }); } catch { /* not valid JSON */ }
      }
      return res.json({ result: getMockResearch(company, industry), isFallback: true });
    }

    if (action === "generateOutreach") {
      const { company, contact, title, industry, painPoint } = payload;
      const prompt = `Actúa como un redactor comercial estrella (sales copywriter) experto en prospección multicanal B2B para PyMEs argentinas. Genera una campaña de outreach altamente persuasiva para el prospecto '${contact}' (${title || "Gerente"}) de la empresa '${company}' del rubro '${industry}', quien padece el dolor: '${painPoint}'. Genera 3 correos electrónicos con voseo argentino natural, una secuencia de 4 pasos de LinkedIn y un guion telefónico/SMS de 10 segundos. Devuelve exclusivamente un objeto JSON con la estructura:
      {
        "prospect": "Nombre del prospecto",
        "company": "Empresa",
        "title": "Cargo",
        "goal": "Objetivo de la campaña",
        "email1Subject": "Asunto de correo 1",
        "email1Body": "Cuerpo del correo 1",
        "email2Subject": "Asunto de correo 2",
        "email2Body": "Cuerpo del correo 2",
        "email3Subject": "Asunto de correo 3",
        "email3Body": "Cuerpo del correo 3",
        "linkedinSequence": ["Paso 1", "Paso 2", "Paso 3", "Paso 4"],
        "phoneScript": "Guion telefónico o SMS de contacto inicial"
      }
      IMPORTANTE: Devuelve exclusivamente el objeto JSON sin markdown.`;

      const outreachText = await generateAny(ai, prompt, { jsonMode: true });
      if (outreachText) {
        try { return res.json({ result: JSON.parse(extractJSON(outreachText)) }); } catch { /* not valid JSON */ }
      }
      return res.json({ result: getMockOutreach(company, contact, title, industry, painPoint), isFallback: true });
    }

    if (action === "salesAdvisorAnswer") {
      const { industry, brochureData, message, history } = payload;
      const prompt = `Actúas como el Asesor de Ventas, Estrategia Comercial y Conversión oficial de Clientum. Tu misión es asesorar y guiar al usuario para mejorar el contenido, la estructura y la efectividad persuasiva de su brochure comercial actual, con el objetivo de optimizar la conversión de prospectos a clientes.

Rubro del brochure activo: "${industry || "General / Pymes"}"
Contenido del brochure actual:
- Lema de Portada: "${brochureData?.cover?.slogan || ""}"
- Subtítulo: "${brochureData?.cover?.sub || ""}"
- Chatbot de WhatsApp: "${brochureData?.chatbot?.title || ""}"
- CRM de Clientum: "${brochureData?.crm?.title || ""}"
- Testimonio: "${brochureData?.testimonial?.text || ""}" de ${brochureData?.testimonial?.author || ""} (${brochureData?.testimonial?.company || ""})
- Servicios Principales: ${JSON.stringify(brochureData?.services?.map((s: any) => s.title) || [])}

Pregunta del usuario sobre conversión, qué secciones incluir, sugerencias de copia o mejoras: "${message}"

Historial de conversación previa: ${JSON.stringify(history || [])}

Proporciona consejos estratégicos, creativos y prácticos. Usa el voseo argentino (español rioplatense) con un tono comercial persuasivo, amigable y empático. Da respuestas que incluyan tips prácticos de conversión (ej. llamados a la acción urgentes, colocación de testimonios estratégicos, cómo organizar mejor los servicios en el brochure). Limita tu respuesta a un máximo de 3 párrafos cortos o listas estructuradas fáciles de escanear.`;

      const advisorText = await generateAny(ai, prompt);
      if (advisorText) return res.json({ result: advisorText });
      return res.json({ result: `¡Hola! Como tu consultor de ventas en Clientum para el rubro de "${industry || "tu negocio"}", te recomiendo asegurarte de que cada página tenga un solo objetivo de conversión. Por ejemplo, en la sección de chatbot destaca que 'responde consultas automáticas en 10 segundos'. ¡Eso acelera un 70% el interés inicial!`, isFallback: true });
    }

    if (action === "generateImage") {
      const { industry, pageNumber, customPrompt } = payload;
      
      const INDUSTRY_IMAGES_DICTIONARY: Record<string, Record<number, string>> = {
        agro: {
          1: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
        },
        inmobiliaria: {
          1: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
        },
        distribuidora: {
          1: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1553413719-87e8e3908c13?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80"
        },
        gastronomia: {
          1: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
        },
        salud: {
          1: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1504813184591-01552ff317ff?auto=format&fit=crop&w=800&q=80"
        },
        construccion: {
          1: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80"
        },
        profesionales: {
          1: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1427751840561-985246c99687?auto=format&fit=crop&w=800&q=80"
        },
        educacion: {
          1: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
        },
        default: {
          1: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
          2: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
          4: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
          6: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
        }
      };

      let aspectRatio = "1:1";
      if (pageNumber === 1) aspectRatio = "16:9";
      else if (pageNumber === 2 || pageNumber === 4) aspectRatio = "4:3";

      const pageTerms: Record<number, string> = {
        1: `A high-quality minimalist corporate hero cover banner background for the industry of "${industry || "business"}", elegant colors, space for overlay text, cinematic lighting, photorealistic, 16:9`,
        2: `A modern professional workplace or collaboration environment for the industry of "${industry || "business"}", warm natural lighting, shallow depth of field, photorealistic, 4:3`,
        4: `A high-end smartphone screen showcasing an elegant digital dashboard or mobile chat interface for "${industry || "business"}" industry, blurred modern office background, photorealistic, 4:3`,
        6: `Sleek high-quality concept for professional services and consultation in the "${industry || "business"}" sector, soft lighting, professional corporate aesthetic, photorealistic, 1:1`
      };

      const promptText = customPrompt || pageTerms[pageNumber] || `High quality professional corporate concept representing the industry of "${industry || "business"}", clean design, photorealistic`;

      try {
        if (!ai) {
          throw new Error("Cliente de IA no inicializado o clave de API faltante.");
        }
        console.log(`[Gemini Image] Generando imagen con prompt: "${promptText}"`);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: promptText,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
            },
          },
        });

        let generatedUrl = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            generatedUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }

        if (generatedUrl) {
          return res.json({ result: { imageUrl: generatedUrl, isAI: true } });
        } else {
          throw new Error("No inline data returned from Gemini Image model.");
        }
      } catch (geminiError: any) {
        console.warn("[Gemini Image Fallback] Error generating image, falling back to curated Unsplash:", geminiError.message || geminiError);
        const norm = (industry || "").toLowerCase().trim();
        let matchedKey = "default";
        if (norm.includes("agro") || norm.includes("camp") || norm.includes("logis")) matchedKey = "agro";
        else if (norm.includes("inmobil") || norm.includes("casa") || norm.includes("propi")) matchedKey = "inmobiliaria";
        else if (norm.includes("distrib") || norm.includes("mayor") || norm.includes("depo")) matchedKey = "distribuidora";
        else if (norm.includes("gastron") || norm.includes("resto") || norm.includes("comid") || norm.includes("cafe")) matchedKey = "gastronomia";
        else if (norm.includes("salud") || norm.includes("medic") || norm.includes("estet") || norm.includes("clinic") || norm.includes("odont")) matchedKey = "salud";
        else if (norm.includes("constru") || norm.includes("corra") || norm.includes("obra")) matchedKey = "construccion";
        else if (norm.includes("profes") || norm.includes("estud") || norm.includes("conta") || norm.includes("jurid") || norm.includes("abog")) matchedKey = "profesionales";
        else if (norm.includes("educa") || norm.includes("escuel") || norm.includes("coleg") || norm.includes("acad")) matchedKey = "educacion";

        const fallbackMap = INDUSTRY_IMAGES_DICTIONARY[matchedKey] || INDUSTRY_IMAGES_DICTIONARY["default"];
        const fallbackUrl = fallbackMap[pageNumber] || fallbackMap[1] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";

        return res.json({ result: { imageUrl: fallbackUrl, isAI: false, isFallback: true } });
      }
    }

    return res.status(400).json({ error: "Acción no válida." });
  } catch (error: any) {
    console.error("Error en Gemini API proxy server:", error);
    return res.status(500).json({ error: "Ocurrió un error al procesar la solicitud con Gemini." });
  }
});

// ---------------------------------------------------------------------------
// Users — cuentas del CRM (login/registro). Sin esta tabla, /api/auth/register
// y /api/auth/login fallan con "relation users does not exist" en cualquier
// base de datos nueva, ya que no hay ningún ORM/migración que la genere.
// ---------------------------------------------------------------------------
async function initUsersTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(32) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      role          VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  // Migrations for Neon Auth columns (idempotent)
  await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email        VARCHAR(255) UNIQUE`);
  await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS neon_auth_id TEXT        UNIQUE`);
  console.log("[Auth] Tabla users lista.");
}

async function initPasswordResetTokensTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  TIMESTAMP NOT NULL,
      used_at     TIMESTAMP,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_prt_user_id    ON password_reset_tokens(user_id);
  `);
  console.log("[Auth] Tabla password_reset_tokens lista.");
}

// ---------------------------------------------------------------------------
// Chatbot leads — captura real de leads desde el Asesor Comercial IA
// (ChatbotSim), a diferencia de santi_leads que son prospectos generados
// por el buscador satelital. Estos son personas reales que el vendedor
// carga durante una demo/conversación con el bot.
// ---------------------------------------------------------------------------
async function initChatbotLeadsTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS chatbot_leads (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         TEXT NOT NULL,
      phone        VARCHAR(40),
      email        VARCHAR(200),
      company      TEXT,
      notes        TEXT,
      conversation TEXT,
      status       VARCHAR(20) NOT NULL DEFAULT 'nuevo',
      created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("[Chatbot Leads] Tabla chatbot_leads lista.");
}

// POST /api/chatbot-leads
// Body: { name, phone?, email?, company?, notes?, conversation? }
// Lo llama el widget del Asesor Comercial IA cuando el vendedor captura los
// datos de la persona con la que está conversando.
app.post("/api/chatbot-leads", requireAuth, async (req, res) => {
  try {
    const { name, phone, email, company, notes, conversation } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name requerido" });
    }
    const result = await pgPool.query(
      `INSERT INTO chatbot_leads (name, phone, email, company, notes, conversation)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, phone, email, company, notes, status, created_at`,
      [name.trim(), phone || null, email || null, company || null, notes || null, conversation || null],
    );
    res.status(201).json({ ok: true, lead: result.rows[0] });
  } catch (error: any) {
    console.error("[Chatbot Leads POST Error]:", error);
    res.status(500).json({ error: "Error al guardar el lead." });
  }
});

// GET /api/chatbot-leads
// Lista los leads capturados, para la pestaña "Leads" del CRM.
app.get("/api/chatbot-leads", requireAuth, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT id, name, phone, email, company, notes, conversation, status, created_at
       FROM chatbot_leads
       ORDER BY created_at DESC`,
    );
    res.json({ leads: result.rows });
  } catch (error: any) {
    console.error("[Chatbot Leads GET Error]:", error);
    res.status(500).json({ error: "Error al obtener los leads." });
  }
});

// POST /api/webhooks/chatbot-lead
// ---------------------------------------------------------------------------
// Inbound webhook — called by the WordPress AI Marketing Expert plugin when a
// visitor fills in the chatbot lead capture form.  Authenticated via the
// shared CRM_INTERNAL_TOKEN (X-CRM-Token header), matching class-crm-proxy.php.
//
// Expected body (mirrors aime_chatbot_lead_captured action payload):
//   { email, first_name, last_name?, phone?, company?, source, tags?, metadata? }
// ---------------------------------------------------------------------------
app.post("/api/webhooks/chatbot-lead", requireCrmToken, async (req, res) => {
  try {
    const { email, first_name, last_name, phone, company, source, tags, metadata } = req.body ?? {};
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "email requerido" });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ").trim() || email;
    const notes = [
      source ? `Fuente: ${source}` : null,
      tags?.length ? `Tags: ${(tags as string[]).join(", ")}` : null,
      metadata?.page_url ? `Página: ${metadata.page_url}` : null,
    ].filter(Boolean).join("\n") || null;

    const conversation = metadata ? JSON.stringify(metadata) : null;

    const result = await pgPool.query(
      `INSERT INTO chatbot_leads (name, phone, email, company, notes, conversation)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, phone, email, company, notes, status, created_at`,
      [name, phone?.trim() || null, email.trim(), company?.trim() || null, notes, conversation],
    );
    res.status(201).json({ ok: true, lead: result.rows[0] });
  } catch (error: any) {
    console.error("[Webhook Chatbot Lead Error]:", error);
    res.status(500).json({ error: "Error al guardar el lead." });
  }
});

// PATCH /api/chatbot-leads/:id
// Body: { status: "nuevo"|"contactado"|"calificado"|"descartado" }
app.patch("/api/chatbot-leads/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    const VALID = ["nuevo", "contactado", "calificado", "descartado"];
    if (!VALID.includes(status)) return res.status(400).json({ error: "status inválido" });
    const result = await pgPool.query(
      `UPDATE chatbot_leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [status, id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "lead not found" });
    res.json({ ok: true, id, status });
  } catch (error: any) {
    console.error("[Chatbot Leads PATCH Error]:", error);
    res.status(500).json({ error: "Error al actualizar el lead." });
  }
});

// ---------------------------------------------------------------------------
// Santi SDR — DB migration: create tables if they don't exist yet
// ---------------------------------------------------------------------------
async function initSantiTables() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS santi_leads (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name TEXT NOT NULL,
      industry     VARCHAR(120),
      city         VARCHAR(120),
      address      TEXT,
      contact_name TEXT,
      contact_phone VARCHAR(30),
      contact_role  VARCHAR(120),
      pain_point    TEXT,
      fit_score     INTEGER,
      amount_ars    INTEGER DEFAULT 180000,
      meddic_score  INTEGER,
      guiacores_url TEXT,
      status        VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      source        VARCHAR(60) DEFAULT 'patagonia_explorer',
      created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS santi_brochures (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id    UUID NOT NULL REFERENCES santi_leads(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      hook       TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS santi_notes (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id    UUID NOT NULL REFERENCES santi_leads(id) ON DELETE CASCADE,
      summary    TEXT NOT NULL,
      author     VARCHAR(60) NOT NULL DEFAULT 'santi',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("[Santi] Tablas santi_leads / santi_brochures / santi_notes listas.");
}

// ---------------------------------------------------------------------------
// Santi SDR — endpoints de ingesta (requireAuth: solo el CRM los llama)
// ---------------------------------------------------------------------------

// POST /api/leads
// Body: { company_name, industry, city, address, contact_name, contact_phone,
//         contact_role, pain_point, fit_score, amount_ars, meddic_score, guiacores_url }
// Crea un lead nuevo; devuelve el id generado.
app.post("/api/leads", requireAuth, async (req, res) => {
  try {
    const {
      company_name, industry, city, address,
      contact_name, contact_phone, contact_role,
      pain_point, fit_score, amount_ars, meddic_score, guiacores_url,
    } = req.body ?? {};
    if (!company_name) return res.status(400).json({ error: "company_name requerido" });
    const result = await pgPool.query(
      `INSERT INTO santi_leads
         (company_name, industry, city, address, contact_name, contact_phone,
          contact_role, pain_point, fit_score, amount_ars, meddic_score, guiacores_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [company_name, industry ?? null, city ?? null, address ?? null,
       contact_name ?? null, contact_phone ?? null, contact_role ?? null,
       pain_point ?? null, fit_score ?? null, amount_ars ?? 180000,
       meddic_score ?? null, guiacores_url ?? null],
    );
    res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (error: any) {
    console.error("[Leads POST Error]:", error);
    res.status(500).json({ error: "Error al crear el lead." });
  }
});

// POST /api/leads/:id/brochure
// Body: { content, hook? }
// Guarda (o reemplaza) el brochure generado por IA para ese lead.
// DELETE + INSERT run inside a transaction so a concurrent request can never
// leave the row in a deleted-but-not-yet-inserted state.
app.post("/api/leads/:id/brochure", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content, hook } = req.body ?? {};
  if (!content) return res.status(400).json({ error: "content requerido" });
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM santi_brochures WHERE lead_id = $1`, [id]);
    await client.query(
      `INSERT INTO santi_brochures (lead_id, content, hook) VALUES ($1, $2, $3)`,
      [id, content, hook ?? null],
    );
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("[Leads Brochure POST Error]:", error);
    res.status(500).json({ error: "Error al guardar el brochure." });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// Santi SDR — endpoints de consumo (requireApiKey: solo Hermes los llama)
// ---------------------------------------------------------------------------

// GET /api/leads?status=pendiente&limit=20
app.get("/api/leads", requireApiKey, async (req, res) => {
  try {
    const status = (req.query.status as string) || "pendiente";
    const limit  = Math.min(Number(req.query.limit) || 20, 100);
    const result = await pgPool.query(
      `SELECT id, company_name, industry, city, contact_name, contact_phone,
              contact_role, pain_point, fit_score, amount_ars, status, created_at
       FROM santi_leads
       WHERE status = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [status, limit],
    );
    res.json({ leads: result.rows });
  } catch (error: any) {
    console.error("[Leads GET Error]:", error);
    res.status(500).json({ error: "Error al obtener los leads." });
  }
});

// GET /api/leads/:id/brochure
app.get("/api/leads/:id/brochure", requireApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pgPool.query(
      `SELECT * FROM santi_brochures WHERE lead_id = $1 LIMIT 1`,
      [id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "brochure not found" });
    res.json({ brochure: result.rows[0] });
  } catch (error: any) {
    console.error("[Leads Brochure GET Error]:", error);
    res.status(500).json({ error: "Error al obtener el brochure." });
  }
});

// PATCH /api/leads/:id
// Body: { status: "pendiente"|"contactado"|"caliente"|"tibio"|"frio"|"agendado" }
app.patch("/api/leads/:id", requireApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    const VALID = ["pendiente","contactado","caliente","tibio","frio","agendado"];
    if (!VALID.includes(status)) return res.status(400).json({ error: "status inválido" });
    const result = await pgPool.query(
      `UPDATE santi_leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [status, id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "lead not found" });
    res.json({ ok: true, id, status });
  } catch (error: any) {
    console.error("[Leads PATCH Error]:", error);
    res.status(500).json({ error: "Error al actualizar el lead." });
  }
});

// POST /api/leads/:id/notes
// Body: { summary: string }
app.post("/api/leads/:id/notes", requireApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body ?? {};
    if (!summary) return res.status(400).json({ error: "summary requerido" });
    const check = await pgPool.query(`SELECT id FROM santi_leads WHERE id = $1`, [id]);
    if (!check.rows[0]) return res.status(404).json({ error: "lead not found" });
    await pgPool.query(
      `INSERT INTO santi_notes (lead_id, summary) VALUES ($1, $2)`,
      [id, summary],
    );
    res.json({ ok: true, id });
  } catch (error: any) {
    console.error("[Leads Notes POST Error]:", error);
    res.status(500).json({ error: "Error al guardar la nota." });
  }
});

// ─── ORQUESTADOR IA ──────────────────────────────────────────────────────────
// ── GET /api/orchestrator/metrics — lightweight KPI snapshot (no AI) ──────────
app.get("/api/orchestrator/metrics", requireAuth, async (req, res) => {
  try {
    const [leadsResult, chatbotResult, pipelineResult, topLeadsResult, industriesResult] = await Promise.all([
      pgPool.query(`SELECT status, COUNT(*) as count FROM santi_leads GROUP BY status`),
      pgPool.query(`SELECT status, COUNT(*) as count FROM chatbot_leads GROUP BY status`),
      pgPool.query(`
        SELECT COUNT(*) as total,
          COALESCE(SUM(amount_ars), 0) as total_ars,
          COALESCE(AVG(meddic_score), 0) as avg_meddic,
          COALESCE(AVG(fit_score), 0) as avg_fit
        FROM santi_leads
      `),
      pgPool.query(`
        SELECT company_name, industry, city, status, amount_ars, fit_score, meddic_score
        FROM santi_leads ORDER BY amount_ars DESC NULLS LAST LIMIT 5
      `),
      pgPool.query(`
        SELECT industry, COUNT(*) as count, COALESCE(SUM(amount_ars),0) as total_ars
        FROM santi_leads WHERE industry IS NOT NULL
        GROUP BY industry ORDER BY count DESC LIMIT 5
      `),
    ]);

    const leadsByStatus: Record<string, number> = {};
    leadsResult.rows.forEach((r: any) => { leadsByStatus[r.status] = parseInt(r.count); });

    const chatbotByStatus: Record<string, number> = {};
    chatbotResult.rows.forEach((r: any) => { chatbotByStatus[r.status] = parseInt(r.count); });

    const pipeline = pipelineResult.rows[0];

    res.json({
      leads: { byStatus: leadsByStatus, ...pipeline },
      chatbot: { byStatus: chatbotByStatus, total: Object.values(chatbotByStatus).reduce((a: number, b) => a + (b as number), 0) },
      topLeads: topLeadsResult.rows,
      industries: industriesResult.rows,
    });
  } catch (error: any) {
    console.error("[Orchestrator Metrics Error]:", error);
    res.status(500).json({ error: error.message || "Error al obtener métricas" });
  }
});

// ── POST /api/orchestrator — AI Orchestrator with generateAny (Groq→OR→Gemini) ─
app.post("/api/orchestrator", requireAuth, async (req, res) => {
  try {
    const { message, history = [], targetAgent } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message requerido" });

    const ai = getAI();

    // Gather rich real-time DB context
    const [leadsResult, chatbotResult, pipelineResult, topLeadsResult, recentChatbotResult] = await Promise.all([
      pgPool.query(`SELECT status, COUNT(*) as count FROM santi_leads GROUP BY status`),
      pgPool.query(`SELECT status, COUNT(*) as count FROM chatbot_leads GROUP BY status`),
      pgPool.query(`
        SELECT COUNT(*) as total,
          COALESCE(SUM(amount_ars), 0) as total_ars,
          COALESCE(AVG(meddic_score), 0) as avg_meddic,
          COALESCE(AVG(fit_score), 0) as avg_fit
        FROM santi_leads
      `),
      pgPool.query(`
        SELECT company_name, industry, city, status, amount_ars, fit_score, meddic_score, pain_point
        FROM santi_leads ORDER BY amount_ars DESC NULLS LAST LIMIT 8
      `),
      pgPool.query(`
        SELECT name, company, phone, email, status, created_at
        FROM chatbot_leads ORDER BY created_at DESC LIMIT 5
      `),
    ]);

    const leadsByStatus: Record<string, number> = {};
    leadsResult.rows.forEach((r: any) => { leadsByStatus[r.status] = parseInt(r.count); });

    const chatbotByStatus: Record<string, number> = {};
    chatbotResult.rows.forEach((r: any) => { chatbotByStatus[r.status] = parseInt(r.count); });

    const pipeline = pipelineResult.rows[0];
    const today = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const totalChatbot = Object.values(chatbotByStatus).reduce((a, b) => a + b, 0);

    const topLeadsText = topLeadsResult.rows.length > 0
      ? topLeadsResult.rows.map((l: any, i: number) =>
          `  ${i + 1}. ${l.company_name} (${l.industry ?? "—"}, ${l.city ?? "—"}) · ${l.status} · ${Number(l.amount_ars ?? 0).toLocaleString("es-AR")} ARS · Fit: ${l.fit_score ?? "—"}/10 · MEDDIC: ${l.meddic_score ?? "—"}`
        ).join("\n")
      : "  (sin leads cargados aún)";

    const recentChatbotText = recentChatbotResult.rows.length > 0
      ? recentChatbotResult.rows.map((l: any) =>
          `  • ${l.name}${l.company ? ` (${l.company})` : ""} · ${l.status} · ${new Date(l.created_at).toLocaleDateString("es-AR")}`
        ).join("\n")
      : "  (sin leads de chatbot recientes)";

    const contextData = `
═══ DATOS EN TIEMPO REAL DE CLIENTUM (${today}) ═══

📊 PIPELINE SDR SANTI:
• Total leads: ${pipeline.total ?? 0}
• Pendientes: ${leadsByStatus["pendiente"] ?? 0} | Contactados: ${leadsByStatus["contactado"] ?? 0} | Calientes: ${leadsByStatus["caliente"] ?? 0}
• Tibios: ${leadsByStatus["tibio"] ?? 0} | Fríos: ${leadsByStatus["frio"] ?? 0} | Agendados: ${leadsByStatus["agendado"] ?? 0}
• Valor total pipeline: ${Number(pipeline.total_ars ?? 0).toLocaleString("es-AR")} ARS
• MEDDIC score promedio: ${parseFloat(pipeline.avg_meddic ?? "0").toFixed(1)}/100
• Fit score promedio: ${parseFloat(pipeline.avg_fit ?? "0").toFixed(1)}/10

🏆 TOP LEADS POR VALOR:
${topLeadsText}

💬 CHATBOT LEADS (inbound sitio web):
• Total: ${totalChatbot} | Nuevos: ${chatbotByStatus["nuevo"] ?? 0} | Contactados: ${chatbotByStatus["contactado"] ?? 0} | Calificados: ${chatbotByStatus["calificado"] ?? 0}
Recientes:
${recentChatbotText}
`.trim();

    // Agent-specific persona injection
    const agentPersonas: Record<string, string> = {
      "Ventas": `Sos el Agente de Ventas de Clientum (Sales Manager AI). Especialidad: pipeline, MEDDIC scoring, estrategia de cierre, gestión de Santi SDR y Explorador Patagónico. Revisás los leads calientes, priorizás los de mayor valor, y dás instrucciones de acción concretas.`,
      "Técnico": `Sos el Agente Técnico de Clientum (CTO AI). Especialidad: arquitectura del sistema, bugs, features nuevos, base de datos (PostgreSQL), despliegues en Replit/Vercel, integraciones (WhatsApp, Google Maps, Apify, Gemini/Groq/OpenRouter). Tenés visión del stack completo.`,
      "Marketing": `Sos el Agente de Marketing de Clientum. Especialidad: leads inbound del chatbot, SEO local patagónico, copy comercial para PyMEs, campañas de outreach, estrategia de contenido. Analizás los chatbot leads y dás acciones para convertirlos.`,
      "Customer Success": `Sos el Agente de Customer Success de Clientum. Especialidad: onboarding de nuevos clientes, satisfacción, churn prevention, seguimiento post-venta. Tu foco es que cada PyME que contrata Clientum lo active rápido y no se vaya.`,
      "Operaciones": `Sos el Agente de Operaciones de Clientum (COO AI). Especialidad: métricas del negocio, MRR, KPIs clave, reportes ejecutivos, finanzas, análisis de crecimiento. Usás los datos reales de la DB para generar insights accionables.`,
    };

    const detectedAgent = targetAgent && agentPersonas[targetAgent]
      ? targetAgent
      : null; // let the model decide

    const agentInstructions = detectedAgent
      ? `AGENTE ACTIVO: ${detectedAgent}\n${agentPersonas[detectedAgent]}\nRespondé directamente como este agente.`
      : `ROUTING: Detectá el agente más adecuado según el mensaje y respondé con [AGENTE: Nombre] en la primera línea.\nAgentes disponibles: Ventas, Técnico, Marketing, Customer Success, Operaciones, Orquestador.\n${Object.entries(agentPersonas).map(([k, v]) => `• ${k}: ${v.split(".")[0]}`).join("\n")}`;

    // Build conversation history for context
    const historyText = (history as Array<{role: string; content: string}>)
      .slice(-10)
      .map((m) => `${m.role === "user" ? "Jonathan" : "Agente"}: ${m.content}`)
      .join("\n\n");

    const fullPrompt = `Sos el Orquestador IA de Clientum, el asistente central de Jonathan (dueño y CEO de Clientum).

Clientum es un CRM B2B con IA para PyMEs de la Patagonia argentina. Incluye: prospección via Google Maps/Apify, calificación MEDDIC, brochures PDF por industria, outreach automatizado por WhatsApp via el agente SDR "Santi", y copiloto IA para el equipo comercial.

${agentInstructions}

${contextData}

${historyText ? `CONVERSACIÓN PREVIA:\n${historyText}\n\n` : ""}MENSAJE DE JONATHAN: ${message}

INSTRUCCIONES:
${detectedAgent ? `- Respondé directamente como el Agente ${detectedAgent} sin necesidad de indicar [AGENTE:]` : "- Primera línea: [AGENTE: NombreDelAgente]"}
- Usá voseo argentino, tono directo y profesional
- Usá los datos reales cuando sean relevantes
- Máximo 350 palabras
- Usá **negrita** para números y puntos clave
- Listas con • para bullet points
- Al final: 1-2 próximos pasos concretos si aplica
- Nunca inventés datos que no estén en el contexto`;

    const rawText = await generateAny(ai, fullPrompt);

    if (!rawText) {
      return res.status(503).json({ error: "Todos los proveedores de IA fallaron. Intentá en unos momentos." });
    }

    // Extract agent tag
    const agentMatch = rawText.match(/^\[AGENTE:\s*([^\]]+)\]/i);
    const agentName = detectedAgent || (agentMatch ? agentMatch[1].trim() : "Orquestador");
    const cleanResponse = rawText.replace(/^\[AGENTE:\s*[^\]]+\]\s*/i, "").trim();

    console.log(`[Orchestrator] Agente: ${agentName} | Chars: ${cleanResponse.length}`);
    res.json({ ok: true, response: cleanResponse, agent: agentName });

  } catch (error: any) {
    console.error("[Orchestrator Error]:", error);
    res.status(500).json({ error: error.message || "Error en el orquestador IA" });
  }
});

// Configure Vite or Static Files
async function setupServer() {
  const isProd = process.env.NODE_ENV === "production";

  // In production, register static middleware synchronously BEFORE binding
  // the port so every request — including the very first healthcheck — is
  // served correctly without a race window.
  if (isProd) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind the port BEFORE any async work so Cloud Run's healthcheck never
  // sees a refused connection and incorrectly triggers a restart loop.
  // ── AI provider availability check ───────────────────────────────────────
  const aiProviders = [
    { name: "Gemini",      key: process.env.GEMINI_API_KEY },
    { name: "Groq",        key: process.env.GROQ_API_KEY },
    { name: "OpenRouter",  key: process.env.OPENROUTER_API_KEY },
  ];
  const available = aiProviders.filter(p => p.key && p.key.trim() !== "").map(p => p.name);
  const missing   = aiProviders.filter(p => !p.key || p.key.trim() === "").map(p => p.name);
  if (available.length) console.log(`[AI] Proveedores disponibles: ${available.join(", ")}`);
  if (missing.length)   console.warn(`[AI] Sin configurar: ${missing.join(", ")} — usando fallback local`);
  // ─────────────────────────────────────────────────────────────────────────

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Clientum Server] Servidor corriendo en http://localhost:${PORT}`);
  });

  // Handle EADDRINUSE and other listen errors gracefully instead of letting
  // the unhandled 'error' event crash the process and create a crash loop
  // where a new instance inherits a still-occupied port.
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Clientum Server] Puerto ${PORT} ya en uso. Terminando.`);
    } else {
      console.error("[Clientum Server] Error al iniciar el servidor:", err.message);
    }
    process.exit(1);
  });

  // Init DB tables after port is bound — failures here won't block responses.
  await initUsersTable();
  await initPasswordResetTokensTable();
  await initChatbotLeadsTable();
  await initSantiTables();

  // In dev, attach Vite middleware after DB init.
  // Dynamic import (not a static top-level import) so that in production
  // (Vercel) the "vite" package — and the "rollup" native binary it pulls
  // in — is never loaded at all. A static import would load it on module
  // init regardless of NODE_ENV, which is what was crashing the /api/index
  // serverless function on Vercel with "Cannot find module
  // @rollup/rollup-linux-x64-gnu".
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        // Replit proxies through HTTPS/443; tell the HMR client to connect
        // on 443 instead of the raw container port, or the WS handshake fails.
        hmr: { clientPort: 443 },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

}

// Export app and DB init functions for Vercel serverless deployment.
// All API routes are registered at module level above, so importing this
// file is enough to wire up Express; setupServer() only adds static serving,
// app.listen(), and Vite dev middleware — none of which apply on Vercel.
export { app };
export { initUsersTable, initChatbotLeadsTable, initSantiTables };

// Only bind a TCP port when NOT running as a Vercel serverless function.
if (!process.env.VERCEL) {
  setupServer();
}
