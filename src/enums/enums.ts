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
  AuctionCreator: "auction-creator",
  AuctionParticipant: "auction-participant",
} as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export type Role = {
  name: RoleName;
  id: string;
};

export const NewUserTokens: Record<typeof RoleName[keyof typeof RoleName], number | null> = {
  [RoleName.Admin]: null,
  [RoleName.AuctionCreator]: 0,
  [RoleName.AuctionParticipant]: 2000,
} as const;

export const AuctionType = {
  English: "english",
  Dutch: "dutch",
  FirstPrice: "first-price",
  SecondPrice: "second-price",
} as const;
export type AuctionType = (typeof AuctionType)[keyof typeof AuctionType];

export const AuctionStatus = {
  NotStarted: "not-started",
  InProgress: "in-progress",
  Ended: "ended",
} as const;
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];