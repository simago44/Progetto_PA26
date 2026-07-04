import { Op, type CreationAttributes, type WhereOptions } from "sequelize";
import auctionRepository from "../repositories/auctionRepository.ts";
import { filter, isNil, omit, omitBy } from "lodash-es";
import { addInterval, HOURS } from "../utils/dateUtils.ts";
import logger from "../core/logger.ts";
import sequelize from "../integrations/sequelize.ts";
import type { Bid } from "../models/Bid.ts";
import userRepository from "../repositories/userRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import { createAuctionMissingFieldError, createReservePriceTooHighError, Errors } from "../factory/errorFactory.ts";
import { Auction } from "../models/Auction.ts";
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
  private buildStatusFilters(status: AuctionStatus): WhereOptions {
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

  private buildFilters(filters: AuctionFilters): WhereOptions {
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

  public async getAuctions(filters: Pick<AuctionFilters, 'creatorIds' | 'types' | 'statuses'>) {
    return await auctionRepository.getFiltered(this.buildFilters(filters));
  }

  public async getAuctionReport(filters: Required<Pick<AuctionFilters, 'won' | 'participantId' | 'startDate' | 'endDate'>>) {
    const where = this.buildFilters(filters);
    const auctions = await auctionRepository.getUserAuctions(filters.participantId, where);
    return this.formatAuctions(auctions);
  }

  public async getWalletReport(filters: Required<Pick<AuctionFilters, 'won' | 'participantId' | 'startDate' | 'endDate'>>) {
    filters.won = true;
    const where = this.buildFilters(filters);
    return await auctionRepository.getTotalFinalPrice(where);
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
    if (auction.endedAt) return AuctionStatus.Ended;
    return auction.startsAt <= new Date()
      ? AuctionStatus.InProgress
      : AuctionStatus.NotStarted;
  }

  public async getMsToEnd(auction: Auction): Promise<number> {
    const winningBid = await this.getWinningBid(auction.id);
    let finishTime: Date = new Date();

    switch (auction.type) {
      case AuctionType.English:
        if (auction.delayBeforeEnding == null) throw createAuctionMissingFieldError(auction, 'delayBeforeEnding');
        if (auction.endsAt == null) throw createAuctionMissingFieldError(auction, 'endsAt');

        if (winningBid == null) return auction.endsAt.getTime() - new Date().getTime();

        const lastBidDeadline = addInterval(winningBid.bid.createdAt, auction.delayBeforeEnding);
        finishTime = lastBidDeadline > auction.endsAt ? lastBidDeadline : auction.endsAt;
        
        return finishTime.getTime() - new Date().getTime();

      case AuctionType.Dutch:
        if (auction.decrementPrice == null) throw createAuctionMissingFieldError(auction, 'decrementPrice');
        if (auction.decrementInterval == null) throw createAuctionMissingFieldError(auction, 'decrementInterval');
        if (auction.startPrice == null) throw createAuctionMissingFieldError(auction, 'startPrice');

        if (winningBid) return winningBid.bid.createdAt.getTime() - new Date().getTime();

        const priceRange = auction.startPrice - auction.reservePrice;
        // We use ceil because the last step will be less than the minimum price
        const decrementsNeeded = Math.ceil(priceRange / auction.decrementPrice);
        const decrementInterval = auction.decrementInterval;
        const duration = decrementsNeeded * decrementInterval;
        finishTime = addInterval(auction.startsAt, duration);

        return finishTime.getTime() - new Date().getTime();

      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice:
        if (auction.endsAt == null) throw createAuctionMissingFieldError(auction, 'endsAt');

        return auction.endsAt.getTime() - new Date().getTime();
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
    if (auction.endedAt || msToEnd > 0) return;

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


  public async updateAuctionReservePrice(auctionId: number, reservePrice: number) {
    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    switch (auction.type) {
      case AuctionType.English:
        if (auction.endedAt) throw new Error("The auction has ended");
        if (reservePrice >= auction.reservePrice) throw createReservePriceTooHighError("updateAuctionReservePrice");
        if (await bidRepository.auctionHasBids(auction.id)) throw new Errors.AuctionHasAlreadyAbBidError();

        break;
      case AuctionType.Dutch:
        if (auction.endedAt) throw new Errors.AuctionEndedError();
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