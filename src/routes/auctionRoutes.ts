import { Router } from "express";
import { AuctionController } from "../controllers/AuctionController.ts";
import { createAuctionMiddlewares } from "../middlewares/middlewareChains.ts";


const controller = new AuctionController()
const router = Router()

router.post("/", createAuctionMiddlewares, controller.createAuction)

export default router