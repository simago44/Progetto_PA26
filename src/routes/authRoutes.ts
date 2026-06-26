import { Router } from 'express';
import { loginMiddlewares, signupMiddlewares } from "../middlewares/middlewareChains.ts";
import { AuthController } from "../controllers/authController.ts";

const router = Router();

const controller = new AuthController();

/**
 * Registers a new user on Auth0 and assigns the default user role.
 * 
 * @route POST /signup
 * @middleware validateSignup - Validates and sanitizes the request body
 */
router.post('/signup', signupMiddlewares, controller.signup);

/**
 * Authenticates a user via Auth0 Resource Owner Password Grant.
 * Returns an access token on success.
 * 
 * @route POST /login
 * @middleware validateLogin - Validates and sanitizes the request body
 */
router.post('/login', loginMiddlewares, controller.login);

export default router;