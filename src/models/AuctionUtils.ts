import type { Auction } from "./Auction.ts";

export const AuctionType = {
  English: 'english',
  Dutch: 'dutch',
  FirstPrice: 'first-price',
  SecondPrice: 'second-price'
}
export type AuctionType = typeof AuctionType[keyof typeof AuctionType];

export const AuctionStatus = {
  NotStarted: 0,
  InProgress: 1,
  Finished: 2
}
export type AuctionStatus = typeof AuctionStatus[keyof typeof AuctionStatus];

export function getAuctionStatus(auction: Auction): AuctionStatus {
  const now = new Date();
  const bids = auction.bids ?? [];
  if (now < auction.startAt) return AuctionStatus.NotStarted;

  switch (auction.type) {
    case AuctionType.FirstPrice:
    case AuctionType.SecondPrice:
      if (now < auction.endAt) return AuctionStatus.InProgress;
      return AuctionStatus.Finished;
    case AuctionType.English:
      if (now < auction.endAt) return AuctionStatus.InProgress;
      if (bids.length === 0) return AuctionStatus.Finished;

      const lastBid = bids.reduce((latest, bid) =>
        bid.createdAt > latest.createdAt ? bid : latest
      );
      const fiveMinutes = 5 * 60 * 1000;
      const timeSinceLastBid = now.getTime() - lastBid.createdAt.getTime();

      if (timeSinceLastBid < fiveMinutes) return AuctionStatus.InProgress;
      return AuctionStatus.Finished;
    case AuctionType.Dutch:
      if (now < auction.startAt) return AuctionStatus.NotStarted;

      //se c'è un'offerta, qualcuno ha accettato il prezzo
      if (bids.length > 0) return AuctionStatus.Finished;

      // Prezzo corrente
      const elapsed = now.getTime() - auction.startAt.getTime();
      const decrements = Math.floor(elapsed / (auction.decrementTime! * 60 * 1000));
      const currentPrice = auction.startPrice - (decrements * auction.decrementPrice!);

      // Se il prezzo ha raggiunto o superato il minimo, invenduto
      if (currentPrice <= auction.minimumPrice!) return AuctionStatus.Finished;

      return AuctionStatus.InProgress;

  }
  return AuctionStatus.Finished
} 