import { Router } from "express";
import { createBidMiddlewares, getAuctionBidsMiddlewares } from "../middlewares/middlewareChains.ts";
import container from "../core/container.ts";
import type BidController from "../controllers/bidController.ts";

const bidController = container.resolve<BidController>("bidController");

const router = Router();

/**
 * @openapi
 * /auctions/{auctionId}/bids:
 *   post:
 *     summary: Create a bid on an auction
 *     description: Places a new bid on the specified auction.
 *     tags:
 *       - Bids
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bidPrice:
 *                 type: number
 *                 description: The bid price. Optional for auctions where the price is automatically calculated.
 *     responses:
 *       201:
 *         description: Bid created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 userId:
 *                   type: string
 *                 auctionId:
 *                   type: integer
 *                 bidPrice:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid bid payload.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not allowed to place this bid.
 *       404:
 *         description: Auction not found.
 *       409:
 *         description: Bid cannot be placed due to auction rules.
 */
router.post("/:auctionId/bids", createBidMiddlewares, bidController.createBid);

/**
 * @openapi
 * /auctions/{auctionId}/bids:
 *   get:
 *     summary: List bids for an auction
 *     description: Returns all bids placed on the specified auction.
 *     tags:
 *       - Bids
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction.
 *     responses:
 *       200:
 *         description: Bids retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: string
 *                   auctionId:
 *                     type: integer
 *                   bidPrice:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not allowed to view bids.
 *       404:
 *         description: Auction not found.
 */
router.get("/:auctionId/bids", getAuctionBidsMiddlewares, bidController.getAuctionBids);

export default router;
