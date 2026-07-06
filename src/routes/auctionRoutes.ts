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
 *                 enum:
 *                   - english
 *                   - dutch
 *                   - first-price
 *                   - second-price
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
 *                   type: integer
 *       400:
 *         description: Invalid auction payload.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not allowed to create auctions.
 */
router.post("/", createAuctionMiddlewares, auctionController.createAuction);

/**
 * @openapi
 * /auctions:
 *   get:
 *     summary: List auctions
 *     description: Returns auctions filtered by the provided criteria.
 *     tags:
 *       - Auctions
 *     parameters:
 *       - in: query
 *         name: creatorIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter auctions by creator IDs.
 *       - in: query
 *         name: statuses
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum:
 *               - not-started
 *               - in-progress
 *               - ended
 *         style: form
 *         explode: true
 *         description: Filter auctions by status.
 *       - in: query
 *         name: types
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum:
 *               - english
 *               - dutch
 *               - first-price
 *               - second-price
 *         style: form
 *         explode: true
 *         description: Filter auctions by type.
 *     responses:
 *       200:
 *         description: Auctions retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid filter parameters.
 */
router.get("/", getAuctionsMiddlewares, auctionController.getAuctions);

/**
 * @openapi
 * /auctions/stats:
 *   get:
 *     summary: Get auction statistics
 *     description: Returns aggregate statistics grouped by auction type.
 *     tags:
 *       - Auctions
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of the statistics period.
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date of the statistics period.
 *       - in: query
 *         name: types
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum:
 *               - english
 *               - dutch
 *               - first-price
 *               - second-price
 *         style: form
 *         explode: true
 *     responses:
 *       200:
 *         description: Auction statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid statistics filters.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not authorized to view statistics.
 */
router.get("/stats", getAuctionStatsMiddlewares, auctionController.getAuctionStats);

/**
 * @openapi
 * /auctions/{auctionId}/reserve-price:
 *   put:
 *     summary: Update an auction's reserve price
 *     description: Updates the reserve price of an existing auction.
 *     tags:
 *       - Auctions
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: integer
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
 *       400:
 *         description: Invalid reserve price.
 *       401:
 *         description: User authentication required.
 *       403:
 *         description: User is not authorized to update this auction.
 *       404:
 *         description: Auction not found.
 */router.put("/:auctionId/reserve-price", updateAuctionReservePriceMiddlewares, auctionController.updateAuctionReservePrice);

export default router;
