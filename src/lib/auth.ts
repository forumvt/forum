import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { validateRegistrationCredentials } from "@/lib/register-validation";

export const auth = betterAuth({
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/sign-up/email") {
                return;
            }
            const body = ctx.body as {
                email?: unknown;
                password?: unknown;
            };
            const email = typeof body.email === "string" ? body.email : "";
            const password =
                typeof body.password === "string" ? body.password : "";
            const result = validateRegistrationCredentials(email, password);
            if (!result.ok) {
                throw new APIError("BAD_REQUEST", {
                    message: result.message,
                });
            }
        }),
    },
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema,
    }),
    user: {
        modelName: "userTable",
    },
    account: {
        modelName: "accountTable",
    },
    session: {
        modelName: "sessionTable",
    },
    verification: {
        modelName: "verificationTable"
    }
});