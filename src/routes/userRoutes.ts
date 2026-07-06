import { Router } from "express";
import { getAuctionsReportMiddlewares, getWalletMiddlewares, getWalletReportMiddlewares, topUpWalletMiddlewares } from "../middlewares/middlewareChains.ts";
import userController from "../controllers/userController.ts";

const router = Router();

/**
 * @openapi
 * /users/{userId}/wallet:
 *   get:
 *     summary: Get a user's wallet balance
 *     description: Returns the current token balance for the given user's wallet.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: number
 *       403:
 *         description: Not authorized to view this wallet.
 *       404:
 *         description: User not found.
 */
router.get("/:userId/wallet", getWalletMiddlewares, userController.getWallet);

/**
 * @openapi
 * /users/{userId}/wallet:
 *   put:
 *     summary: Top up a user's wallet
 *     description: Adds tokens to the given user's wallet.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokens
 *             properties:
 *               tokens:
 *                 type: number
 *                 description: Number of tokens to add to the wallet.
 *     responses:
 *       200:
 *         description: Wallet updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Not authorized to top up this wallet.
 *       404:
 *         description: User not found.
 */
router.put("/:userId/wallet", topUpWalletMiddlewares, userController.topUpWallet);

/**
 * @openapi
 * /users/{userId}/auctions-report:
 *   get:
 *     summary: Get a user's auctions report
 *     description: Returns a report of auctions the given user participated in, optionally filtered.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: Auctions report retrieved successfully.
 *       403:
 *         description: Not authorized to view this report.
 *       404:
 *         description: User not found.
 */
router.get("/:userId/auctions-report", getAuctionsReportMiddlewares, userController.getAuctionsReport);

/**
 * @openapi
 * /users/{userId}/wallet-report:
 *   get:
 *     summary: Get a user's wallet spending report
 *     description: Returns the total spending for the given user's wallet, optionally filtered.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: Wallet report retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *       403:
 *         description: Not authorized to view this report.
 *       404:
 *         description: User not found.
 */
router.get("/:userId/wallet-report", getWalletReportMiddlewares, userController.getWalletReport);

export default router;
