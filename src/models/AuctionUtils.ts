import logger from "../middlewares/logger.ts";
import sequelize from "../services/sequelize.ts";
import { Auction, AuctionStatus, AuctionType } from "./Auction.ts";
import { User } from "./User.ts";
import type { Bid } from "./Bid.ts";
import { col, Op, where } from "sequelize";

export function getAuctionStatus(auction: Auction): AuctionStatus {
  if (auction.hasEnded) return AuctionStatus.Ended;
  return auction.startAt <= new Date()
    ? AuctionStatus.InProgress
    : AuctionStatus.NotStarted;
}

export async function getMsToEnd(auction: Auction): Promise<number> {
  const now = new Date();
  const bids = await auction.getBids();
  let finishTime: Date = new Date();

  if (auction.hasEnded) return -1;
  switch (auction.type) {
    case AuctionType.English:
      if (auction.endAt == null)
        throw new TypeError("Null attribute endAt");

      if (bids.length === 0) finishTime = auction.endAt;
      else {
        const lastBid = bids.reduce((latest, bid) =>
          bid.createdAt > latest.createdAt ? bid : latest,
        );
        const lastBidDeadline = new Date(
          lastBid.createdAt.getTime() + auction.delayBeforeEnding,
        );
        finishTime =
          lastBidDeadline > auction.endAt ? lastBidDeadline : auction.endAt;
      }
      logger.debug(`auction ${auction.id} ends at: ${finishTime.toString()}`);
      logger.debug(now.toString());
      return finishTime.getTime() - now.getTime(); // negative if past

    case AuctionType.Dutch:
      if (auction.decrementPrice == null)
        throw new TypeError("Null attribute decrementPrice");
      if (auction.decrementInterval == null)
        throw new TypeError("Null attribute decrementTime");
      if (auction.minimumPrice == null)
        throw new TypeError("Null attribute minimumPrice");

      if (bids.length > 0) return -1;

      //Calculate the finish time
      const priceRange = auction.startPrice - auction.minimumPrice!;
      const decrementsNeeded = Math.floor(priceRange / auction.decrementPrice!);
      const decrementIntervalMs = auction.decrementInterval!;
      const durationMs = decrementsNeeded * decrementIntervalMs;
      finishTime = new Date(auction.startAt.getTime() + durationMs);

      //If the auction has not started yet, it cannot be ended
      if (getAuctionStatus(auction) === AuctionStatus.NotStarted)
        return finishTime.getTime() - now.getTime();

      // Current price
      const elapsed = now.getTime() - auction.startAt.getTime();
      const decrements = Math.floor(
        elapsed / (auction.decrementInterval! * 60 * 1000),
      );
      const currentPrice =
        auction.startPrice - decrements * auction.decrementPrice!;

      /** If the current price is less than minimumPrice,
       * The auction is ended in not selled case
       * */
      if (currentPrice <= auction.minimumPrice!) return -1;

      return finishTime.getTime() - now.getTime();

    case AuctionType.FirstPrice:
    case AuctionType.SecondPrice:
      return auction.endAt.getTime() - now.getTime(); // negative if past
  }
}

export async function getWinningBid(
  auction: Auction,
): Promise<{ bid: Bid; finalPrice: number; } | null> {
  // get only bids from user with enought tokens
  // descending order based on bidPrice
  const bids = await auction.getBids({
    include: [{ model: User, required: true }],
    where: where(col("User.tokens"), {
      [Op.gte]: col("bidPrice"),
    }),
    order: [["bidPrice", "DESC"]],
  });

  const higherBid = bids[0];
  const secondHigherBid = bids[1];

  if (higherBid == null) return null;

  switch (auction.type) {
    case AuctionType.English:
    case AuctionType.Dutch:
    case AuctionType.FirstPrice:
      return { bid: higherBid, finalPrice: higherBid.bidPrice };

    case AuctionType.SecondPrice:
      if (secondHigherBid == null)
        return { bid: higherBid, finalPrice: higherBid.bidPrice };
      return { bid: higherBid, finalPrice: secondHigherBid.bidPrice };
  }
}

export async function closeAuction(auction: Auction, msToEnd: number) {
  // if it was already closed or is not ended yet, we return
  if (auction.hasEnded || msToEnd > 0) return;

  logger.debug(`Closing auction: ${auction.id}`);

  await sequelize.transaction(async (t) => {
    const winningBid = await getWinningBid(auction);

    if (winningBid) {
      const winnerId = winningBid.bid.userId;
      const finalPrice = winningBid.finalPrice;

      await Auction.update(
        { hasEnded: true, winnerId, finalPrice },
        { where: { id: auction.id }, transaction: t },
      );
      await User.decrement("tokens", {
        by: finalPrice,
        where: { id: winnerId },
        transaction: t,
      });
    } else {
      await Auction.update(
        { hasEnded: true },
        { where: { id: auction.id }, transaction: t },
      );
    }
  });
};
