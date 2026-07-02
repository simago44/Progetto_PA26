import { Router } from "express";
import { createBidMiddlewares, getAuctionBidsMiddlewares } from "../middlewares/middlewareChains.ts";
import bidController from "../controllers/bidController.ts";

const router = Router();

router.get("/:auctionId/bids", getAuctionBidsMiddlewares, bidController.getAuctionBids);
router.post("/:auctionId/bids", createBidMiddlewares, bidController.createBid);

export default router;
