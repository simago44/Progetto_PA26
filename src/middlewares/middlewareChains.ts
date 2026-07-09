import { checkJwtAuthorization, checkPermission, checkSelfOrAllPermission, resolveUserIdParam, validateLogin, validateSignup } from "./authMiddleware.ts";
import { validateAuctionMiddleware, validateGetAuctionsMiddleware, validateGetAuctionStatsMiddleware, validateUpdateReservePriceMiddleware } from "./auctionMiddleware.ts";
import { validateBidMiddleware, validateGetAuctionBids } from "./bidMiddleware.ts";
import { Auth0Permission } from "../enums/enums.ts";
import { validateAuctionReportFilters, validateTopUpWallet, validateWalletReportFilters } from "./userMiddlewares.ts";

// Auction
export const createAuctionMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.createAuction),
  validateAuctionMiddleware
];

export const getAuctionsMiddlewares = [
  validateGetAuctionsMiddleware
];

export const getAuctionStatsMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.readAuctionStats),
  validateGetAuctionStatsMiddleware
];

export const updateAuctionReservePriceMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.updateAuction),
  validateUpdateReservePriceMiddleware
];


// Auth
export const signupMiddlewares = [
  validateSignup
];

export const loginMiddlewares = [
  validateLogin
];


// Bid
export const createBidMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.createBid),
  validateBidMiddleware,
];

export const getAuctionBidsMiddlewares = [
  validateGetAuctionBids
];


// User
export const getWalletMiddlewares = [
  checkJwtAuthorization,
  resolveUserIdParam,
  checkSelfOrAllPermission(Auth0Permission.readCurrentUserWallet, Auth0Permission.readWallets),
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
  validateWalletReportFilters,
];

export const topUpWalletMiddlewares = [
  checkJwtAuthorization,
  checkPermission(Auth0Permission.updateWallets),
  validateTopUpWallet
];
