import { Op, Sequelize, Transaction, type CreationAttributes, type WhereOptions } from "sequelize";
import { isNil, omit, omitBy } from "lodash-es";
import { addInterval } from "../utils/dateUtils.ts";
import logger from "../core/logger.ts";
import type { Bid } from "../models/Bid.ts";
import { createAuctionMissingFieldError, createReservePriceTooHighError, Errors } from "../factories/errorFactory.ts";
import { Auction, type DutchAuction, type EnglishAuction, type FirstPriceAuction, type SecondPriceAuction, type TypedAuction } from "../models/Auction.ts";
import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import type UserRepository from "../repositories/userRepository.ts";
import type AuctionRepository from "../repositories/auctionRepository.ts";
import type BidRepository from "../repositories/bidRepository.ts";
import { createCloseAuctionJob } from "../integrations/BullMQ.ts";

export interface AuctionFilters {
  creatorIds?: string[];
  statuses?: AuctionStatus[];
  types?: AuctionType[];
  fromDate?: Date;
  toDate?: Date;
  won?: boolean;
  participantId?: string; // If the user participated to the auction
}

interface AuctionServiceDeps {
  auctionRepository: AuctionRepository;
  bidRepository: BidRepository;
  userRepository: UserRepository;
  sequelize: Sequelize;
}

class AuctionService {
  private auctionRepository: AuctionServiceDeps["auctionRepository"];
  private bidRepository: AuctionServiceDeps["bidRepository"];
  private userRepository: AuctionServiceDeps["userRepository"];
  private sequelize: AuctionServiceDeps["sequelize"];

  constructor({ auctionRepository, bidRepository, userRepository, sequelize }: AuctionServiceDeps) {
    this.auctionRepository = auctionRepository;
    this.bidRepository = bidRepository;
    this.userRepository = userRepository;
    this.sequelize = sequelize;
  }

  /**
   * Builds Sequelize filters for auctions by status.
   * @param status The auction status.
   * @returns The Sequelize filters for the given auction status.
   */
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

  /**
   * Builds Sequelize filters from auction filter options.
   * @param filters The auction filters to apply.
   * @returns The Sequelize filters matching the provided options.
   */
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
    if (filters.fromDate) {
      /** auction have NOT to be: (ended before fromDate)
      * --> auction have to be: (not ended or ended before fromDate) */
      andConditions.push({
        [Op.or]: [
          { endedAt: { [Op.gte]: filters.fromDate } },
          { endedAt: { [Op.is]: null } },
        ],
      });
    }
    if (filters.toDate) {
      /** auction have NOT to be: (started after toDate)
      * --> auction have to be: (started before toDate)
      * I need to add one day because toDate have not the time
      * so the comparison is wrong */
      andConditions.push({ startsAt: { [Op.lt]: filters.toDate } });
    }

    const where: WhereOptions = { [Op.and]: andConditions };

