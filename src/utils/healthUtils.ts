import type { Request, Response, NextFunction } from "express";
import sequelize from '../integrations/sequelize.ts';
import env from "../config.ts";
import { AuthenticationClient } from "auth0";

const authClient = new AuthenticationClient({
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
});

/**
 * Verifies Auth0 connectivity and credential validity
 * by performing a client credentials grant.
 * 
 * @throws {Error} If Auth0 is unreachable or credentials are invalid
 */
const checkAuth0 = async () => {
  await authClient.oauth.clientCredentialsGrant({
    audience: env.AUTH0_AUDIENCE,
  });
  return 'ok';
};

/**
 * Verifies the database connectivity by running a test query.
 * 
 * @throws {Error} If the database is unreachable or misconfigured
 */
const checkDB = async () => {
  await sequelize.authenticate();
  return 'ok';
};

/**
 * Health check endpoint that verifies the status of all critical services.
 * 
 * @route GET /health
 * @returns 200 if all services are operational
 * @returns 503 if one or more services are degraded
 */
export async function healthCheck(_: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [auth0, db] = await Promise.allSettled([
      checkAuth0(),
      checkDB(),
    ]);

    const result = {
      node: 'ok',
      auth0: auth0.status === 'fulfilled' ? 'ok' : auth0.reason.message,
      db: db.status === 'fulfilled' ? 'ok' : db.reason.message
    };

    const allOk = Object.values(result).every(v => v === 'ok');
    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      services: result,
    });
  } catch (err) {
    next(err);
  }
}