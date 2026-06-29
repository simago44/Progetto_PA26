import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import bidRepository from "../repositories/bidRepository.ts";
import { Bid } from "../models/Bid.ts";
import { BaseError, ValidationError } from "sequelize";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";

export class BidController {
  public async createBid(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: validation of bid based on auction and user (tokens, auction closed, ecc)
      const bid: Bid = new Bid({...req.body});

      const saved = await bidRepository.save(bid);

      res.status(StatusCodes.OK).json({ id: saved.id });
    } catch (err) {
      if (err instanceof ValidationError) {
        next(
          createError(
            ErrorEnum.ValidationError,
            `${err.message}: ${err.errors.map((e) => `${e.path}: ${e.message}`).join(`, `)}`,
          ),
        );
        return;
      }
      if (err instanceof BaseError) {
        next(createError(ErrorEnum.DatabaseError, err.message));
        return;
      }
      if (err instanceof Error) {
        next(createError(ErrorEnum.InternalServer, err.message));
        return;
      }
      next(createError(ErrorEnum.InternalServer));
    }
  }
  public async getAuctionBids(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ) {
    throw createError(ErrorEnum.RouteNotFound);
  }
}
