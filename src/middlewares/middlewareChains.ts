import { checkJwt, checkPermission } from "./authMiddleware.ts";
import { validateAuctionMiddleware } from "./validateAuction.ts";
import { validateSignup } from "./validationMiddleware.ts";

export const authMiddlewares = [checkJwt];

export const authWithPermission = (permission: string) => [
  ...authMiddlewares,
  checkPermission(permission)
];

export const createAuctionMiddlewares = [
  ...authWithPermission('create:auction'),
  validateAuctionMiddleware
];

export const signupMiddlewares = [
  validateSignup
];

export const loginMiddlewares = [
  validateSignup
];