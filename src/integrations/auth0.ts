import { AuthenticationClient, ManagementClient } from "auth0";
import env from "../core/config.ts";
import userRepository from "../repositories/userRepository.ts";
import logger from "../core/logger.ts";
import { RoleName, type Role } from "../enums/enums.ts";
import { Errors } from "../factory/errorFactory.ts";

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
        throw new Errors.InternalServerError();
      }
      return [name, { name, id: found.id }];
    })
  ) as Record<RoleName, Role>;
}

export const Auth0Roles = await fetchRoles();

export async function getAuthenticationToken(username: string, password: string): Promise<string> {
  const user = await authenticationClient.oauth.passwordGrant({
    realm: env.AUTH0_CONNECTION,
    audience: env.AUTH0_AUDIENCE,
    username,
    password
  });

  return user.data.access_token;
}

export async function deleteStaleUsers(): Promise<void> {
  let users = (await managementClient.users.list());

  const auth0Users = users.data;
  while (users.hasNextPage()) {
    users = await users.getNextPage();
    auth0Users.push(...users.data);
  }
  const dbUsers = await userRepository.findAllIds();

  const dbUserIds = new Set(dbUsers.map(user => user.id));

  for (const user of auth0Users) {
    if (!user.user_id) continue;

    // If the user doesn't belong to the app auth0 db connection
    if (!user.identities?.some(i => i.connection === env.AUTH0_CONNECTION)) continue;
    // If the user is actually present in the db
    if (dbUserIds.has(user.user_id)) continue;

    logger.info(`Deleting: ${user.user_id}`);
    await managementClient.users.delete(user.user_id);
  }
}