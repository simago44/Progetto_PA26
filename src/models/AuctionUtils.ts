import { Auction } from "./Auction.ts";

export const AuctionType = {
  English: 'english',
  Dutch: 'dutch',
  FirstPrice: 'first-price',
  SecondPrice: 'second-price'
} as const;
export type AuctionType = typeof AuctionType[keyof typeof AuctionType];

export const AuctionStatus = {
  NotStarted: 0,
  InProgress: 1,
  Ended: 2
} as const;
export type AuctionStatus = typeof AuctionStatus[keyof typeof AuctionStatus];

export function getAuctionStatus(auction: Auction): AuctionStatus {
  if (auction.hasEnded) return AuctionStatus.Ended;
  return (auction.startAt >= new Date()) ? AuctionStatus.InProgress : AuctionStatus.NotStarted;
}

export function checkAuctionHasEnded(auction: Auction): { hasEnded: boolean; nextCheck: Date | null; } {
  const now = new Date();
  const bids = auction.bids ?? [];
  let finishTime: Date = new Date();
  const hasEndedObj = {
    hasEnded: true,
    nextCheck: null
  };

  if (auction.hasEnded) return hasEndedObj;

  switch (auction.type) {
    case AuctionType.English:
      if (bids.length === 0) finishTime = auction.endAt;
      else {
        const lastBid = bids.reduce((latest, bid) =>
          bid.createdAt > latest.createdAt ? bid : latest
        );
        const lastBidDeadline = new Date(lastBid.createdAt.getTime() + auction.delayBeforeEnding);
        finishTime = lastBidDeadline > auction.endAt ? lastBidDeadline : auction.endAt
      }
      if (finishTime < now) return hasEndedObj;
      return { hasEnded: false, nextCheck: finishTime };

    case AuctionType.Dutch:
      if (bids.length > 0) return hasEndedObj;

      // Prezzo corrente
      const elapsed = now.getTime() - auction.startAt.getTime();
      const decrements = Math.floor(elapsed / (auction.decrementTime! * 60 * 1000));
      const currentPrice = auction.startPrice - (decrements * auction.decrementPrice!);

      // Se il prezzo ha raggiunto o superato il minimo, invenduto
      if (currentPrice <= auction.minimumPrice!) return hasEndedObj;

      const priceRange = auction.startPrice - auction.minimumPrice!;
      const decrementsNeeded = Math.floor(priceRange / auction.decrementPrice!);
      const decrementIntervalMs = auction.decrementTime! * 60 * 1000;
      const durationMs = decrementsNeeded * decrementIntervalMs;
      finishTime = new Date(auction.startAt.getTime() + durationMs);

      return { hasEnded: false, nextCheck: finishTime };
    
    case AuctionType.FirstPrice:
    case AuctionType.SecondPrice:
      if (now < auction.endAt) return { hasEnded: false, nextCheck: auction.endAt };
      return hasEndedObj;
  }
}

/*export function getAuctionStatus(auction: Auction): AuctionStatus {
  const now = new Date();
  const bids = auction.bids ?? [];
  if (now < auction.startAt) return AuctionStatus.NotStarted;

  switch (auction.type) {
    case AuctionType.FirstPrice:
    case AuctionType.SecondPrice:
      if (now < auction.endAt) return AuctionStatus.InProgress;
      return AuctionStatus.Ended;
    case AuctionType.English:
      if (now < auction.endAt) return AuctionStatus.InProgress;
      if (bids.length === 0) return AuctionStatus.Ended;

      const lastBid = bids.reduce((latest, bid) =>
        bid.createdAt > latest.createdAt ? bid : latest
      );
      const fiveMinutes = 5 * 60 * 1000;
      const timeSinceLastBid = now.getTime() - lastBid.createdAt.getTime();

      if (timeSinceLastBid < fiveMinutes) return AuctionStatus.InProgress;
      return AuctionStatus.Ended;
    case AuctionType.Dutch:
      //se c'è un'offerta, qualcuno ha accettato il prezzo
      if (bids.length > 0) return AuctionStatus.Ended;

      // Prezzo corrente
      const elapsed = now.getTime() - auction.startAt.getTime();
      const decrements = Math.floor(elapsed / (auction.decrementTime! * 60 * 1000));
      const currentPrice = auction.startPrice - (decrements * auction.decrementPrice!);

      // Se il prezzo ha raggiunto o superato il minimo, invenduto
      if (currentPrice <= auction.minimumPrice!) return AuctionStatus.Ended;

      return AuctionStatus.InProgress;

  }
  return AuctionStatus.Ended
} */