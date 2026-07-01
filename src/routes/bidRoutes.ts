import { Router } from "express";
import { BidController } from "../controllers/bidController.ts";
import { createBidMiddlewares, getAuctionBidsMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new BidController();
const router = Router();

router.get("/:auctionId/bids", getAuctionBidsMiddlewares, controller.getAuctionBids);
router.post("/:auctionId/bids", createBidMiddlewares, controller.createBid);

export default router;
