export const POST_MAX_LENGTH = 10_000;

export const AVATAR_DAILY_LIMIT = 3;

export const COOLDOWN_SECONDS = {
  postReply: 30,
  threadCreate: 60,
  pmSend: 10,
} as const;

export const RATE_LIMITS = {
  postReply: { requests: 20, window: "1 h" as const },
  threadCreate: { requests: 5, window: "1 h" as const },
  pmSend: { requests: 10, window: "1 m" as const },
  likeToggle: { requests: 30, window: "1 m" as const },
  reportCreate: { requests: 5, window: "1 h" as const },
  signatureUpdate: { requests: 10, window: "1 h" as const },
  presence: { requests: 1, window: "1 m" as const },
  authSignIn: { requests: 10, window: "15 m" as const },
  authSignUp: { requests: 3, window: "1 h" as const },
  authForgotPassword: { requests: 3, window: "1 h" as const },
} as const;

export const DUPLICATE_CONTENT_TTL_SECONDS = 300;
