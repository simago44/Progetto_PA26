import type { Request, Response, NextFunction } from "express";
import { SequelizeConnection } from "../services/sequelize.ts";
import { env } from "../config.ts";
import { AuthenticationClient } from "auth0";

const authClient = new AuthenticationClient({
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
});

const checkAuth0 = async () => {
  await authClient.oauth.clientCredentialsGrant({
    audience: env.AUTH0_AUDIENCE,
  });
  return 'ok';
};

const checkDB = async () => {
  const sequelize = SequelizeConnection.getInstance();
  await sequelize.authenticate();
  return 'ok';
};

export async function healthCheck (_: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    const [auth0, db] = await Promise.allSettled([
      checkAuth0(),
      checkDB(),
    ]);

    const result = {
      node: 'ok',
      auth0: auth0.status === 'fulfilled' ? 'ok' : auth0.reason.message,
      db: db.status === 'fulfilled' ? 'ok' : db.reason.message
    }

    const allOk = Object.values(result).every(v => v === 'ok');
    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      services: result,
    });
  } catch (err) {
    next(err);
  }
}