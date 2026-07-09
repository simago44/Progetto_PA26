import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import authService from "../services/authService.ts";
import type { RoleName } from "../enums/enums.ts";

class AuthController {
  /**
   * Create an user from validated payload on `res.locals`.
   * 
   * 'res.locals' must contain:
   *  - `username`: the username of the user.
   *  - `password`: the password of the user.
   *  - `role`: the role of the user.
   * 
   * Returns `201 Created` with the ID of the created user.
   */
  public async signup(
    _req: Request,
    res: Response<unknown, { username: string, password: string, role: RoleName }>
  ) {
    const userId = await authService.signup(res.locals.username, res.locals.password, res.locals.role);
    res.status(StatusCodes.CREATED).json({ id: userId });
  };

  /**
   * Generate an access token for a user from validated payload on `res.locals`.
   * 
   * 'res.locals' must contain:
   *  - `username`: the username of the user.
   *  - `password`: the password of the user.
   * 
   * Returns `200 OK` with the ID of the logged user and the relative access token.
   */
  public async login(
    _req: Request,
    res: Response<unknown, { username: string, password: string }>
  ) {
    const { userId, accessToken } = await authService.login(res.locals.username, res.locals.password);
    res.status(StatusCodes.OK).json({ id: userId, accessToken });
  };
}

const authController = new AuthController();

export default authController;