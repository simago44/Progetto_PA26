import { Op, type CreationAttributes, type WhereOptions } from "sequelize";
import auctionRepository from "../repositories/auctionRepository.ts";
import { isNil, omit, omitBy } from "lodash-es";
import { addInterval, HOURS } from "../utils/dateUtils.ts";
import logger from "../core/logger.ts";
import sequelize from "../integrations/sequelize.ts";
import type { Bid } from "../models/Bid.ts";
import userRepository from "../repositories/userRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import { createAuctionMissingFieldError, createReservePriceTooHighError, Errors } from "../factory/errorFactory.ts";
import { Auction, type DutchAuction, type EnglishAuction, type FirstPriceAuction, type SecondPriceAuction, type TypedAuction } from "../models/Auction.ts";
import { AuctionStatus, AuctionType } from "../enums/enums.ts";

export interface AuctionFilters {
  creatorIds?: string[];
  statuses?: AuctionStatus[];
  types?: AuctionType[];
  startDate?: Date;
  endDate?: Date;
  won?: boolean;
  participantId?: string; // If the user participated to the auction
}

class AuctionService {
  public buildStatusFilters(status: AuctionStatus): WhereOptions {
    const now = new Date();

    switch (status) {
      case AuctionStatus.NotStarted:
        return {
          startsAt: { [Op.gt]: now },
          endedAt: null
        };

      case AuctionStatus.InProgress:
        return {
          startsAt: { [Op.lte]: now },
          endedAt: null
        };

      case AuctionStatus.Ended:
        return { endedAt: { [Op.ne]: null } };
    }
  }

  public buildFilters(filters: AuctionFilters): WhereOptions {
    const andConditions: WhereOptions[] = [];

    if (filters.creatorIds) {
      andConditions.push({ creatorId: { [Op.in]: filters.creatorIds } });
    }
    if (filters.types) {
      andConditions.push({ type: { [Op.in]: filters.types } });
    }
    if (filters.statuses) {
      const orList = filters.statuses.map((s: AuctionStatus) => this.buildStatusFilters(s));
      andConditions.push({ [Op.or]: orList });
    }
    if (filters.won != null && filters.participantId != null) { //if won filter is active
      andConditions.push({
        //winnerId === participantId if won filter is true
        //winnerId !== participantId or winnerId is null if won filter is false
        winnerId: filters.won
          ? filters.participantId
          : { [Op.or]: [{ [Op.ne]: filters.participantId }, { [Op.is]: null }] },
      });
    }
    if (filters.startDate) {
      /** auction have NOT to be: (ended before startDate)
      * --> auction have to be: (not ended or ended before startDate) */
      filters.startDate.setHours(0, 0, 0, 0);
      andConditions.push({
        [Op.or]: [
          { endedAt: { [Op.gte]: filters.startDate } },
          { endedAt: { [Op.is]: null } },
        ],
      });
    }
    if (filters.endDate) {
      /** auction have NOT to be: (started after endDate)
      * --> auction have to be: (started before endDate) 
      * I need to add one day because endDate have not the time
      * so the comparison is wrong */
      filters.endDate.setHours(0, 0, 0, 0);
      andConditions.push({ startsAt: { [Op.lt]: addInterval(filters.endDate, 24 * HOURS) } });
    }

    const where: WhereOptions = { [Op.and]: andConditions };

    return where;
  }

  public async createAuction(data: CreationAttributes<Auction>): Promise<Auction> {
    return auctionRepository.create(data);
  }

  public async getAuctions(filters: AuctionFilters) {
    return await auctionRepository.getFiltered(this.buildFilters(filters));
  }

  public async getEndTime(auction: Auction): Promise<Date> {
    const msToEnd = await this.getMsToEnd(auction);
    return addInterval(new Date(), msToEnd);
  }

  public async formatAuctions(auctions: Auction[]): Promise<Record<string, unknown>[]> {
    return Promise.all(
      auctions.map(async (auction) => {
        const endsAt = await this.getEndTime(auction);
        return omit(omitBy({ ...auction.dataValues, endsAt, status: auction.status }, isNil), ["createdAt", "updatedAt"]);
      })
    );
  }

  public async getFilteredAuctions(filters: Pick<AuctionFilters, 'creatorIds' | 'types' | 'statuses'>) {
    return await this.formatAuctions(await this.getAuctions(filters));
  }

  public async getAuctionStats(filters: Required<Pick<AuctionFilters, 'startDate' | 'endDate' | 'types'>>) {
    const finalFilters = this.buildFilters(filters);
    const participantsPerAuction = await auctionRepository.getParticipantsPerAuction(finalFilters);

    // if filters.types is null, we replace it with all the types (see below)
    const types = filters.types ?? (Object.values(AuctionType) as AuctionType[]);

    // we initialize byType, so if there isn't an auction type in the query
    // result, the type will still show up in the output
    const byType = new Map<AuctionType, number[]>(types.map(t => [t, []]));

    for (const row of participantsPerAuction) {
      byType.get(row.type)?.push(Number(row.participantCount));
    }

    const stats = Array.from(byType.entries()).map(([type, counts]) => ({
      type,
      auctionCount: counts.length,
      avgParticipants: counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0,
      minParticipants: counts.length ? Math.min(...counts) : 0,
      maxParticipants: counts.length ? Math.max(...counts) : 0,
    }));

    return stats;
  }

