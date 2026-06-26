// factory/errorFactory.ts
import * as Message from "./messageStrings.ts";

/**
 * Base error class for all application errors.
 * Extends the native Error with an HTTP status code.
 * 
 * @property status - The HTTP status code associated with the error
 */
export class AppError extends Error {
  status: number;
  detail: string | null;

  constructor(status: number, msg: string, name: string, detail: string | null = null) {
    super(msg);
    this.name = name;
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Enum of all possible application errors.
 * Use with `createError()` to generate the corresponding `AppError`.
 */
export const ErrorEnum = {
  MissingToken: 0,
  InvalidToken: 1,
  RouteNotFound: 2,
  NoAuthHeader: 3,
  NoPayloadHeader: 4,
  MalformedPayload: 5,
  UserNotFound: 6,
  BadRequest: 7,
  Unauthorized: 8,
  Forbidden: 9,
  NotFound: 10,
  InternalServer: 11,
  ServiceUnavailable: 12,
  ValidationError: 13,
  DatabaseError: 14,
} as const;
export type ErrorEnum = typeof ErrorEnum[keyof typeof ErrorEnum];

const errorMap: Record<ErrorEnum, { status: number; msg: string; name: string }> = {
  [ErrorEnum.MissingToken]: { status: 400, msg: Message.missingToken_message, name: "MissingTokenError" },
  [ErrorEnum.InvalidToken]: { status: 401, msg: Message.invalidToken_message, name: "InvalidTokenError" },
  [ErrorEnum.RouteNotFound]: { status: 404, msg: Message.routeNotFound_message, name: "RouteNotFoundError" },
  [ErrorEnum.NoAuthHeader]: { status: 400, msg: Message.noAuthHeader_message, name: "NoAuthHeaderError" },
  [ErrorEnum.NoPayloadHeader]: { status: 400, msg: Message.noPayloadHeader_message, name: "NoPayloadHeaderError" },
  [ErrorEnum.MalformedPayload]: { status: 400, msg: Message.malformedPayload_message, name: "MalformedPayloadError" },
  [ErrorEnum.UserNotFound]: { status: 404, msg: Message.userNotFound_message, name: "UserNotFoundError" },
  [ErrorEnum.BadRequest]: { status: 400, msg: Message.badRequest_message, name: "BadRequestError" },
  [ErrorEnum.Unauthorized]: { status: 401, msg: Message.unauthorized_message, name: "UnauthorizedError" },
  [ErrorEnum.Forbidden]: { status: 403, msg: Message.forbidden_message, name: "ForbiddenError" },
  [ErrorEnum.NotFound]: { status: 404, msg: Message.notFound_message, name: "NotFoundError" },
  [ErrorEnum.InternalServer]: { status: 500, msg: Message.internalServerError_message, name: "InternalServerError" },
  [ErrorEnum.ServiceUnavailable]: { status: 503, msg: Message.serviceUnavailable_message, name: "ServiceUnavailableError" },
  [ErrorEnum.ValidationError]: { status: 422, msg: Message.validationError_message, name: "ValidationError" },
  [ErrorEnum.DatabaseError]: { status: 500, msg: Message.databaseError_message, name: "DatabaseError" },
};

/**
 * Creates an `AppError` from the given error type.
 * @param type - The error type from `ErrorEnum`
 * @returns An `AppError` with the corresponding status, message and name
 */
export function createError(type: ErrorEnum, detail?: string): AppError {
  const { status, msg, name } = errorMap[type];
  const err = new AppError(status, msg, name, detail);
  return err;
}

/**
 * Returns the HTTP status code for the given error type.
 * @param type - The error type from `ErrorEnum`
 */
export function getErrorHTTPStatus(type: ErrorEnum): number {
  return errorMap[type].status
}

/**
 * Returns the error name for the given error type.
 * @param type - The error type from `ErrorEnum`
 */
export function getErrorName(type: ErrorEnum): string {
  return errorMap[type].name
}