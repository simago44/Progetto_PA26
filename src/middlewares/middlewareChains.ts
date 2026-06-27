import { Auth0Permission } from "../services/auth0.ts";
import { checkJwt, checkPermission } from "./authMiddleware.ts";
import { validateAuctionMiddleware } from "./validateAuction.ts";
import { validateSignup } from "./validationMiddleware.ts";

export const authMiddlewares = [checkJwt];

export const authWithPermission = (permission: Auth0Permission) => [
  ...authMiddlewares,
  checkPermission(permission)
];

export const createAuctionMiddlewares = [
  ...authWithPermission(Auth0Permission.createAuction),
  validateAuctionMiddleware
];

export const signupMiddlewares = [
  validateSignup
];

export const loginMiddlewares = [
  validateSignup
];