import type { AuthenticationClient } from "auth0";
import { NewUserTokens, RoleName } from "../enums/enums.ts";
import { createAuth0Error, createSequelizeError, Errors } from "../factories/errorFactory.ts";
import type UserRepository from "../repositories/userRepository.ts";
import env from '../core/config.ts'
import type { ManagementClient } from "auth0";
import logger from "../core/logger.ts";

interface AuthServiceDeps {
  userRepository: UserRepository;
  managementClient: ManagementClient;
  authenticationClient: AuthenticationClient;
}

class AuthService {
  private userRepository: AuthServiceDeps["userRepository"];
  private managementClient: AuthServiceDeps["managementClient"];
  private authenticationClient: AuthServiceDeps["authenticationClient"];

  constructor({ userRepository, managementClient, authenticationClient }: AuthServiceDeps) {
    this.userRepository = userRepository;
    this.managementClient = managementClient;
    this.authenticationClient = authenticationClient;
  }

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
      userId = await this.userRepository.createAuth0User({ username, password, role });
    } catch (err) {
      throw createAuth0Error(err);
    }

    try {
      const user = await this.userRepository.create({ userId, username, tokens: NewUserTokens[role] });
      return user.id;
    } catch (err) {
      await this.userRepository.deleteFromAuth0(userId);
      throw createSequelizeError(err, "signup");
    }
  }

  /**
   * Get authentication token from auth0.
   * @param username The username of the new user.
   * @param password The user password.
   * @returns The user access token.
   */
  public async getAuthenticationToken(username: string, password: string): Promise<string> {
    const user = await this.authenticationClient.oauth.passwordGrant({
      realm: env.AUTH0_CONNECTION,
      audience: env.AUTH0_AUDIENCE,
      username,
      password
    });

    return user.data.access_token;
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
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new Errors.InvalidCredentials();

    try {
      const accessToken = await this.getAuthenticationToken(username, password);
      return { userId: user.id, accessToken };
    } catch (err) {
      throw createAuth0Error(err);
    }
  }

  /**
   * Delete users present in auth0 but not in the local database
   */
  public async deleteStaleUsers(): Promise<void> {
    let users = (await this.managementClient.users.list());

    const auth0Users = users.data;
    while (users.hasNextPage()) {
      users = await users.getNextPage();
      auth0Users.push(...users.data);
    }
    const dbUsers = await this.userRepository.findAllIds();

    const dbUserIds = new Set(dbUsers.map(user => user.id));

    for (const user of auth0Users) {
      if (!user.user_id) continue;

      // If the user doesn't belong to the app auth0 db connection
      if (!user.identities?.some(i => i.connection === env.AUTH0_CONNECTION)) continue;
      // If the user is actually present in the db
      if (dbUserIds.has(user.user_id)) continue;

      logger.info(`Deleting: ${user.user_id}`);
      await this.managementClient.users.delete(user.user_id);
    }
  }
}

export default AuthService;