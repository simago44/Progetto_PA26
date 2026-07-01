import type { NextFunction, Request, Response } from "express"
import userRepository from "../repositories/userRepository.ts";
import { getAuthenticationToken, RoleName } from "../services/auth0.ts";
import { userCreatedSuccessfully_message } from "../factory/messageStrings.ts";
import { parseAuth0Error } from "../factory/errorFactory.ts";

export class AuthController {
  public async signup(req: Request, res: Response, next: NextFunction) {
    const username = req.body.username as string;
    const password = req.body.password as string;

    await userRepository.save(username, password, RoleName.BidParticipant);
    res.json({ message: userCreatedSuccessfully_message });
  };

  public async login(req: Request, res: Response, next: NextFunction) {
    const username = req.body.username as string;
    const password = req.body.password as string;

    try {
      // check that username exists in db!
      await userRepository.loadByUsername(username);
      const authenticationToken = await getAuthenticationToken(username, password);

      res.json({ access_token: authenticationToken });
    } catch (err) {
      next(parseAuth0Error(err))
    }
  };
}
