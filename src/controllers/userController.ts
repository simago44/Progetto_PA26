import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import userRepository from "../repositories/userRepository.ts";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";

export class UserController {
  /** Gets the auctions filtered by status
   * If the status code is not present in query params it returns all the auctions
   * Example URL: /auctions?status=0
   */
  public async getWallet(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id as string;
    try {
      const user = userRepository.loadByPk(id);
      const tokens = (await user).tokens;
      res.status(StatusCodes.OK).json({ tokens });
    } catch {
      next(createError(ErrorEnum.UserNotFound))
    }
  }
}