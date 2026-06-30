/**
 * Message strings to be returned in the response body
 */

// Success
export const userCreatedSuccessfully_message: string =
  "User created successfully";
export const walletUpdatedSuccessfully_message: string =
  "Wallet updated successfully";

export const ErrorMessages = {
  MalformedPayload: "Bad Request - Malformed payload",
  UserNotFound: ({ userId }: { userId: string }) => `User with id '${userId}' not found`,
  Unauthorized: "Unauthorized",
  Forbidden: "Forbidden",
  InternalServer: "Internal server error",
  WrongCredentials: "Wrong username or password",
  AuctionNotFound: ({ auctionId }: { auctionId: string }) => `Auction with id '${auctionId}' not found`,
  InvalidAuctionStatus: ({ status }: { status: number }) => `Auction status '${status}' not found`,
  FieldAlreadyUsed: ({ field, value }: { field: string, value: string }) => `Field '${field}' with value '${value}' already used`,
  ZodValidation: ({ form }: { form: string }) =>
      `Validation failed on ${form}`
}