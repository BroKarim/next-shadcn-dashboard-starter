/**
 * Domain errors for server actions (task_plan.md §5, D21).
 *
 * Server actions catch these and translate them into safe user-facing
 * messages via `toUserMessage`. Raw database error details must never leak
 * to the client — anything else is surfaced as a generic failure message.
 */

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Anda harus masuk untuk melakukan aksi ini.') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki hak akses untuk aksi ini.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Data yang dikirim tidak valid.') {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Safe message for toasts; never exposes raw database error details. */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return 'Terjadi kesalahan. Coba lagi atau hubungi admin.';
}
