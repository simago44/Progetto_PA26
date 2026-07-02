import { Router } from "express";
import { AuctionController } from "../controllers/auctionController.ts";
import { createAuctionMiddlewares, getAuctionStatsByTypeMiddlewares, getFilteredAuctionMiddlewares, updateAuctionMinimumPriceMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new AuctionController();
const router = Router();

router.post("/", createAuctionMiddlewares, controller.createAuction);
router.get("/", getFilteredAuctionMiddlewares, controller.getAuctions);
router.put("/:id/minimum-price", updateAuctionMinimumPriceMiddlewares, controller.updateAuctionMinimumPrice);
router.get("/:type/stats", getAuctionStatsByTypeMiddlewares, controller.getAuctionStatsByType);

export default router;
