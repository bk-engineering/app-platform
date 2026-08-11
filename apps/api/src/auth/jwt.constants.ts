// shared between signing (auth.service.ts) and verification (jwt.strategy.ts) — token
// from another system that happens to share the secret still won't pass without these
export const JWT_ISSUER = "app-platform";
export const JWT_AUDIENCE = "app-platform-web";
