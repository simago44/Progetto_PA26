import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type UserService from "../services/userService.ts";

interface UserControllerDeps {
  userService: UserService;
}

class UserController {
  private userService: UserControllerDeps["userService"];

  constructor({ userService }: UserControllerDeps) {
    this.userService = userService;
  }
  
  /**
   * Get tokens for the user specified in the validated payload on `res.locals`.
   * 
   * `res.locals.userId` is ID of the auction whose bids must be retrieved.
   * 
   * Returns `200 OK` with the user's tokens.
   */
  public getWallet = async (
    _req: Request,
    res: Response<unknown, { userId: string }>
  ) => {
    const tokens = await this.userService.getWallet(res.locals.userId);
    res.status(StatusCodes.OK).json({ tokens });
  }

  /**
   * Get user auction report using the filters specified in the validated payload on `res.locals`.
   * 
   * `res.locals.filters` is the object containing the filters applied to the search.
   * 
   * The auctions can be filtered by:
   *  - `participantId`: the user's ID whose bids are being retrieved;
   *  - `won`: if the participantId won or not the auction;
   *  - `fromDate`: auction's start date;
   *  - `toDate`: auction's end date.
   * 
   * Returns `200 OK` with the list of auctions the user participated to.
   */
  public getAuctionsReport = async (
    _req: Request,
    res: Response<unknown, { filters: { participantId: string, won: boolean, fromDate: Date, toDate: Date } }>
  ) => {
    const auctions = await this.userService.getAuctionReport(res.locals.filters);
    res.status(StatusCodes.OK).json(auctions);
  }

  /**
   * Get user wallet report using the filters specified in the validated payload on `res.locals`.
   * 
   * Only won auctions will be considered in the report.
   * 
   * `res.locals.filters` is the object containing the filters applied to the search.
   * 
   * The auctions can be filtered by:
   *  - `participantId`: the user's ID whose bids are being retrieved;
   *  - `fromDate`: auction's start date;
   *  - `toDate`: auction's end date.
   * 
   * Returns `200 OK` with the total spending in the date interval.
   */
  public getWalletReport = async (
    _req: Request,
    res: Response<unknown, { filters: { participantId: string, fromDate: Date, toDate: Date } }>
  ) => {
    const userSpending = await this.userService.getWalletReport(res.locals.filters);
    res.status(StatusCodes.OK).json({ total: userSpending });
  }

  /**
   * Top up the wallet of the user specified in the validated payload on `res.locals`.
   * 
   * 'res.locals' must contain:
   *  - `userId`: is the ID of the user whose wallet is being topped up.
   *  - `tokens`: the number of tokens being added to the wallet.
   * 
   * Returns `200 OK`.
   */
  public topUpWallet = async (
    _req: Request,
    res: Response<unknown, { userId: string, tokens: number }>
  ) => {
    await this.userService.topUpWallet(res.locals.userId, res.locals.tokens);
    res.status(StatusCodes.OK).json({});
  }
}

export default UserController;