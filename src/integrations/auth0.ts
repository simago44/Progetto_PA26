import { AuthenticationClient, ManagementClient } from "auth0";
import env from "../core/config.ts";
import logger from "../core/logger.ts";
import { RoleName, type Role } from "../enums/enums.ts";
import { Errors } from "../factories/errorFactory.ts";

export const managementClient = new ManagementClient({
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
});

export const authenticationClient = new AuthenticationClient({
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
});

async function fetchRoles(): Promise<Record<RoleName, Role>> {
  const { data } = await managementClient.roles.list();
  return Object.fromEntries(
    Object.values(RoleName).map((name) => {
      const found = data.find((r) => r.name === name);
      if (!found?.id) {
        //throw new Error(`Auth0 role not found: ${name}`);
        logger.error(`Auth0 role not found: ${name}`);
        throw new Errors.InternalServer();
      }
      return [name, { name, id: found.id }];
    })
  ) as Record<RoleName, Role>;
}

export const Auth0Roles = await fetchRoles();