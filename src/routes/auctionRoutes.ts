import { Router } from "express";
import auctionController from "../controllers/auctionController.ts";
import { createAuctionMiddlewares, getAuctionStatsMiddlewares, getFilteredAuctionMiddlewares, updateAuctionReservePriceMiddlewares } from "../middlewares/middlewareChains.ts";

const router = Router();

router.post("/", createAuctionMiddlewares, auctionController.createAuction);
router.get("/", getFilteredAuctionMiddlewares, auctionController.getAuctions);
router.put("/:auctionId/reserve-price", updateAuctionReservePriceMiddlewares, auctionController.updateAuctionReservePrice);
router.get("/:type/stats", getAuctionStatsMiddlewares, auctionController.getAuctionStats);

export default router;
