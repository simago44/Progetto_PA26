import env from "../core/config.ts";
import { User } from "../models/User.ts";
import { Auth0Roles, managementClient } from "../integrations/auth0.ts";
import { createSequelizeError } from "../factory/errorFactory.ts";
import redis from "../integrations/redis.ts";
import type { Transaction } from "sequelize";
import type { RoleName } from "../enums/enums.ts";

class UserRepository {
  /**
   * Builds the Redis key for a user by ID.
   * @param userId The user ID.
   * @returns The Redis key for the user ID.
   */
  private idKey(userId: string): string {
    return `user:id:${userId}`;
  }

  /**
   * Builds the Redis key for a user by username.
   * @param username The username.
   * @returns The Redis key for the username.
   */
  private usernameKey(username: string): string {
    return `user:username:${username}`;
  }

  /**
   * Stores a user in Redis using its ID and username keys.
   * @param user The User instance to cache.
   */
  private async cacheUser(user: User): Promise<void> {
    await Promise.all([
      redis.set(this.idKey(user.id), JSON.stringify(user)),
      redis.set(this.usernameKey(user.username), user.id),
    ]);
  }
  /**
   * Creates and persists a User from attributes.
   * @param userId The user ID.
   * @param username The username.
   * @param tokens The initial token balance.
   * @returns The created User instance.
   */
  public async create({ userId, username, tokens }: { userId: string, username: string, tokens: number | null }): Promise<User> {
    const user = await User.create({ id: userId, username, tokens });
    await this.cacheUser(user);
    return user;
  }
  
  /**
   * Creates a user in Auth0 and assigns a role.
   * @param username The username.
   * @param password The user password.
   * @param role The role to assign to the user.
   * @returns The Auth0 user ID.
   */
  public async createAuth0User(
    { username, password, role }: { username: string, password: string, role: RoleName; }
  ): Promise<string> {

    const user = await managementClient.users.create({
      connection: env.AUTH0_CONNECTION,
      username,
      password
    });
    const userId = user.user_id as string;
    await managementClient.users.roles.assign(userId, {
      roles: [Auth0Roles[role].id]
    });
    return userId;
  }

  /**
   * Finds a User by ID.
   * @param userId The user ID.
   * @returns The User instance if found, `null` otherwise.
   */
  public async findByPk(userId: string): Promise<User | null> {
    const cached = await redis.get(this.idKey(userId));
    if (cached) {
      const user = User.build(JSON.parse(cached));
      // necessary to save it without errors on unique id
      // we can't use build option isNewRecord because it erases createdAt and other fields 
      user.isNewRecord = false;
      return user;
    }

    const user = await User.findByPk(userId);
    if (user) await this.cacheUser(user);
    return user;

  }

  /**
   * Finds a User by username..
   * @param username The username.
   * @returns The User instance if found, `null` otherwise.
   */
  public async findByUsername(username: string): Promise<User | null> {
    const id = await redis.get(this.usernameKey(username));
    if (id) return this.findByPk(id);

    const user = await User.findOne({ where: { username } });
    if (user) await this.cacheUser(user);
    return user;
  }

  /**
   * Finds all users from the database.
   * @returns A list of all User instances.
   */
  public async findAll(): Promise<User[]> {
    return await User.findAll();
  }

  /**
   * Finds all user IDs from the database.
   * @returns A list of users containing only their IDs.
   */
  public async findAllIds(): Promise<User[]> {
    return await User.findAll({ attributes: ['id'] });
  }

  /**
   * Increments a user's token balance.
   * @param userId The user ID.
   * @param tokens The number of tokens to add.
   * @param transaction Optional Sequelize transaction.
   */
  public async incrementTokens(userId: string, tokens: number, transaction?: Transaction): Promise<void> {
    try {
      await User.increment("tokens", {
        by: tokens,
        where: { id: userId },
        transaction: transaction ?? null
      });
    } catch (err) {
      throw createSequelizeError(err, "incrementTokens");
    }

    // invalidate cache
    await redis.del(this.idKey(userId));
  }

  /**
   * Decrements a user's token balance.
   * @param userId The user ID.
   * @param tokens The number of tokens to remove.
   * @param transaction Optional Sequelize transaction.
   */
  public async decrementTokens(userId: string, tokens: number, transaction?: Transaction): Promise<void> {
    try {
      await User.decrement("tokens", {
        by: tokens,
        where: { id: userId },
        transaction: transaction ?? null
      });
    } catch (err) {
      throw createSequelizeError(err, "decrementTokens");
    }

    // invalidate cache
    await redis.del(this.idKey(userId));
  }

  /**
   * Deletes a User.
   * @param user The User instance to delete.
   */
  public async delete(user: User): Promise<void> {
    try {
      await user.destroy();
      await Promise.all([
        redis.del(this.idKey(user.id)),
        redis.del(this.usernameKey(user.username)),
      ]);
    } catch (err) {
      throw createSequelizeError(err, "deleteUser");
    }
  }
  
  /**
   * Deletes a user from Auth0.
   * @param userId The Auth0 user ID.
   */
  public async deleteFromAuth0(userId: string): Promise<void> {
    return await managementClient.users.delete(userId).catch(() => { });
  }
}

const userRepository = new UserRepository();

export default userRepository;