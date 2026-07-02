import { Router } from "express";
import { getAuctionsReportMiddlewares, getWalletMiddlewares, getWalletReportMiddlewares, topUpWalletMiddlewares } from "../middlewares/middlewareChains.ts";
import userController from "../controllers/userController.ts";

const router = Router();

router.get("/:userId/wallet", getWalletMiddlewares, userController.getWallet);
router.put("/:userId/wallet", topUpWalletMiddlewares, userController.topUpWallet);
router.get("/:userId/auctions-report", getAuctionsReportMiddlewares, userController.getAuctionsReport);
router.get("/:userId/wallet-report", getWalletReportMiddlewares, userController.getWalletReport);

export default router;
