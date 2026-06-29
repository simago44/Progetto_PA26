import { Router } from "express";
import { UserController } from "../controllers/userController.ts";
import { getWalletMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new UserController();
const router = Router();

router.get("/:id/wallet", getWalletMiddlewares, controller.getWallet);
//router.put("/:id/wallet", controller.getAuctions);
//router.get("/:id/auctions-report", controller.getAuctions);
//router.get("/:id/wallet-report", controller.getAuctions);

export default router;
