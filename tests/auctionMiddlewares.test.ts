import { describe, it, expect, jest } from "@jest/globals";
import {
  validateAuctionMiddleware,
  validateGetAuctionsMiddleware,
  validateUpdateReservePriceMiddleware,
  validateGetAuctionStatsMiddleware
} from "../src/middlewares/auctionMiddleware.ts";
import { AuctionType, AuctionStatus } from "../src/enums/enums.ts";
import type { Request, Response } from "express";
import { AuctionConstants } from "../src/constants/constants.ts";
import { MINUTES } from "../src/utils/dateUtils.ts";
import { Errors } from "../src/factory/errorFactory.ts";
import { ErrorMessages } from "../src/factory/messageStrings.ts";

describe("Unit Tests - auctionMiddleware", () => {
  describe("validateAuctionMiddleware", () => {
    it("should validate a valid english auction and call next", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const toDate = new Date(futureDate);
      toDate.setHours(toDate.getHours() + 2);

      const req = {
        body: {
          startsAt: futureDate,
          endsAt: toDate,
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
      expect(res.locals.auction).toEqual({
        ...req.body,
        creatorId: res.locals.authId,
        delayBeforeEnding: AuctionConstants.defaultDelayBeforeEnding
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should validate a valid dutch auction and call next", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const toDate = new Date(futureDate);
      toDate.setHours(toDate.getHours() + 2);

      const req = {
        body: {
          startsAt: futureDate,
          reservePrice: 100,
          description: "This is a valid long enough description for the auction Test",
          type: AuctionType.Dutch,
          decrementPrice: 100,
          decrementInterval: 10 * MINUTES,
          startPrice: 3000,
        }
      } as unknown as Request;

      const res = {
        locals: { authId: "creator-123" }
      } as unknown as Response;

      const next = jest.fn();

      validateAuctionMiddleware(req, res, next);

      expect(res.locals.auction).toBeDefined();
      expect(res.locals.auction).toEqual({
        ...req.body,
        creatorId: res.locals.authId,
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should validate a valid first-price auction and call next", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const toDate = new Date(futureDate);
      toDate.setHours(toDate.getHours() + 2);

      const req = {
        body: {
          startsAt: futureDate,
          endsAt: toDate,
          reservePrice: 100,
          type: AuctionType.FirstPrice,
          description: "This is a valid long enough description for the auction test."
        }
      } as unknown as Request;

      const res = {
        locals: { authId: "creator-123" }
      } as unknown as Response;

      const next = jest.fn();

      validateAuctionMiddleware(req, res, next);

      expect(res.locals.auction).toBeDefined();
      expect(res.locals.auction).toEqual({
        ...req.body,
        creatorId: res.locals.authId
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should validate a valid second-price auction and call next", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const toDate = new Date(futureDate);
      toDate.setHours(toDate.getHours() + 2);

      const req = {
        body: {
          startsAt: futureDate,
          endsAt: toDate,
          reservePrice: 100,
          type: AuctionType.SecondPrice,
          description: "This is a valid long enough description for the auction test."
        }
      } as unknown as Request;

      const res = {
        locals: { authId: "creator-123" }
      } as unknown as Response;

      const next = jest.fn();

      validateAuctionMiddleware(req, res, next);

      expect(res.locals.auction).toBeDefined();
      expect(res.locals.auction).toEqual({
        ...req.body,
        creatorId: res.locals.authId
      });
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

      expect(() => validateAuctionMiddleware(req, res, next)).toThrow(
        expect.objectContaining({
          name: Errors.ValidationError.name,
          message: ErrorMessages.Validation({ form: "validateAuctionMiddleware" }),
          details: expect.objectContaining({
            startsAt: [expect.any(String)],
            reservePrice: [expect.any(String)],
            description: [expect.any(String)],
            endsAt: [expect.any(String)],
            minimumIncrement: [expect.any(String)]
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateGetAuctionsMiddleware", () => {
    it("should parse comma-separated query strings into arrays and call next", async () => {
      const req = {
        query: {
          creatorIds: "id1,id2",
          statuses: `${AuctionStatus.InProgress},${AuctionStatus.Ended}`,
          types: `${AuctionType.English},${AuctionType.FirstPrice}`
        }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateGetAuctionsMiddleware(req, res, next);

      expect(res.locals.filters).toEqual({
        creatorIds: ["id1", "id2"],
        statuses: [AuctionStatus.InProgress, AuctionStatus.Ended],
        types: [AuctionType.English, AuctionType.FirstPrice]
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

      expect(() => validateUpdateReservePriceMiddleware(req, res, next)).toThrow(
        expect.objectContaining({
          name: Errors.ValidationError.name,
          message: ErrorMessages.Validation({ form: "validateUpdateReservePrice" }),
          details: expect.objectContaining({
            auctionId: [expect.any(String)],
            reservePrice: [expect.any(String)]
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateGetAuctionStatsMiddleware", () => {
    it("should validate stats query parameters and call next", async () => {
      const req = {
        query: {
          types: "english,dutch",
          fromDate: "2026-01-01",
          toDate: "2026-12-31"
        }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateGetAuctionStatsMiddleware(req, res, next);

      expect(res.locals.filters.types).toEqual([AuctionType.English, AuctionType.Dutch]);
      expect(res.locals.filters.fromDate).toEqual(
        new Date(Date.parse(String(req.query.fromDate)))
      );
      expect(res.locals.filters.toDate).toEqual(
        new Date(Date.parse(String(req.query.toDate).concat("T23:59:59.999Z")))
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if toDate is before fromDate", async () => {
      const req = {
        query: {
          fromDate: "2026-12-31",
          toDate: "2026-01-01"
        }
      } as unknown as Request;

      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      expect(() => validateGetAuctionStatsMiddleware(req, res, next)).toThrow(
        expect.objectContaining({
          name: Errors.ValidationError.name,
          message: ErrorMessages.Validation({ form: "validateGetAuctionStats" }),
          details: expect.objectContaining({
            toDate: [
              expect.any(String)
            ]
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});