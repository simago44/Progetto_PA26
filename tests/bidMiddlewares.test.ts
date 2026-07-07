import { describe, it, expect, jest } from "@jest/globals";
import { validateGetAuctionBids, validateBidMiddleware } from "../src/middlewares/bidMiddleware.ts";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

describe("Unit Tests - bidMiddleware", () => {
  describe("validateGetAuctionBids", () => {
    it("should set auctionId in res.locals and call next", async () => {
      const req = {
        params: { auctionId: "12345" }
      } as unknown as Request;

      const res = {
        locals: {}
      } as unknown as Response;

      const next = jest.fn();

      await validateGetAuctionBids(req, res, next);

      expect(res.locals.auctionId).toBe("12345");
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("validateBidMiddleware", () => {
    it("should validate the bid object, save it to res.locals, and call next", async () => {
      const req = {
        params: { auctionId: "auction-123" },
        body: { bidPrice: 150 }
      } as unknown as Request;

      const res = {
        locals: { authId: "user-999" }
      } as unknown as Response;

      const next = jest.fn();

      await validateBidMiddleware(req, res, next);

      expect(res.locals.bid).toEqual({
        userId: "user-999",
        auctionId: "auction-123",
        bidPrice: 150
      });
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw a validation error when the schema payload is invalid", async () => {
      const req = {
        params: { auctionId: "auction-123" },
        body: { bidPrice: "invalid-price" }
      } as unknown as Request;

      const res = {
        locals: { authId: "user-999" }
      } as unknown as Response;

      const next = jest.fn();

      await expect(validateBidMiddleware(req, res, next)).rejects.toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });
});