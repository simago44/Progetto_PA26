import type { NextFunction, Request, Response } from "express";
import { userCreatedSuccessfully_message } from "../factory/messageStrings.ts";
import authService from "../services/authService.ts";

export class AuthController {
  public async signup(_req: Request, res: Response, _next: NextFunction) {
    const username = res.locals.username as string;
    const password = res.locals.password as string;

    await authService.signup(username, password);

    res.json({ message: userCreatedSuccessfully_message });
  };

  public async login(_req: Request, res: Response, _next: NextFunction) {
    const username = res.locals.username as string;
    const password = res.locals.password as string;

    const authenticationToken = await authService.login(username, password);

    res.json({ access_token: authenticationToken });
  };
}
