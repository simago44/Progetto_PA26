import { AuthenticationClient, ManagementClient, Management } from "auth0";
import { Router, type Request, type Response, type NextFunction, type ErrorRequestHandler } from 'express';
import { checkJwt } from '../middlewares/authMiddleware.ts';

const router = Router();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN as string;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE as string;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID as string;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET as string;
const AUTH0_REALM = process.env.AUTH0_REALM as string;

const Auth0_Roles = {
  admin: "admin",
  user: "user"
} as const;

router.post('/signup', async (req: Request, res: Response) => {
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

    res.json({msg: "User created successfully"});
  } catch (err) {
    if (err instanceof Management.BadRequestError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.UnauthorizedError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.ForbiddenError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.ConflictError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.TooManyRequestsError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else {
      res.json({err: err});
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
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
    if (err instanceof Management.BadRequestError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.UnauthorizedError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.ForbiddenError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.ConflictError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else if (err instanceof Management.TooManyRequestsError) {
      const message = (err?.body as any)?.message;
      res.json({err: message});
    } else {
      res.json({err: err});
    }
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

const requiredPermissions = (permission: string) => {
  return (req: Request, res: Response, next: Function) => {
    const permissions = (req.auth?.payload.permissions as string[]) || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};

// Protected route with scope - requires 'read:messages' scope
router.get(
'/api/private-permissions',
checkJwt,
requiredPermissions('read:messages'),
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

// Error handling middleware
const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
  ) => {
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';

  res.status(status).json({
    error: err.code ?? 'server_error',
    message: status === 401 ? 'Authentication required' : message,
  });
};

router.use(errorHandler);

export default router;