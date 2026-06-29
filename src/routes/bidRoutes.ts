import { Router } from "express";
import { BidController } from "../controllers/bidController.ts";
import { createBidMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new BidController();
const router = Router();

router.post("/", createBidMiddlewares, controller.createBid);

router.get("/", controller.getAuctionBids);

export default router;
