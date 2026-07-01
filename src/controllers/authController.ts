import type { NextFunction, Request, Response } from "express";
import userRepository from "../repositories/userRepository.ts";
import { getAuthenticationToken, RoleName } from "../integrations/auth0.ts";
import { userCreatedSuccessfully_message } from "../factory/messageStrings.ts";
import { createAuth0Error, Errors } from "../factory/errorFactory.ts";

export class AuthController {
  public async signup(_req: Request, res: Response, _next: NextFunction) {
    const username = res.locals.username as string;
    const password = res.locals.password as string;

    await userRepository.create(username, password, RoleName.BidParticipant);
    res.json({ message: userCreatedSuccessfully_message });
  };

  public async login(_req: Request, res: Response, _next: NextFunction) {
    const username = res.locals.username as string;
    const password = res.locals.password as string;

    // check that username exists in db!
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Errors.WrongCredentialsErrors();

    try {
      const authenticationToken = await getAuthenticationToken(username, password);

      res.json({ access_token: authenticationToken });
    } catch (err) {
      throw createAuth0Error(err);
    }
  };
}
