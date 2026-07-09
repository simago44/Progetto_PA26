import { StatusCodes } from "http-status-codes";
import { ErrorDetails, ErrorMessages } from "./messageStrings.ts";
import type { ZodError } from "zod";
import type { Auction } from "../models/Auction.ts";
import { UniqueConstraintError, ValidationError } from "sequelize";
import logger from "../core/logger.ts";
import { AuthApiError } from "auth0";

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
type CtorArgs<T> = [T] extends [void] ? [] : [T];

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

  const cls = class extends AppError {
    constructor(...args: CtorArgs<T>) {
      // here params is either void (CtorArgs = []) or an object T (CtorArgs = [T])
      const params = args[0] as T;
      super(statusCode, messageFn(params), errorName, detailsFn(params));
    }
  };
  // we add the name property to use like that: Errors.SomeError.name (for jest mainly)
  Object.defineProperty(cls, "name", { value: errorName });
  return cls;
}

type ErrorSpec<T> = {
  status: number;
  message: string | MessageFn<T>;
  details?: Details<T>;
};
type ParamsOf<S> = S extends ErrorSpec<infer T> ? (unknown extends T ? void : T) : never;
type AppErrorClass<T> = new (...args: CtorArgs<T>) => AppError;

function buildErrors<M extends Record<string, ErrorSpec<never>>>(specs: M) {
  const result = {} as { [K in keyof M]: AppErrorClass<ParamsOf<M[K]>> };
  (Object.keys(specs) as (keyof M)[]).forEach((key) => {
    const { status, message, details } = specs[key]!;
    result[key] = defineAppErrorClass(status, key as string, message, details);
  });
  return result;
}

export const Errors = buildErrors({
  MalformedPayload: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.MalformedPayload },
  UserNotFound: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.UserNotFound },
  WalletNotFound: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.WalletNotFound },
  Unauthorized: { status: StatusCodes.UNAUTHORIZED, message: ErrorMessages.Unauthorized },
  Forbidden: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.Forbidden },
  InternalServer: { status: StatusCodes.INTERNAL_SERVER_ERROR, message: ErrorMessages.InternalServer },
  AuctionNotFound: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.AuctionNotFound },
  FieldAlreadyUsed: { status: StatusCodes.CONFLICT, message: ErrorMessages.FieldAlreadyUsed },
  InvalidCredentials: { status: StatusCodes.UNAUTHORIZED, message: ErrorMessages.InvalidCredentials },
  Validation: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.Validation, details: ErrorDetails.Validation },
  AuctionEnded: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.AuctionEnded },
  AuctionNotStarted: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.AuctionNotStarted },
  BidTooLow: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.BidTooLow, details: ErrorDetails.BidTooLow },
  BidAlreadyPlaced: { status: StatusCodes.CONFLICT, message: ErrorMessages.BidAlreadyPlaced },
  AuctionTypeNotSupported: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.AuctionTypeNotSupported },
  RouteNotFound: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.RouteNotFound },
  InsufficientTokens: { status: StatusCodes.FORBIDDEN, message: ErrorMessages.InsufficientTokens },
  AuctionHasAlreadyABid: { status: StatusCodes.CONFLICT, message: ErrorMessages.AuctionHasAlreadyABid },
  BidCantHavePrice: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.BidCantHavePrice },
  BidMustHavePrice: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.BidMustHavePrice }
});

export function createZodError(error: ZodError, form: string): AppError {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join("."); // necessary because path it's an array
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }

  return new Errors.Validation({
    form,
    errors: details,
  });
}

export function createSequelizeError(error: unknown, form: string): AppError {
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0]?.path ?? "field";
    const value = error.errors[0]?.value ?? "value";
    return new Errors.FieldAlreadyUsed({ field, value });
  }

  if (error instanceof ValidationError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.errors) {
      const path = issue.path as string; // necessary because path it's an array
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return new Errors.Validation({ form, errors: details });
  }

  if (error instanceof Error && error.name == 'SequelizeDatabaseError') {
    logger.error(`Database error: ${error.stack}`);
    return new Errors.InternalServer();
  }

  // Not a Sequelize error we recognize — let the caller decide what to do.
  return new Errors.InternalServer();
}

/**
 * Parses an Auth0 error into an `AppError` with the appropriate HTTP status.
 * Falls back to a 500 InternalServer error if the error is unrecognized.
 * 
 * @param error - The error thrown by the Auth0 SDK
 */
export function createAuth0Error(error: unknown): AppError {
  if (error instanceof AuthApiError) {
    return new AppError(Number(error.statusCode), error.error_description, error.name);
  }

  if (typeof error === "object" && error !== null && "statusCode" in error && "body" in error) {
    const err = error as { statusCode: unknown; body?: { message?: string; }; constructor?: { name?: string; }; };
    return new AppError(Number(err.statusCode), err.body?.message ?? "Unknown error", err.constructor?.name ?? "Auth0Error");
  }

  if (error instanceof Error) {
    const statusCode = "statusCode" in error ? Number(error.statusCode) : StatusCodes.INTERNAL_SERVER_ERROR;
    return new AppError(statusCode, error.message, error.name);
  }

  return new Errors.InternalServer();
}

export function createAuctionMissingFieldError(auction: Auction, fieldName: string): AppError {
  return createInternalServerError(`Auction '${auction.id}' of type '${auction.type}' has no '${fieldName}'`);
}

export function createInternalServerError(message: string) {
  logger.error(message);
  // we don't want to leak programming errors;
  return new Errors.InternalServer();
}

export function createReservePriceTooHighError(form: string): AppError {
  return new Errors.Validation({
    form, errors: {
      reservePrice: ["Reserve price too high: must be lower than the current auction reserve price."],
    }
  });
}