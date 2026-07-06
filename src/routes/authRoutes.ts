import { Router } from 'express';
import { loginMiddlewares, signupMiddlewares } from "../middlewares/middlewareChains.ts";
import authController from "../controllers/authController.ts";

const router = Router();

/**
 * @openapi
 * /signup:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user on Auth0 and assigns the default user role.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid signup payload.
 */
router.post('/signup', signupMiddlewares, authController.signup);

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user via Auth0 Resource Owner Password Grant and returns an access token on success.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Authentication succeeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials.
 */
router.post('/login', loginMiddlewares, authController.login);

export default router;