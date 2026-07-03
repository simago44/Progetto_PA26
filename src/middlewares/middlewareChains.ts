import { checkJwtAuthorization, checkPermission, checkSelfOrAllPermission } from "./authMiddleware.ts";
import { resolveUserIdParam, validateTopUpWallet } from "./walletValidationMiddleware.ts";
import { validateAuctionMiddleware, validateGetAuctionsMiddleware, validateGetAuctionStatsMiddleware, validateUpdateReservePriceMiddleware } from "./auctionValidationMiddleware.ts";
import { validateBidMiddleware, validateGetAuctionBids } from "./bidValidationMiddleware.ts";
import { validateSignup } from "./authValidationMiddleware.ts";
import { Auth0Permission } from "../enums/enums.ts";
import { validateAuctionReportFilters } from "./userValidationMiddlewares.ts";

export const createAuctionMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.createAuction),
  validateAuctionMiddleware
];

export const getAuctionsMiddlewares = [validateGetAuctionsMiddleware];

export const updateAuctionReservePriceMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.updateAuction),
  validateUpdateReservePriceMiddleware
];

export const getAuctionStatsMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.readAuctionStats),
  validateGetAuctionStatsMiddleware
];

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

export const getAuctionsReportMiddlewares = [
  checkJwtAuthorization,
  resolveUserIdParam,
  checkSelfOrAllPermission(Auth0Permission.readCurrentUserAuctionReport, Auth0Permission.readAuctionReports),
  validateAuctionReportFilters,
];

export const getWalletReportMiddlewares = [
  checkJwtAuthorization,
  resolveUserIdParam,
  checkSelfOrAllPermission(Auth0Permission.readCurrentUserWallet, Auth0Permission.readWallets),
  // validation
];

export const createBidMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.createBid),
  validateBidMiddleware,
];

export const getAuctionBidsMiddlewares = [
  validateGetAuctionBids
];
