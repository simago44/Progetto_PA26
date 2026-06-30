// factory/errorFactory.ts
import { StatusCodes } from "http-status-codes";
import { ErrorMessages } from "./messageStrings.ts";
import type { ZodError } from "zod";
import type { AuctionType } from "../models/Auction.ts";

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

export function defineAppError<T = void>(
  statusCode: number,
  errorName: string,
  message: string | MessageFn<T>
) {
  const messageFn = typeof message === "function" ? (message as MessageFn<T>) : () => message;
  return (params: T) => new AppError(statusCode, messageFn(params), errorName, params);
}

type MessageFn<T> = (params: T) => string;

// Args for constructors. Depends if the error needs params or not (fixed string, function without params)
type CtorArgs<T> = T extends void ? [] : [T];

function defineAppErrorClass<T = void>(
  statusCode: number,
  errorName: string,
  message: string | MessageFn<T>,
  detailsFn: (params: T) => unknown = (p) => p as unknown
) {
  // If we pass a plain string as a message, we create an anomymous function that returns the message
  // Otherwise, we use the provided function
  const messageFn = typeof message === "function" ? (message as MessageFn<T>) : () => message;

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
  detailsFn?: (params: T) => unknown;
};
type ParamsOf<S> = S extends ErrorSpec<infer T> ? (unknown extends T ? void : T) : never;
type AppErrorClass<T> = new (...args: CtorArgs<T>) => AppError;

function buildErrors<M extends Record<string, ErrorSpec<any>>>(specs: M) {
  const result = {} as { [K in keyof M]: AppErrorClass<ParamsOf<M[K]>> };
  (Object.keys(specs) as (keyof M)[]).forEach((key) => {
    const { status, message, detailsFn } = specs[key]!;
    result[key] = defineAppErrorClass(status, key as string, message, detailsFn) as any;
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
  ValidationError: {
    status: StatusCodes.BAD_REQUEST,
    message: ErrorMessages.ZodValidation,
    detailsFn: ({ errors } : { errors: Record<string, string[]>}) => errors
  },
  AuctionEndedError: { status: StatusCodes.CONFLICT, message: "This auction has already ended" },
  BidTooLowError: {
    status: StatusCodes.BAD_REQUEST,
    message: ({ minimumBid }: { minimumBid: number }) =>
      `Bid must be at least ${minimumBid}`,
    detailsFn: ({ minimumBid }: { minimumBid: number }) => ({ minimumBid }),
  },
  BidAlreadyPlacedError: { status: StatusCodes.CONFLICT, message: "You have already placed a bid in this auction" },
  AuctionTypeNotSupportedError: {
    status: StatusCodes.BAD_REQUEST,
    message: ({ type }: { type: AuctionType }) => `This operation is not supported for ${type} auctions`,
    detailsFn: ({ type }: { type: AuctionType }) => ({ type }),
  },
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