  public async getEnglishCurrentBidPrice(auction: EnglishAuction): Promise<number> {
    const winningBid = await this.getWinningBid(auction.id);
    if (winningBid == null) return auction.reservePrice;
    return winningBid.bidPrice + auction.minimumIncrement;
  }

  public getDutchCurrentBidPrice(auction: DutchAuction): number {
    const timeElapsed = new Date().getTime() - auction.startsAt.getTime();
    const intervals = Math.floor(timeElapsed / auction.decrementInterval);

    const currentPrice = auction.startPrice - auction.decrementPrice * intervals;
    return currentPrice < auction.reservePrice ? auction.reservePrice : currentPrice;
  }

  /**
   * Validates that an Auction has all the fields required by its specific type,
   * and narrows it to the corresponding discriminated type.
   *
   * @throws {Error} If a required field for the auction's type is missing
   */
  public toTypedAuction(auction: Auction): TypedAuction {
    switch (auction.type) {
      case AuctionType.English:
        if (auction.endsAt == null) throw createAuctionMissingFieldError(auction, 'endsAt');
        if (auction.minimumIncrement == null) throw createAuctionMissingFieldError(auction, 'minimumIncrement');
        if (auction.delayBeforeEnding == null) throw createAuctionMissingFieldError(auction, 'delayBeforeEnding');
        return auction as EnglishAuction;

      case AuctionType.Dutch:
        if (auction.decrementPrice == null) throw createAuctionMissingFieldError(auction, 'decrementPrice');
        if (auction.decrementInterval == null) throw createAuctionMissingFieldError(auction, 'decrementInterval');
        if (auction.startPrice == null) throw createAuctionMissingFieldError(auction, 'startPrice');
        return auction as DutchAuction;

      case AuctionType.FirstPrice:
        if (auction.endsAt == null) throw createAuctionMissingFieldError(auction, 'endsAt');
        return auction as FirstPriceAuction;
      case AuctionType.SecondPrice:
        if (auction.endsAt == null) throw createAuctionMissingFieldError(auction, 'endsAt');
        return auction as SecondPriceAuction;
    }
  }

  // Returns the ms until/from the end of the auction
  public async getEndsAt(rawAuction: Auction): Promise<Date> {
    const auction = this.toTypedAuction(rawAuction);
    const winningBid = await this.getWinningBid(auction.id);

    switch (auction.type) {
      case AuctionType.English: {
        // if we don't have any bids, the end time is endsAt
        if (winningBid == null) return auction.endsAt;

        // otherwise we can calculate endsAt by getting the max between
        // endsAt and winningBid + delayBeforeEnding
        const lastBidDeadline = addInterval(winningBid.bid.createdAt, auction.delayBeforeEnding);
        return lastBidDeadline > auction.endsAt ? lastBidDeadline : auction.endsAt;
      }

      case AuctionType.Dutch: {
        // if we don't have any bids, the end time is endsAt
        if (winningBid) return winningBid.bid.createdAt;

        // Here we calculate endsAt by first getting the needed decrement steps
        // to reach the reservePrice
        // Then, by multiplying the decrementInterval with the steps, we calculate the necessary time
        // to reach reservePrice
        // endsAt is startAt + time to reach reservePrice
        const priceRange = auction.startPrice - auction.reservePrice;
        // We use ceil because the last step will be less than the minimum price
        const decrementsNeeded = Math.ceil(priceRange / auction.decrementPrice);
        const decrementInterval = auction.decrementInterval;
        const duration = decrementsNeeded * decrementInterval;
        return addInterval(auction.startsAt, duration);
      }

      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice:
        // For closed auctions endsAt is static
        return auction.endsAt;
    }
  }

  public async getMsToEnd(auction: Auction): Promise<number> {
    const endsAt = await this.getEndsAt(auction);
    return endsAt.getTime() - new Date().getTime();
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

  public async closeAuction(auction: Auction): Promise<boolean> {
    // if it was already closed or is not ended yet, we return
    const endsAt = await this.getEndsAt(auction);
    if (auction.status == AuctionStatus.Ended || endsAt > new Date()) return false;

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

    return true;
  };

  public async updateAuctionReservePrice(auctionId: number, reservePrice: number): Promise<void> {
    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    switch (auction.type) {
      case AuctionType.English:
        if (auction.status == AuctionStatus.Ended) throw new Error("The auction has ended");
        if (reservePrice >= auction.reservePrice) throw createReservePriceTooHighError("updateAuctionReservePrice");
        if (await bidRepository.auctionHasBids(auction.id)) throw new Errors.AuctionHasAlreadyAbBidError();

        break;
      case AuctionType.Dutch:
        if (auction.status == AuctionStatus.Ended) throw new Errors.AuctionEndedError();
        if (reservePrice >= auction.reservePrice) throw createReservePriceTooHighError("updateAuctionReservePrice");

        break;
      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice:
        throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    auction.reservePrice = reservePrice;
    await auctionRepository.save(auction);
  }
}

const auctionService = new AuctionService();

export default auctionService;