import { StatusCodes } from "http-status-codes";
import { ErrorDetails, ErrorMessages } from "./messageStrings.ts";
import type { ZodError } from "zod";
import type { Auction } from "../models/Auction.ts";
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
  WalletNotFoundError: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.WalletNotFound },
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
  AuctionTypeNotSupportedError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.AuctionTypeNotSupported },
  RouteNotFoundError: { status: StatusCodes.NOT_FOUND, message: ErrorMessages.RouteNotFound },
  InsufficientTokensError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.InsufficientTokens },
  InvariantViolationError: { status: StatusCodes.INTERNAL_SERVER_ERROR, message: ErrorMessages.InvariantViolation },
  AuctionHasAlreadyAbBidError: { status: StatusCodes.BAD_REQUEST, message: ErrorMessages.AuctionHasAlreadyABid }
});

export function createZodError(error: ZodError, form: string): AppError {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join("."); // necessary because path it's an array
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }

  return new Errors.ValidationError({
    form,
    errors: details,
  });
}

export function createSequelizeError(error: unknown, form: string): AppError {
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0]?.path ?? "field";
    const value = error.errors[0]?.value ?? "value";
    return new Errors.FieldAlreadyUsedError({field, value});
  }

  if (error instanceof ValidationError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.errors) {
      const path = issue.path as string // necessary because path it's an array
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return new Errors.ValidationError({ form, errors: details });
  }

  // Not a Sequelize error we recognize — let the caller decide what to do.
  return new Errors.InternalServerError();
}

/**
 * Parses an Auth0 error into an `AppError` with the appropriate HTTP status.
 * Falls back to a 500 InternalServer error if the error is unrecognized.
 * 
 * @param error - The error thrown by the Auth0 SDK
 */
export function createAuth0Error(error: any): AppError {
  if (error?.statusCode && error?.body?.message) {
    return new AppError(error.statusCode, error.body.message, error.constructor?.name);
  }

  if (error instanceof Error) {
    const statusCode = (error as any)?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    return new AppError(statusCode, error.message, error.name);
  }

  return new Errors.InternalServerError();
}

export function createAuctionMissingFieldError(auction: Auction, fieldName: string): AppError {
  return new Errors.InvariantViolationError({ message: `Auction '${auction.id}' of type '${auction.type}' has no '${fieldName}'` })
}

export function createReservePriceTooHighError(form: string): AppError {
  return new Errors.ValidationError({
    form, errors: {
      reservePrice: ["Reserve price too high: must be lower than the current auction reserve price."],
    }
  });
}