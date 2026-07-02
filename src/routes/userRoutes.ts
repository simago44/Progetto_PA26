import { Router } from "express";
import { UserController } from "../controllers/userController.ts";
import { getAuctionsReportMiddlewares, getWalletMiddlewares, getWalletReportMiddlewares, topUpWalletMiddlewares } from "../middlewares/middlewareChains.ts";

const controller = new UserController();
const router = Router();

router.get("/:userId/wallet", getWalletMiddlewares, controller.getWallet);
router.put("/:userId/wallet", topUpWalletMiddlewares, controller.topUpWallet);
router.get("/:userId/auctions-report", getAuctionsReportMiddlewares, controller.getAuctionsReport);
router.get("/:userId/wallet-report", getWalletReportMiddlewares, controller.getWalletReport);

export default router;
