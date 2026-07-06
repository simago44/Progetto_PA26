import { Router } from "express";
import { createBidMiddlewares, getAuctionBidsMiddlewares } from "../middlewares/middlewareChains.ts";
import bidController from "../controllers/bidController.ts";

const router = Router();

/**
 * @openapi
 * /auctions/{auctionId}/bids:
 *   get:
 *     summary: List bids for an auction
 *     description: Returns all bids placed on the given auction.
 *     tags:
 *       - Bids
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the auction.
 *     responses:
 *       200:
 *         description: Bids retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bids:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       userId:
 *                         type: string
 *                       auctionId:
 *                         type: number
 *                       bidPrice:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Auction not found.
 */
router.get("/:auctionId/bids", getAuctionBidsMiddlewares, bidController.getAuctionBids);

/**
 * @openapi
 * /auctions/{auctionId}/bids:
 *   post:
 *     summary: Create a bid on an auction
 *     description: Places a new bid on the given auction from the validated request payload.
 *     tags:
 *       - Bids
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the auction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bidPrice
 *             properties:
 *               bidPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bid created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *       400:
 *         description: Invalid bid payload.
 *       403:
 *         description: Not authorized to bid on this auction.
 *       404:
 *         description: Auction not found.
 */
router.post("/:auctionId/bids", createBidMiddlewares, bidController.createBid);

export default router;
