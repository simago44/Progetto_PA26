import { Auth0Permission } from "../integrations/auth0.ts";
import { checkJwtAuthorization, checkPermission, checkSelfOrAllPermission } from "./authMiddleware.ts";
import { resolveUserIdParam, validateTopUpWallet } from "./walletValidationMiddleware.ts";
import { validateAuctionMiddleware, validateAuctionStatusMiddleware } from "./auctionValidationMiddleware.ts";
import { validateBidMiddleware } from "./bidValidationMiddleware.ts";
import { validateSignup } from "./authValidationMiddleware.ts";

export const createAuctionMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.createAuction),
  validateAuctionMiddleware
];

export const getFilteredAuctionMiddlewares = [validateAuctionStatusMiddleware];

export const signupMiddlewares = [validateSignup];

export const loginMiddlewares = [validateSignup];

export const getWalletMiddlewares = [
  checkJwtAuthorization,
  resolveUserIdParam,
  checkSelfOrAllPermission(Auth0Permission.readCurrentUserWallet, Auth0Permission.readWallets),
];

export const topUpWalletMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.updateWallets),
  validateTopUpWallet
];

export const createBidMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.createBid),
  validateBidMiddleware,
];
