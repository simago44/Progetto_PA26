import { AuthenticationClient, ManagementClient } from "auth0";
import env from "../config.ts";
import userRepository from "../repositories/userRepository.ts";
import logger from "../middlewares/logger.ts";

export const Auth0Permission = {
  createAuction: "create:auction",
  updateAuction: "update:auction",
  createBid: "create:bid",
  readCurrentUserWallet: "read:current_user_wallet",
  readWallets: "read:wallets",
  updateWallets: "update:wallets",
  readAuctionReports: "read:auction_reports",
  readCurrentUserAuctionReport: "read:current_user_auction_report",
  readWalletReports: "read:wallet_reports",
  readCurrentUserWalletReport: "read:current_user_wallet_report",
  readAuctionStats: "read:auction_stats"
} as const;
export type Auth0Permission = (typeof Auth0Permission)[keyof typeof Auth0Permission];

export const RoleName = {
  Admin: "admin",
  BidCreator: "bid-creator",
  BidParticipant: "bid-participant",
} as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

type Role = {
  name: RoleName;
  id: string;
};

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
      if (!found?.id) throw new Error(`Auth0 role not found: ${name}`);
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

export async function deleteStaleUsers() {
  const auth0Users = (await managementClient.users.list()).data;
  const dbUsers = await userRepository.loadAllIds();

  const dbUserIds = new Set(dbUsers.map(user => user.id));

  for (const user of auth0Users) {
    if (!user.user_id) continue;

    // If the user doesn't belong to the app auth0 db connection
    if (!user.identities?.some(i => i.connection === env.AUTH0_CONNECTION)) continue;
    // If the user is actually present in the db
    if (dbUserIds.has(user.user_id)) continue;

    logger.info(`Deleting: ${user.user_id}`);
    managementClient.users.delete(user.user_id);
  }
}