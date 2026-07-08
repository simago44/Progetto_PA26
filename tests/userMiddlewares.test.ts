import { describe, it, expect, jest } from "@jest/globals";
import {
  resolveUserIdParam,
  validateTopUpWallet,
  validateAuctionReportFilters,
  validateWalletReportFilters
} from "../src/middlewares/userMiddlewares.ts";
import { AuctionType } from "../src/enums/enums.ts";
import type { Request, Response } from "express";
import { Errors } from "../src/factory/errorFactory.ts";
import { ErrorMessages } from "../src/factory/messageStrings.ts";

describe("Unit Tests - walletMiddleware", () => {
  describe("resolveUserIdParam", () => {
    it("should resolve 'self' to res.locals.authId and call next", () => {
      const req = {
        params: { userId: "self" }
      } as unknown as Request;
      const res = {
        locals: { authId: "authenticated-user-123" }
      } as unknown as Response;
      const next = jest.fn();

      resolveUserIdParam(req, res, next);

      expect(res.locals.userId).toBe("authenticated-user-123");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should resolve specific userId directly and call next", () => {
      const req = {
        params: { userId: "target-user-456" }
      } as unknown as Request;
      const res = {
        locals: { authId: "authenticated-user-123" }
      } as unknown as Response;
      const next = jest.fn();

      resolveUserIdParam(req, res, next);

      expect(res.locals.userId).toBe("target-user-456");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateTopUpWallet", () => {
    it("should validate positive tokens, assign parameters, and call next", () => {
      const req = {
        params: { userId: "user-123" },
        body: { tokens: 50 }
      } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateTopUpWallet(req, res, next);

      expect(res.locals.userId).toBe("user-123");
      expect(res.locals.tokens).toBe(50);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if tokens amount is negative or zero", () => {
      const req = {
        params: { userId: "user-123" },
        body: { tokens: -10 }
      } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      expect(() => validateTopUpWallet(req, res, next)).toThrow(
        expect.objectContaining({
          name: Errors.ValidationError.name,
          message: ErrorMessages.Validation({ form: "validateTopUpWallet" }),
          details: expect.objectContaining({
            tokens: [
              expect.any(String),
            ]
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateAuctionReportFilters", () => {
    it("should parse query array parameters, inject participantId, and call next", () => {
      const req = {
        query: {
          won: "true",
          types: `${AuctionType.English},${AuctionType.Dutch}`,
          startDate: "2026-01-01",
          endDate: "2026-06-01"
        }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-123" }
      } as unknown as Response;
      const next = jest.fn();

      validateAuctionReportFilters(req, res, next);

      expect(res.locals.filters.participantId).toBe("user-123");
      expect(res.locals.filters.won).toBe(true);
      expect(res.locals.filters.types).toEqual([AuctionType.English, AuctionType.Dutch]);
      expect(res.locals.filters.startDate).toBeInstanceOf(Date);
      expect(res.locals.filters.endDate).toBeInstanceOf(Date);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if endDate is in the future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const req = {
        query: {
          endDate: futureDate.toISOString()
        }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-123" }
      } as unknown as Response;
      const next = jest.fn();

      expect(() => validateAuctionReportFilters(req, res, next)).toThrow(
        expect.objectContaining({
          name: Errors.ValidationError.name,
          message: ErrorMessages.Validation({ form: "validateAuctionReportFilters" }),
          details: expect.objectContaining({
            endDate: [
              expect.any(String),
            ]
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateWalletReportFilters", () => {
    it("should parse query parameters, populate filters object, and call next", () => {
      const req = {
        query: {
          startDate: "2026-01-01",
          endDate: "2026-05-01"
        }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-789" }
      } as unknown as Response;
      const next = jest.fn();

      validateWalletReportFilters(req, res, next);

      expect(res.locals.filters.participantId).toBe("user-789");
      expect(res.locals.filters.startDate).toBeInstanceOf(Date);
      expect(res.locals.filters.endDate).toBeInstanceOf(Date);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if endDate is before startDate", () => {
      const req = {
        query: {
          startDate: "2026-12-31",
          endDate: "2026-01-01"
        }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-789" }
      } as unknown as Response;
      const next = jest.fn();

      expect(() => validateWalletReportFilters(req, res, next)).toThrow(
        expect.objectContaining({
          name: Errors.ValidationError.name,
          message: ErrorMessages.Validation({ form: "validateWalletReportFilters" }),
          details: expect.objectContaining({
            endDate: [
              expect.any(String),
            ]
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});