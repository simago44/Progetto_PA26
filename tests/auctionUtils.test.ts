import { describe, expect, it } from "@jest/globals"
import { AuctionStatus, AuctionType, checkAuctionHasEnded, getAuctionStatus } from "../src/models/AuctionUtils.ts"
import { Auction } from "../src/models/Auction.ts";

const passedDate1: Date = new Date(Date.now() - 60 * 1000)
const passedDate10: Date = new Date(Date.now() - 10 * 60 * 1000)
const futureDate1: Date = new Date(Date.now() + 60 * 1000)
const futureDate10: Date = new Date(Date.now() + 10 * 60 * 1000)

const EndedAuction1: Auction = new Auction({
  creatorId: "id",
  startAt: new Date(passedDate10),
  endAt: passedDate1,
  startPrice: 1000,
  type: AuctionType.Dutch,
  hasEnded: true,
  decrementPrice: 100,
  decrementTime: 1,
  minimumPrice: 500
});

const EndedAuction2: Auction = new Auction({
  creatorId: "id",
  startAt: new Date(passedDate10),
  endAt: passedDate1,
  startPrice: 1000,
  type: AuctionType.Dutch,
  hasEnded: false,
  decrementPrice: 100,
  decrementTime: 1,
  minimumPrice: 500
});

const InProgressAuction: Auction = new Auction({
  creatorId: "id",
  startAt: passedDate1,
  endAt: futureDate10,
  startPrice: 2000,
  type: AuctionType.Dutch,
  hasEnded: false,
  decrementPrice: 100,
  decrementTime: 1,
  minimumPrice: 900
});

const NotStartedAuction: Auction = new Auction({
  creatorId: "id",
  startAt: futureDate1,
  endAt: futureDate10,
  startPrice: 2000,
  type: AuctionType.Dutch,
  hasEnded: false,
  decrementPrice: 100,
  decrementTime: 1,
  minimumPrice: 1100
});

describe("auctionUtils functions", () => {
  it("getAuctionStatus", () => {
    expect(getAuctionStatus(NotStartedAuction)).toBe(AuctionStatus.NotStarted);
    expect(getAuctionStatus(InProgressAuction)).toBe(AuctionStatus.InProgress);
    expect(getAuctionStatus(EndedAuction1)).toBe(AuctionStatus.Ended);
  });

  it("checkAuctionHasEnded", () => {
    expect(checkAuctionHasEnded(NotStartedAuction))
      .toEqual({ hasEnded: false, nextCheck: futureDate10 });
    expect(checkAuctionHasEnded(InProgressAuction))
      .toEqual({ hasEnded: false, nextCheck: futureDate10 });
    expect(checkAuctionHasEnded(EndedAuction1))
      .toEqual({ hasEnded: true, nextCheck: null });
      expect(checkAuctionHasEnded(EndedAuction2))
      .toEqual({ hasEnded: true, nextCheck: null });
  })
});