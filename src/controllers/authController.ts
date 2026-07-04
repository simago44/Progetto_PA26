import type { Request, Response } from "express";
import authService from "../services/authService.ts";
import { StatusCodes } from "http-status-codes";
import { SuccessMesages } from "../factory/messageStrings.ts";

class AuthController {
  public async signup(_req: Request, res: Response) {
    const username = res.locals.username as string;
    const password = res.locals.password as string;

    const userId = await authService.signup(username, password);

    res.status(StatusCodes.CREATED).json({ message: SuccessMesages.UserCreatedSyccessfully({ userId }) });
  };

  public async login(_req: Request, res: Response) {
    const username = res.locals.username as string;
    const password = res.locals.password as string;

    const { userId, accessToken } = await authService.login(username, password);

    res.status(StatusCodes.OK).json({ userId, accessToken });
  };
}

const authController = new AuthController();

export default authController;