import { AuthenticationClient, ManagementClient } from "auth0";
import { Router, type Request, type Response, type NextFunction } from 'express';
import { checkJwt, checkPermission } from '../middlewares/authMiddleware.ts';
import { createError, ErrorEnum, AppError, getErrorHTTPStatus } from "../factory/errorFactory.ts";
import { userCreatedSuccessfully_message } from "../factory/messageStrings.ts";
import { validateLogin, validateSignup } from "../middlewares/validationMiddleware.ts";
import { env } from '../config.ts';

const router = Router();

const AUTH0_DOMAIN = env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = env.AUTH0_AUDIENCE;
const AUTH0_CLIENT_ID = env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = env.AUTH0_CLIENT_SECRET;
const AUTH0_REALM = env.AUTH0_REALM;

const Auth0_Roles = {
  admin: "admin",
  user: "user"
} as const;

function parseAuth0Error(err: any): AppError {
  if (err?.statusCode && err?.body?.message) {
    return new AppError(err.statusCode, err.body.message, err.constructor?.name);
  }

  if (err instanceof Error) {
    const statusCode = (err as any)?.statusCode || getErrorHTTPStatus(ErrorEnum.InternalServer);
    return new AppError(statusCode, err.message, err.name);
  }

  return createError(ErrorEnum.InternalServer);
}

router.post('/signup', 
  validateSignup,
  async (req: Request, res: Response, next: NextFunction) => {
  const client = new ManagementClient({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET
  });

  const username = req.body.username as string;
  const password = req.body.password as string;

  try {
    // TODO: fetch roles id and assign it to Auth0_Roles
    const roles = await client.roles.list({
      name_filter: Auth0_Roles.user
    });
    const user_role = roles.data.find(r => r.name === Auth0_Roles.user);
    const user_role_id = user_role?.id as string;

    const user = await client.users.create({
      connection: AUTH0_REALM,
      username: username,
      password: password
    })

    const user_id = user.user_id as string;

    await client.users.roles.assign(user_id, {
      roles: [user_role_id]
    });

    res.json({message: userCreatedSuccessfully_message});
  } catch (err) {
    next(parseAuth0Error(err))
  }
});

router.post('/login',
  validateLogin,
  async (req: Request, res: Response, next: NextFunction) => {
  const auth0 = new AuthenticationClient({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET
  });

  const username = req.body.username as string;
  const password = req.body.password as string;

  try {
    const user = await auth0.oauth.passwordGrant({
      realm: AUTH0_REALM,
      audience: AUTH0_AUDIENCE,
      username: username,
      password: password
    });

    res.json({access_token: user.data.access_token});
  } catch (err) {
    next(parseAuth0Error(err))
  }
});

// Public route - no authentication required
router.get('/api/public', (_req: Request, res: Response) => {
  res.json({
    message:
      "Hello from a public endpoint! You don't need to be authenticated to see this.",
    timestamp: new Date().toISOString(),
  });
});

// Protected route - requires valid access token
router.get('/api/private', checkJwt, (req: Request, res: Response) => {
  res.json({
    message:
      'Hello from a protected endpoint! You successfully authenticated.',
    user: req.auth?.payload.sub,
    timestamp: new Date().toISOString(),
  });
});

// Protected route with scope - requires 'read:messages' scope
router.get(
  '/api/private-permissions',
  checkJwt,
  checkPermission('read:messages'),
  (req: Request, res: Response) => {
    res.json({
      message:
        'Hello from a scoped endpoint! You have the required permission.',
      user: req.auth?.payload.sub,
      scope: req.auth?.payload.scope,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;