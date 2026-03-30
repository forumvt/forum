import { createAuthClient } from "better-auth/react";

const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export const authClient = createAuthClient({
  baseURL: appBase ? `${appBase}/api/auth` : undefined,
});