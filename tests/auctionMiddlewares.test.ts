import { describe, it, expect, jest } from "@jest/globals";
import {
  validateAuctionMiddleware,
  validateGetAuctionsMiddleware,
  validateUpdateReservePriceMiddleware,
  validateGetAuctionStatsMiddleware
} from "../src/middlewares/auctionMiddleware.ts";
import { AuctionType, AuctionStatus } from "../src/enums/enums.ts";
import type { Request, Response } from "express";

describe("Unit Tests - auctionMiddleware", () => {
  describe("validateAuctionMiddleware", () => {
    it("should validate a valid English auction and call next", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const endDate = new Date(futureDate);
      endDate.setHours(endDate.getHours() + 2);

      const req = {
        body: {
          startsAt: futureDate,
          endsAt: endDate,
          reservePrice: 100,
          type: AuctionType.English,
          minimumIncrement: 10,
          description: "This is a valid long enough description for the auction test."
        }
      } as unknown as Request;

      const res = {
        locals: { authId: "creator-123" }
      } as unknown as Response;

      const next = jest.fn();

      validateAuctionMiddleware(req, res, next);

      expect(res.locals.auction).toBeDefined();
      expect(res.locals.auction.creatorId).toBe("creator-123");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if validation fails", () => {
      const req = {
        body: {
          type: AuctionType.English,
          reservePrice: -10
        }
      } as unknown as Request;

      const res = {
        locals: { authId: "creator-123" }
      } as unknown as Response;

      const next = jest.fn();

      expect(() => validateAuctionMiddleware(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateGetAuctionsMiddleware", () => {
    it("should parse comma-separated query strings into arrays and call next", async () => {
      const req = {
        query: {
          creatorIds: "id1,id2",
          statuses: `${AuctionStatus.InProgress},${AuctionStatus.Ended}`,
          types: `${AuctionType.English}`
        }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateGetAuctionsMiddleware(req, res, next);

      expect(res.locals.filters).toEqual({
        creatorIds: ["id1", "id2"],
        statuses: [AuctionStatus.InProgress, AuctionStatus.Ended],
        types: [AuctionType.English]
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should handle empty or optional query fields gracefully", async () => {
      const req = { query: {} } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateGetAuctionsMiddleware(req, res, next);

      expect(res.locals.filters).toEqual({});
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateUpdateReservePriceMiddleware", () => {
    it("should parse and validate parameters, set locals, and call next", async () => {
      const req = {
        params: { auctionId: "42" },
        body: { reservePrice: 250 }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateUpdateReservePriceMiddleware(req, res, next);

      expect(res.locals.auctionId).toBe(42);
      expect(res.locals.reservePrice).toBe(250);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error for invalid auctionId or low reservePrice", async () => {
      const req = {
        params: { auctionId: "-5" },
        body: { reservePrice: -1 }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      expect(() => validateUpdateReservePriceMiddleware(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateGetAuctionStatsMiddleware", () => {
    it("should validate stats query parameters and call next", async () => {
      const req = {
        query: {
          types: "english,dutch",
          startDate: "2026-01-01",
          endDate: "2026-12-31"
        }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateGetAuctionStatsMiddleware(req, res, next);

      expect(res.locals.filters.types).toEqual([AuctionType.English, AuctionType.Dutch]);
      expect(res.locals.filters.startDate).toBeInstanceOf(Date);
      expect(res.locals.filters.endDate).toBeInstanceOf(Date);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if endDate is before startDate", async () => {
      const req = {
        query: {
          startDate: "2026-12-31",
          endDate: "2026-01-01"
        }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      expect(() => validateGetAuctionStatsMiddleware(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });
});