    return where;
  }

  /**
   * Creates a new Auction and creates a BullMQ Job.
   * @param data The Auction creation attributes.
   * @returns The created Auction instance.
   */
  public async createAuction(data: CreationAttributes<Auction>): Promise<Auction> {
    const auction = await this.auctionRepository.create(data);
    await createCloseAuctionJob(auction.id);
    return auction;
  }

  /**
   * Retrieves auctions matching the provided filters.
   * @param filters The auction filters to apply.
   * @param transaction Sequelize transaction to be used.
   * @returns A list of matching Auction instances.
   */
  public async getAuctions(filters: AuctionFilters, transaction: Transaction | null = null) {
    return await this.auctionRepository.findAll(this.buildFilters(filters), transaction);
  }

  /**
   * Formats auctions by adding calculated fields and removing unnecessary attributes.
   * @param auctions The auctions to format.
   * @returns A list of formatted auctions.
   */
  public async formatAuctions(auctions: Auction[]): Promise<Record<string, unknown>[]> {
    return Promise.all(
      auctions.map(async (auction) => {
        const endsAt = await this.getEndsAt(auction);

        let currentPrice = null;
        let totalBids = null;

        if (auction.type == AuctionType.English && auction.status != AuctionStatus.NotStarted) {
          totalBids = (await this.bidRepository.findAuctionBids(auction.id)).length;
        }

        if (auction.status == AuctionStatus.InProgress) {
          const typedAuction = this.toTypedAuction(auction);
          switch (typedAuction.type) {
            case AuctionType.English:
              currentPrice = await this.getEnglishCurrentBidPrice(typedAuction);
              break;
            case AuctionType.Dutch:
              currentPrice = this.getDutchCurrentBidPrice(typedAuction);
              break;
          }
        }

        return omit(omitBy({ ...auction.dataValues, totalBids, endsAt, status: auction.status, currentPrice }, isNil), ["createdAt", "updatedAt"]);
      })
    );
  }

  /**
   * Retrieves and formats auctions matching the provided filters.
   * @param filters The auction filters to apply.
   * @returns A list of formatted auctions.
   */
  public async getFilteredAuctions(filters: Pick<AuctionFilters, 'creatorIds' | 'types' | 'statuses'>) {
    return await this.formatAuctions(await this.getAuctions(filters));
  }

  /**
   * Computes auction statistics grouped by auction type.
   * @param filters The required auction filters for statistics calculation.
   * @returns Statistics for each auction type.
   */
  public async getAuctionStats(filters: Required<Pick<AuctionFilters, 'fromDate' | 'toDate' | 'types'>>) {
    const finalFilters = this.buildFilters(filters);
    const participantsPerAuction = await this.auctionRepository.getParticipantsPerAuction(finalFilters);

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

  /**
   * Calculates the current bid price of an English auction.
   * @param auction The English auction instance.
   * @param transaction Sequelize transaction to be used.
   * @returns The current bid price.
   */
  public async getEnglishCurrentBidPrice(auction: EnglishAuction, transaction: Transaction | null = null): Promise<number> {
    const highestBid = await this.getWinningBid(auction, transaction);
    // if there is not bid, the current price is the reservePrice
    if (highestBid == null) return auction.reservePrice;
    return highestBid.bidPrice + auction.minimumIncrement;
  }

  /**
   * Calculates the current bid price of a Dutch auction.
   * @param auction The Dutch auction instance.
   * @returns The current bid price.
   */
  public getDutchCurrentBidPrice(auction: DutchAuction): number {
    const timeElapsed = new Date().getTime() - auction.startsAt.getTime();
    const intervals = Math.floor(timeElapsed / auction.decrementInterval);

    const currentPrice = auction.startPrice - auction.decrementPrice * intervals;
    return currentPrice < auction.reservePrice ? auction.reservePrice : currentPrice;
  }

  /**
   * Validates that an Auction has all the fields required by its specific type,
   * and narrows it to the corresponding discriminated type.
   * @param auction The Auction instance to validate.
   * @returns The auction narrowed to its specific type.
   * @throws {InvariantViolationError} If a required field for the auction's type is missing.
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

  /**
   * Calculates the end time of an auction based on its type and current bids.
   * @param rawAuction The Auction instance to evaluate.
   * @param transaction Sequelize transaction to be used.
   * @returns The calculated auction end time.
   */
  public async getEndsAt(rawAuction: Auction, transaction: Transaction | null = null): Promise<Date> {
    const auction = this.toTypedAuction(rawAuction);
    const winningBid = await this.getWinningBid(auction, transaction);

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

  /**
   * Calculates the remaining time until an auction ends.
   * @param auction The Auction instance.
   */
  public async getMsToEnd(auction: Auction): Promise<number>;

  /**
   * Calculates the remaining time until an auction ends.
   * @param auctionId The Auction ID.
   */
  public async getMsToEnd(auctionId: number): Promise<number>;

  /**
   * Calculates the remaining time until an auction ends.
   * @returns The number of milliseconds until the auction ends.
   */
  public async getMsToEnd(auctionOrId: Auction | number): Promise<number> {
    let auction: Auction;

    if (typeof auctionOrId === "number") {
      const foundAuction = await this.auctionRepository.findByPk(auctionOrId);

      if (foundAuction == null) {
        throw new Errors.AuctionNotFound({
          auctionId: auctionOrId,
        });
      }

      auction = foundAuction;
    } else {
      auction = auctionOrId;
    }

    const endsAt = await this.getEndsAt(auction);
    return endsAt.getTime() - Date.now();
  }

  /**
   * Retrieves the winning bid and its final price for an auction.
   * @param auctionId The auction ID.
   * @param transaction Sequelize transaction to be used.
   * @returns The winning bid with its final price, or `null` if no bids exist.
   */
  public async getWinningBid(auction: Auction, transaction: Transaction | null = null): Promise<{ bid: Bid; bidPrice: number; } | null> {
    const bids = await this.bidRepository.findAuctionBids(auction.id, transaction);
    // Ordering by id necessary for sealed bid auctions tiebreak. With the same price
    // we pick the oldest one.
    bids.sort((a, b) => b.bidPrice - a.bidPrice || a.id - b.id);

    const higherBid = bids[0];
    const secondHigherBid = bids[1];

    if (!higherBid) return null;

    const bid = higherBid;
    const finalPrice = auction.type == AuctionType.SecondPrice && secondHigherBid ? secondHigherBid.bidPrice : higherBid.bidPrice;

    return { bid, bidPrice: finalPrice };
  }

  /**
   * Closes an auction if it has reached its end time.
   * @param auction The Auction instance to close.
   * @param transaction Sequelize transaction to be used.
   * @returns `true` if the auction was closed, `false` otherwise.
   */
  public async closeAuction(auctionId: number, transaction: Transaction | null = null): Promise<boolean> {
    // Transaction and lock needed to prevent other queries relative to the auctionId during the auction update.
    const run_transaction = async (t: Transaction) => {
      // create lock on auction
      const auction = await this.auctionRepository.findByPk(auctionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!auction) throw new Errors.AuctionNotFound({ auctionId });

      // if it was already closed or is not ended yet, we return
      const endsAt = await this.getEndsAt(auction, t);
      if (auction.status == AuctionStatus.Ended || endsAt > new Date()) return false;

      logger.debug(`Closing auction: ${auction.id}`);

      const winningBid = await this.getWinningBid(auction, t);

      if (winningBid) {
        const winnerId = winningBid.bid.userId;
        const finalPrice = winningBid.bidPrice;

        await this.auctionRepository.closeAuction(auction.id, { winnerId, finalPrice }, t);
        // remove tokens from winner
        await this.userRepository.decrementTokens(winnerId, finalPrice, t);
        // and add tokens to auction creator
        await this.userRepository.incrementTokens(auction.creatorId, finalPrice, t);

      } else {
        await this.auctionRepository.closeAuction(auction.id, null, t);
      }
    };

    if (transaction) await run_transaction(transaction);
    else await this.sequelize.transaction(run_transaction);

    return true;
  };

  /**
   * Updates the reserve price of an auction.
   * @param auctionId The auction ID.
   * @param reservePrice The new reserve price.
   * @param userID The user ID of the user that wants to make the update.
   * @throws {AuctionNotFoundError} If the auction does not exist.
   * @throws {AuctionTypeNotSupportedError} If the auction type does not support reserve price updates.
   * @throws {AuctionEndedError} If the auction has already ended.
   * @throws {ReservePriceTooHighError} If the new reserve price is greater than or equal to the current reserve price.
   * @throws {AuctionHasAlreadyBidError} If the auction already has bids.
   */
  public async updateAuctionReservePrice(auctionId: number, userId: string, reservePrice: number): Promise<void> {
    // Transaction and lock needed to prevent other queries relative to the auctionId during the auction update.
    await this.sequelize.transaction(async (t: Transaction) => {
      const auction = await this.auctionRepository.findByPk(auctionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!auction) throw new Errors.AuctionNotFound({ auctionId });

      // Only the auction creator can update the reserve price
      if (auction.creatorId != userId) throw new Errors.Forbidden();

      switch (auction.type) {
        case AuctionType.English:
          if (auction.status == AuctionStatus.Ended) throw new Errors.AuctionEnded({ auctionId: auction.id });
          if (reservePrice >= auction.reservePrice) throw createReservePriceTooHighError("updateAuctionReservePrice");
          // Because it's useless to lower the reservePrice when there is already a bid that it's higher than it.
          if (await this.bidRepository.auctionHasBids(auction.id, t)) throw new Errors.AuctionHasAlreadyABid();

          break;
        case AuctionType.Dutch:
          if (auction.status == AuctionStatus.Ended) throw new Errors.AuctionEnded({ auctionId: auction.id });
          // It's useless to check for bids because the auction has bids only if it's ended.
          if (reservePrice >= auction.reservePrice) throw createReservePriceTooHighError("updateAuctionReservePrice");

          break;
        case AuctionType.FirstPrice:
        case AuctionType.SecondPrice:
          throw new Errors.AuctionTypeNotSupported({ type: auction.type });
      }

      auction.reservePrice = reservePrice;
      await this.auctionRepository.save(auction, t);
    });
  }
}

export default AuctionService;