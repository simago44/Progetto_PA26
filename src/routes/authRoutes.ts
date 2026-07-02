import { Router } from 'express';
import { loginMiddlewares, signupMiddlewares } from "../middlewares/middlewareChains.ts";
import authController from "../controllers/authController.ts";

const router = Router();

/**
 * Registers a new user on Auth0 and assigns the default user role.
 * 
 * @route POST /signup
 * @middleware validateSignup - Validates and sanitizes the request body
 */
router.post('/signup', signupMiddlewares, authController.signup);

/**
 * Authenticates a user via Auth0 Resource Owner Password Grant.
 * Returns an access token on success.
 * 
 * @route POST /login
 * @middleware validateLogin - Validates and sanitizes the request body
 */
router.post('/login', loginMiddlewares, authController.login);

export default router;