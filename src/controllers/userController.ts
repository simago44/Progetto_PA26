import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import userRepository from "../repositories/userRepository.ts";
import { walletUpdatedSuccessfully_message } from "../factory/messageStrings.ts";
import { Errors } from "../factory/errorFactory.ts";
import bidService from "../services/bidService.ts";

export class UserController {
  public async getWallet(_req: Request, res: Response, _next: NextFunction) {
    const userId = res.locals.userId as string;

    const user = await userRepository.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    const tokens = await bidService.getRealUserTokens(user);

    res.status(StatusCodes.OK).json({ tokens });
  }

  public async topUpWallet(_req: Request, res: Response, next: NextFunction) {
    const userId = res.locals.userId as string;
    const tokens = res.locals.tokens as number;

    const user = await userRepository.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    await userRepository.incrementTokens(userId, tokens);

    res.status(StatusCodes.OK).json({ message: walletUpdatedSuccessfully_message });
  }
}