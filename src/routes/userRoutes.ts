import { Router } from "express";
import { UserController } from "../controllers/userController.ts";
import { getWalletMiddlewares, topUpWalletMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new UserController();
const router = Router();

router.get("/:userId/wallet", getWalletMiddlewares, controller.getWallet);
router.put("/:userId/wallet", topUpWalletMiddlewares, controller.topUpWallet);
//router.get("/:userId/auctions-report", controller.getAuctions);
//router.get("/:userId/wallet-report", controller.getAuctions);

export default router;
