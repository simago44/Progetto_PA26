import type { NextFunction, Request, Response } from "express"
import { AppError, createError, ErrorEnum, getErrorHTTPStatus } from "../factory/errorFactory.ts";
import userRepository from "../repositories/userRepository.ts";
import { getAuthenticationToken, RoleName } from "../services/auth0.ts";
import { userCreatedSuccessfully_message } from "../factory/messageStrings.ts";

/**
 * Parses an Auth0 error into an `AppError` with the appropriate HTTP status.
 * Falls back to a 500 InternalServer error if the error is unrecognized.
 * 
 * @param err - The error thrown by the Auth0 SDK
 */
function parseAuth0Error(err: any): AppError {
  if (err?.statusCode && err?.body?.message) {
    return new AppError(err.statusCode, err.body.message, err.constructor?.name);
  }

  if (err instanceof Error) {
    const statusCode = (err as any)?.statusCode || getErrorHTTPStatus(ErrorEnum.InternalServer);
    return new AppError(statusCode, err.message, err.name);
  }

  return createError(ErrorEnum.InternalServer);
}

export class AuthController {
  public async signup(req: Request, res: Response, next: NextFunction) {
    const username = req.body.username as string;
    const password = req.body.password as string;

    try {
      userRepository.save(username, password, RoleName.BidParticipant);
      res.json({ message: userCreatedSuccessfully_message });
    } catch (err) {
      next(parseAuth0Error(err))
    }
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
