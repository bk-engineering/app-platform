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
  emailTaken: () => new AppException("USER_EMAIL_TAKEN", "Email already registered", HttpStatus.CONFLICT),
  userNotFound: () => new AppException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
  forbidden: (action: string, subject: string) =>
    new AppException("AUTHZ_FORBIDDEN", `Not allowed to ${action} ${subject}`, HttpStatus.FORBIDDEN),
};
