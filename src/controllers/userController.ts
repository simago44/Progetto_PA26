import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import userRepository from "../repositories/userRepository.ts";
import { walletUpdatedSuccessfully_message } from "../factory/messageStrings.ts";

export class UserController {
  public async getWallet(req: Request, res: Response, next: NextFunction) {
    const id = req.params.userId as string;
    const user = await userRepository.loadByPk(id);
    const tokens = user.tokens;

    res.status(StatusCodes.OK).json({ tokens });
  }

  public async topUpWallet(req: Request, res: Response, next: NextFunction) {
    const id = req.params.userId as string;
    const tokens = req.body.tokens as number;

    const user = await userRepository.loadByPk(id);
    user.tokens += tokens;
    await userRepository.update(user);

    res.status(StatusCodes.OK).json({ message: walletUpdatedSuccessfully_message });
  }
}