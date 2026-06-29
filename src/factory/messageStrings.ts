/**
 * Message strings to be returned in the response body
 */

// Errors
export const noAuthHeader_message: string =
  "Bad Request - No authorization header";
export const noPayloadHeader_message: string =
  "Bad Request - No JSON payload header";
export const missingToken_message: string = "Bad Request - Missing JWT Token";
export const invalidToken_message: string = "Forbidden - Invalid JWT Token";
export const malformedPayload_message: string =
  "Bad Request - Malformed payload";
export const routeNotFound_message: string = "Not Found - Route not found";
export const unauthorized_message: string = "ERROR - Unauthorized";
export const forbidden_message: string = "ERROR - Forbidden";
export const notFound_message: string = "ERROR - Not found";
export const internalServerError_message: string =
  "ERROR - Internal server error";
export const serviceUnavailable_message: string = "ERROR - Service unavailable";
export const badRequest_message: string = "ERROR - Bad request";
export const duplicateDatetimes_message: string =
  "Bad Request - Duplicate datetimes";
export const userNotFound_message: string = "Not Found - User not found";
export const validationError_message: string = "ERROR - Validation Error";
export const databaseError_message: string = "ERROR - Database Error";
export const invalidAuctionStatus_message: string =
  "ERROR - Invalid auction status";
export const wrongUsernameOrPassword_message: string =
  "Wrong username or password";

// Success
export const userCreatedSuccessfully_message: string =
  "User created successfully";
