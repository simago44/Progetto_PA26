import { Router } from "express";
import auctionController from "../controllers/auctionController.ts";
import { createAuctionMiddlewares, getAuctionStatsMiddlewares, getFilteredAuctionMiddlewares, updateAuctionMinimumPriceMiddlewares } from "../middlewares/middlewareChains.ts";

const router = Router();

router.post("/", createAuctionMiddlewares, auctionController.createAuction);
router.get("/", getFilteredAuctionMiddlewares, auctionController.getAuctions);
router.put("/:id/minimum-price", updateAuctionMinimumPriceMiddlewares, auctionController.updateAuctionMinimumPrice);
router.get("/:type/stats", getAuctionStatsMiddlewares, auctionController.getAuctionStats);

export default router;
