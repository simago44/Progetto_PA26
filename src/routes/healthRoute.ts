import { Router } from "express";
import { healthCheck } from "../utils/healthUtils.ts";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: >
 *       Verifies the status of all critical services (Auth0 and database)
 *       and reports the overall system health.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: All services are operational.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok]
 *                 services:
 *                   type: object
 *                   properties:
 *                     node:
 *                       type: string
 *                       example: ok
 *                     auth0:
 *                       type: string
 *                       example: ok
 *                     db:
 *                       type: string
 *                       example: ok
 *       503:
 *         description: One or more services are degraded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [degraded]
 *                 services:
 *                   type: object
 *                   properties:
 *                     node:
 *                       type: string
 *                       example: ok
 *                     auth0:
 *                       type: string
 *                       example: Auth0 connection timeout
 *                     db:
 *                       type: string
 *                       example: Database connection refused
 */
router.get("/health", healthCheck);

export default router;
