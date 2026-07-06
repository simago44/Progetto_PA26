import { Router } from "express";
import auctionController from "../controllers/auctionController.ts";
import { createAuctionMiddlewares, getAuctionStatsMiddlewares, getAuctionsMiddlewares, updateAuctionReservePriceMiddlewares } from "../middlewares/middlewareChains.ts";

const router = Router();

/**
 * @openapi
 * /auctions:
 *   post:
 *     summary: Create an auction
 *     description: Creates a new auction from the validated request payload.
 *     tags:
 *       - Auctions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startsAt
 *               - reservePrice
 *               - type
 *               - description
 *             properties:
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               endsAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               reservePrice:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [english, dutch, first-price, second-price]
 *               description:
 *                 type: string
 *               minimumIncrement:
 *                 type: number
 *                 nullable: true
 *               decrementPrice:
 *                 type: number
 *                 nullable: true
 *               decrementInterval:
 *                 type: number
 *                 nullable: true
 *               startPrice:
 *                 type: number
 *                 nullable: true
 *               delayBeforeEnding:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Auction created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *       400:
 *         description: Invalid auction payload.
 *       403:
 *         description: Not authorized to create auctions.
 */
router.post("/", createAuctionMiddlewares, auctionController.createAuction);

/**
 * @openapi
 * /auctions:
 *   get:
 *     summary: List auctions
 *     description: Returns auctions, optionally filtered by creator, status, and type.
 *     tags:
 *       - Auctions
 *     parameters:
 *       - in: query
 *         name: creatorIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by one or more creator IDs.
 *       - in: query
 *         name: statuses
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [not-started, in-progress, ended]
 *         description: Filter by one or more auction statuses.
 *       - in: query
 *         name: types
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [english, dutch, first-price, second-price]
 *         description: Filter by one or more auction types.
 *     responses:
 *       200:
 *         description: Auctions retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 auctions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", getAuctionsMiddlewares, auctionController.getAuctions);

/**
 * @openapi
 * /auctions/stats:
 *   get:
 *     summary: Get auction statistics
 *     description: Returns aggregate statistics about auctions, optionally filtered.
 *     tags:
 *       - Auctions
 *     responses:
 *       200:
 *         description: Auction statistics retrieved successfully.
 *       403:
 *         description: Not authorized to view auction statistics.
 */
router.get("/stats", getAuctionStatsMiddlewares, auctionController.getAuctionStats);

/**
 * @openapi
 * /auctions/{auctionId}/reserve-price:
 *   put:
 *     summary: Update an auction's reserve price
 *     description: Updates the reserve price of the given auction.
 *     tags:
 *       - Auctions
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
 *               - reservePrice
 *             properties:
 *               reservePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reserve price updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Not authorized to update this auction.
 *       404:
 *         description: Auction not found.
 */
router.put("/:auctionId/reserve-price", updateAuctionReservePriceMiddlewares, auctionController.updateAuctionReservePrice);

export default router;
