import { Router } from 'express';
import { loginMiddlewares, signupMiddlewares } from "../middlewares/middlewareChains.ts";
import container from '../core/container.ts';
import type AuthController from '../controllers/authController.ts';

const authController = container.resolve<AuthController>("authController");

const router = Router();

/**
 * @openapi
 * /signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and assigns the default bid participant role.
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
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the new user.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password.
 *               role:
 *                 type: string
 *                 enum:
 *                   - auction-participant
 *                   - auction-creator
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created user.
 *       400:
 *         description: Invalid signup payload.
 *       409:
 *         description: Username already exists.
 */
router.post('/signup', signupMiddlewares, authController.signup);

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user and returns an access token.
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
 *                 description: The username of the user.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: Authentication succeeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the authenticated user.
 *                 accessToken:
 *                   type: string
 *                   description: The JWT access token.
 *       400:
 *         description: Invalid login payload.
 *       401:
 *         description: Invalid credentials.
 */router.post('/login', loginMiddlewares, authController.login);

export default router;