import { NewUserTokens, RoleName } from "../enums/enums.ts";
import { createAuth0Error, createSequelizeError, Errors } from "../factory/errorFactory.ts";
import { getAuthenticationToken } from "../integrations/auth0.ts";
import userRepository from "../repositories/userRepository.ts";

class AuthService {
  /**
   * Registers a new user in Auth0 and the application database.
   * @param username The username of the new user.
   * @param password The user password.
   * @param role The user role.
   * @returns The ID of the created user.
   * @throws {AppError} If the user cannot be created in Auth0 or in the database.
   */
  public async signup(username: string, password: string, role: RoleName): Promise<string> {
    let userId: string;
    try {
      userId = await userRepository.createAuth0User({ username, password, role });
    } catch (err) {
      throw createAuth0Error(err);
    }

    try {
      const user = await userRepository.create({ userId, username, tokens: NewUserTokens[role] });
      return user.id;
    } catch (err) {
      await userRepository.deleteFromAuth0(userId);
      throw createSequelizeError(err, "signup");
    }
  }

  /**
   * Authenticates a user and retrieves an access token.
   * @param username The username of the user.
   * @param password The user password.
   * @returns The user ID and authentication access token.
   * @throws {WrongCredentialsError} If the username does not exist.
   * @throws {AppError} If the user cannot be created in Auth0 or in the database.
   */
  public async login(username: string, password: string): Promise<{ userId: string; accessToken: string; }> {
    // check that username exists in db!
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Errors.WrongCredentialsErrors();

    try {
      const accessToken = await getAuthenticationToken(username, password);
      return { userId: user.id, accessToken };
    } catch (err) {
      throw createAuth0Error(err);
    }
  };
}

const authService = new AuthService();

export default authService;