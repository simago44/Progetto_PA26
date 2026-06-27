import { Router } from "express";
import { AuctionController } from "../controllers/auctionController.ts";
import { createAuctionMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new AuctionController();
const router = Router();

router.post("/", createAuctionMiddlewares, controller.createAuction);

router.get("/", controller.getAuctions);

export default router;
