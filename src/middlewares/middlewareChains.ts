import { Auth0Permission } from "../services/auth0.ts";
import { checkJwt, checkPermission, checkPermissionForSelf } from "./authMiddleware.ts";
import { resolveUserIdParam, validateTopUpWallet } from "./userMiddleware.ts";
import { validateAuctionMiddleware } from "./validateAuction.ts";
import { validateBidMiddleware } from "./validateBid.ts";
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

export const getWalletMiddlewares = [
  checkJwt,
  resolveUserIdParam,
  checkPermissionForSelf(
    Auth0Permission.readCurrentUserWallet,
    Auth0Permission.readWallets,
  ),
];

export const topUpWalletMiddlewares = [
  checkJwt,
  checkPermission(Auth0Permission.updateWallets),
  validateTopUpWallet
]

export const createBidMiddlewares = [
  ...authWithPermission(Auth0Permission.createBid),
  validateBidMiddleware,
];
