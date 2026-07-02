import type { CreationAttributes } from "sequelize";
import auctionRepository, { type AuctionFilters } from "../repositories/auctionRepository.ts";
import { isNil, omit, omitBy } from "lodash-es";
import { addInterval } from "../utils/dateUtils.ts";
import logger from "../core/logger.ts";
import sequelize from "../integrations/sequelize.ts";
import type { Bid } from "../models/Bid.ts";
import userRepository from "../repositories/userRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import { createAuctionMissingField } from "../factory/errorFactory.ts";
import type { Auction } from "../models/Auction.ts";
import { AuctionStatus, AuctionType } from "../enums/enums.ts";

class AuctionService {
  public async getFiltered(filters: AuctionFilters) {
    return auctionRepository.getFiltered(filters);
  }

  public async createAuction(data: CreationAttributes<Auction>): Promise<Auction> {
    return auctionRepository.create(data);
  }

  public async formatAuctions(auctions: Auction[]): Promise<any[]> {
    const formattedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        let cleaned: any = auction;
        cleaned.endsAt = await this.getEndTime(auction);

        cleaned = omitBy(auction.dataValues, isNil);
        cleaned = omit(cleaned, ["createdAt", "updatedAt"]);

        return cleaned;
      })
    );
    return formattedAuctions;
  }

  public async getEndTime(auction: Auction): Promise<Date> {
    const msToEnd = await this.getMsToEnd(auction);
    return addInterval(new Date(), msToEnd);
  }

  public getAuctionStatus(auction: Auction): AuctionStatus {
    if (auction.hasEnded) return AuctionStatus.Ended;
    return auction.startsAt <= new Date()
      ? AuctionStatus.InProgress
      : AuctionStatus.NotStarted;
  }

  public async getMsToEnd(auction: Auction): Promise<number> {
    const bids = await bidRepository.findAuctionBids(auction.id);
    let finishTime: Date = new Date();

    switch (auction.type) {
      case AuctionType.English:
        if (auction.delayBeforeEnding == null) throw createAuctionMissingField(auction, 'delayBeforeEnding');
        if (auction.endsAt == null) throw createAuctionMissingField(auction, 'endsAt');

        if (bids.length === 0) finishTime = auction.endsAt;
        else {
          const lastBid = bids.reduce((latest, bid) =>
            bid.createdAt > latest.createdAt ? bid : latest,
          );
          const lastBidDeadline = addInterval(lastBid.createdAt, auction.delayBeforeEnding);
          finishTime = lastBidDeadline > auction.endsAt ? lastBidDeadline : auction.endsAt;
        }
        return finishTime.getTime() - new Date().getTime(); // negative if past

      case AuctionType.Dutch:
        if (auction.decrementPrice == null) throw createAuctionMissingField(auction, 'decrementPrice');
        if (auction.decrementInterval == null) throw createAuctionMissingField(auction, 'decrementInterval');
        if (auction.minimumPrice == null) throw createAuctionMissingField(auction, 'minimumPrice');

        if (bids.length > 0 && bids[0]) return bids[0].createdAt.getTime() - new Date().getTime();

        const priceRange = auction.startPrice - auction.minimumPrice;
        //We use ceil because the last step will be less than the minimum price
        const decrementsNeeded = Math.ceil(priceRange / auction.decrementPrice);
        const decrementInterval = auction.decrementInterval;
        const duration = decrementsNeeded * decrementInterval;
        finishTime = addInterval(auction.startsAt, duration);

        //If the auction has not started yet, it cannot be ended
        if (this.getAuctionStatus(auction) === AuctionStatus.NotStarted) {
          return finishTime.getTime() - new Date().getTime();
        }

        // Current price
        const elapsed = new Date().getTime() - auction.startsAt.getTime();
        const decrements = Math.floor(
          elapsed / (auction.decrementInterval! * 60 * 1000),
        );
        const currentPrice = auction.startPrice - decrements * auction.decrementPrice;

        /** If the current price is less than minimumPrice,
         * The auction is ended in not selled case
         * */
        if (currentPrice <= auction.minimumPrice) return -1;

        return finishTime.getTime() - new Date().getTime();

      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice:
        if (auction.endsAt == null) throw createAuctionMissingField(auction, 'endsAt');

        return auction.endsAt.getTime() - new Date().getTime(); // negative if past
    }
  }

  public async getWinningBid(auctionId: number): Promise<{ bid: Bid; bidPrice: number; } | null> {
    const bids = await bidRepository.findAuctionBids(auctionId);
    // descending order based on bidPrice
    // TODO: check tokens?
    bids.sort((a, b) => b.bidPrice - a.bidPrice);

    const higherBid = bids[0];
    const secondHigherBid = bids[1];

    if (!higherBid) return null;

    const bid = higherBid;
    const finalPrice = AuctionType.SecondPrice && secondHigherBid ? secondHigherBid.bidPrice : higherBid.bidPrice;

    return { bid, bidPrice: finalPrice };
  }

  public async closeAuction(auction: Auction, msToEnd: number) {
    // if it was already closed or is not ended yet, we return
    if (auction.hasEnded || msToEnd > 0) return;

    logger.debug(`Closing auction: ${auction.id}`);

    const winningBid = await this.getWinningBid(auction.id);

    if (winningBid) {
      const winnerId = winningBid.bid.userId;
      const finalPrice = winningBid.bidPrice;

      await sequelize.transaction(async (t) => {
        await auctionRepository.closeAuction(auction.id, { winnerId, finalPrice }, t);
        // remove tokens from winner
        await userRepository.decrementTokens(winnerId, finalPrice, t);
        // and add tokens to auction creator
        await userRepository.incrementTokens(auction.creatorId, finalPrice, t);
      });
    } else {
      await auctionRepository.closeAuction(auction.id, null);
    }
  };
}

const auctionService = new AuctionService();

export default auctionService;