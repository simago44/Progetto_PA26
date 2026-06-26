import { checkJwt, checkPermission } from "./authMiddleware.ts";
import { validateAuctionMiddleware } from "./validateAuction.ts";

export const authMiddlewares = [checkJwt];

export const authWithPermission = (permission: string) => [
  ...authMiddlewares,
  //checkPermission(permission)
];

export const createAuctionMiddlewares = [
  ...authWithPermission('create:auction'),
  validateAuctionMiddleware
];