// factory/errorFactory.ts
import { StatusCodes } from "http-status-codes";
import { ErrorDetails, ErrorMessages } from "./messageStrings.ts";
import type { ZodError } from "zod";
import type { AuctionType } from "../models/Auction.ts";
import { UniqueConstraintError, ValidationError } from "sequelize";

/**
 * Base error class for all application errors.
 * Extends the native Error with an HTTP status code.
 * 
 * @property status - The HTTP status code associated with the error
 */
export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, msg: string, name: string, details: unknown = null) {
    super(msg);
    this.name = name;
    this.status = status;
    this.details = details;
  }
}

type MessageFn<T> = (params: T) => string;
type DetailsFn<T> = (params: T) => unknown;
type Details<T> = string | object | DetailsFn<T>;

// Args for constructors. Depends if the error needs params or not (fixed string, function without params)
type CtorArgs<T> = T extends void ? [] : [T];

function defineAppErrorClass<T = void>(
  statusCode: number,
  errorName: string,
  message: string | MessageFn<T>,
  details?: Details<T>
) {
  // If we pass a plain string as a message, we create an anomymous function that returns the message
  // Otherwise, we use the provided function
  const messageFn = typeof message === "function" ? (message as MessageFn<T>) : () => message;
  // if we have an object in details, we create a function that returns it. Otherwise we use the
  // provided function
  const detailsFn = typeof details === "function" ? (details as DetailsFn<T>) : () => details;

  return class extends AppError {
    constructor(...args: CtorArgs<T>) {
      // here params is either void (CtorArgs = []) or an object T (CtorArgs = [T])
      const params = args[0] as T;

      super(statusCode, messageFn(params), errorName, detailsFn(params));
    }
  };
}

type ErrorSpec<T> = {
  status: number;
  message: string | MessageFn<T>;
  details?: Details<T>;
};
type ParamsOf<S> = S extends ErrorSpec<infer T> ? (unknown extends T ? void : T) : never;
type AppErrorClass<T> = new (...args: CtorArgs<T>) => AppError;

function buildErrors<M extends Record<string, ErrorSpec<any>>>(specs: M) {
  const result = {} as { [K in keyof M]: AppErrorClass<ParamsOf<M[K]>> };
  (Object.keys(specs) as (keyof M)[]).forEach((key) => {
    const { status, message, details } = specs[key]!;
    result[key] = defineAppErrorClass(status, key as string, message, details) as any;
  });
  return result;
}

export const Errors = buildErrors({
  MalformedPayloadError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.MalformedPayload },
  UserNotFoundError: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.UserNotFound },
  UnauthorizedError: { status: StatusCodes.UNAUTHORIZED, message: ErrorMessages.Unauthorized },
  ForbiddenError: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.Forbidden },
  InternalServerError: { status: StatusCodes.INTERNAL_SERVER_ERROR, message: ErrorMessages.InternalServer },
  AuctionNotFoundError: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.AuctionNotFound },
  InvalidAuctionStatusError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.InvalidAuctionStatus },
  FieldAlreadyUsedError: { status: StatusCodes.CONFLICT, message: ErrorMessages.FieldAlreadyUsed },
  WrongCredentialsErrors: { status: StatusCodes.UNAUTHORIZED, message: ErrorMessages.WrongCredentials },
  ValidationError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.Validation, details: ErrorDetails.Validation },
  AuctionEndedError: { status: StatusCodes.CONFLICT, message: ErrorMessages.AuctionEnded },
  BidTooLowError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.BidTooLow, details: ErrorDetails.BidTooLow },
  BidAlreadyPlacedError: { status: StatusCodes.CONFLICT, message: ErrorMessages.BidAlreadyPlaced },
  AuctionTypeNotSupportedError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.AuctionTypeNotSupported, details: ErrorDetails.AuctionTypeNotSupported },
  RouteNotFoundError: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.RouteNotFound }
});

export function parseZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join("."); // necessary because path it's an array
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }
  return details;
}

export function parseSequelizeError(err: unknown, form: string) {
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path ?? "field";
    const value = err.errors[0]?.value ?? "value";
    throw new Errors.FieldAlreadyUsedError({field, value});
  }

  if (err instanceof ValidationError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.errors) {
      const path = issue.path as string // necessary because path it's an array
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return new Errors.ValidationError({ form, errors: details });
  }

  // Not a Sequelize error we recognize — let the caller decide what to do.
  throw err;
}

/**
 * Parses an Auth0 error into an `AppError` with the appropriate HTTP status.
 * Falls back to a 500 InternalServer error if the error is unrecognized.
 * 
 * @param err - The error thrown by the Auth0 SDK
 */
export function parseAuth0Error(err: any): AppError {
  if (err?.statusCode && err?.body?.message) {
    return new AppError(err.statusCode, err.body.message, err.constructor?.name);
  }

  if (err instanceof Error) {
    const statusCode = (err as any)?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    return new AppError(statusCode, err.message, err.name);
  }

  throw new Errors.InternalServerError();
}
