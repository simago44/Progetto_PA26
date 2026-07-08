import { Router } from "express";
import { getAuctionsReportMiddlewares, getWalletMiddlewares, getWalletReportMiddlewares, topUpWalletMiddlewares } from "../middlewares/middlewareChains.ts";
import userController from "../controllers/userController.ts";

const router = Router();

/**
 * @openapi
 * /users/{userId}/wallet:
 *   get:
 *     summary: Get a user's wallet balance
 *     description: Returns the available token balance for the specified user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
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
 *                   description: The user's available tokens.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not authorized to view this wallet.
 *       404:
 *         description: User not found.
 */
router.get("/:userId/wallet", getWalletMiddlewares, userController.getWallet);

/**
 * @openapi
 * /users/{userId}/auctions-report:
 *   get:
 *     summary: Get a user's auctions report
 *     description: Returns a report of auctions in which the user participated.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter auctions starting from this date.
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter auctions ending before this date.
 *       - in: query
 *         name: won
 *         schema:
 *           type: boolean
 *         description: Filter only won or lost auctions.
 *     responses:
 *       200:
 *         description: Auctions report retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not authorized to view this report.
 *       404:
 *         description: User not found.
 */
router.get("/:userId/auctions-report", getAuctionsReportMiddlewares, userController.getAuctionsReport);

/**
 * @openapi
 * /users/{userId}/wallet-report:
 *   get:
 *     summary: Get a user's wallet spending report
 *     description: Returns the total amount spent by the user on won auctions within the selected period.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *       - in: query
 *         name: fromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of the report period.
 *       - in: query
 *         name: toDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date of the report period.
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
 *                   description: Total amount spent.
 *       400:
 *         description: Invalid report filters.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not authorized to view this report.
 *       404:
 *         description: User not found.
 */
router.get("/:userId/wallet-report", getWalletReportMiddlewares, userController.getWalletReport);

/**
 * @openapi
 * /users/{userId}/wallet:
 *   put:
 *     summary: Top up a user's wallet
 *     description: Adds tokens to the specified user's wallet.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
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
 *                 description: Number of tokens to add.
 *     responses:
 *       200:
 *         description: Wallet updated successfully.
 *       400:
 *         description: Invalid top-up amount.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not authorized to top up this wallet.
 *       404:
 *         description: User not found.
 */
router.put("/:userId/wallet", topUpWalletMiddlewares, userController.topUpWallet);

export default router;
