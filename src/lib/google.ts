import { google } from "googleapis";

function getGoogleEnv() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  };
}

export type StoredTokens = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
};

export function ensureGoogleEnv() {
  const { clientId, clientSecret, redirectUri } = getGoogleEnv();

  if (!clientId || !clientSecret || !redirectUri) {
    const missing = [
      !clientId && "GOOGLE_CLIENT_ID",
      !clientSecret && "GOOGLE_CLIENT_SECRET",
      !redirectUri && "GOOGLE_REDIRECT_URI",
    ].filter(Boolean);
    // Log which keys are missing to simplify debugging without exposing values
    console.error("Missing Google env vars:", missing.join(", "));
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI を .env に設定してください"
    );
  }
}

export function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleEnv();
  ensureGoogleEnv();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function buildAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "openid",
      "email",
      "profile",
    ],
  });
}

export function parseTokens(raw?: string | null): StoredTokens | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}
