import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { walletUpdatedSuccessfully_message } from "../factory/messageStrings.ts";
import userService from "../services/userService.ts";
import auctionService from "../services/auctionService.ts";

class UserController {
  public async getWallet(_req: Request, res: Response, _next: NextFunction) {
    const userId = res.locals.userId as string;

    const tokens = await userService.getWallet(userId);

    res.status(StatusCodes.OK).json({ tokens });
  }

  public async topUpWallet(_req: Request, res: Response, next: NextFunction) {
    const userId = res.locals.userId as string;
    const tokens = res.locals.tokens as number;

    await userService.topUpWallet(userId, tokens);

    res.status(StatusCodes.OK).json({ message: walletUpdatedSuccessfully_message });
  }

  public async getAuctionsReport(_req: Request, res: Response, _next: NextFunction) {
    const filters = res.locals.filters;
    filters.participantId = res.locals.userId;

    const report = await auctionService.getAuctionReport(filters);
    res.status(StatusCodes.OK).json(report);
  }

  public async getWalletReport(_req: Request, res: Response, next: NextFunction) {
    // TODO
  }
}

const userController = new UserController();

export default userController;