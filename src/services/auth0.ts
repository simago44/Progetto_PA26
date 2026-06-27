import { AuthenticationClient, ManagementClient } from "auth0";
import env from "../config.ts";

const AUTH0_DOMAIN = env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = env.AUTH0_CLIENT_SECRET;
const AUTH0_AUDIENCE = env.AUTH0_AUDIENCE;
const AUTH0_REALM = env.AUTH0_REALM;

export const Auth0Permission = {
  createAuction: "create:auction",
  updateAuction: "update:auction",
  createBid: "create:bid",
  readWallet: "read:wallet",
  updateWallet: "update:wallet",
  readAuctionReport: "read:auction-report",
  readWalletReport: "read:wallet-report",
  readAuctionStats: "read:auction-stats"
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
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
});

export const authenticationClient = new AuthenticationClient({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
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
    realm: AUTH0_REALM,
    audience: AUTH0_AUDIENCE,
    username,
    password
  });

  return user.data.access_token;
}