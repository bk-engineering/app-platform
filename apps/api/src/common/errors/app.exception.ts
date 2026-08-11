import { HttpException, HttpStatus } from "@nestjs/common";
import type { ErrorDetail } from "@app-platform/contracts";

export class AppException extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus,
    readonly details: ErrorDetail[] = [],
  ) {
    super(message, status);
  }
}

// short helpers so call sites never need to remember status codes
export const Errors = {
  invalidCredentials: () =>
    new AppException("AUTH_INVALID_CREDENTIALS", "Invalid credentials", HttpStatus.UNAUTHORIZED),
  refreshInvalid: () =>
    new AppException("AUTH_REFRESH_INVALID", "Refresh token is unknown, expired, or revoked", HttpStatus.UNAUTHORIZED),
  refreshReused: () =>
    new AppException(
      "AUTH_REFRESH_REUSED",
      "Refresh token was already used — the whole session family has been revoked",
      HttpStatus.UNAUTHORIZED,
    ),
  tokenExpired: () =>
    new AppException("AUTH_TOKEN_EXPIRED", "Access token expired", HttpStatus.UNAUTHORIZED),
  tokenInvalid: () =>
    new AppException("AUTH_TOKEN_INVALID", "Access token is invalid", HttpStatus.UNAUTHORIZED),
  tokenMissing: () =>
    new AppException("AUTH_TOKEN_MISSING", "No access token provided", HttpStatus.UNAUTHORIZED),
  emailTaken: () => new AppException("USER_EMAIL_TAKEN", "Email already registered", HttpStatus.CONFLICT),
  userNotFound: () => new AppException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
  forbidden: (action: string, subject: string) =>
    new AppException("AUTHZ_FORBIDDEN", `Not allowed to ${action} ${subject}`, HttpStatus.FORBIDDEN),
};
