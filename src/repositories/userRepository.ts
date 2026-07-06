import env from "../core/config.ts";
import { User } from "../models/User.ts";
import { Auth0Roles, managementClient } from "../integrations/auth0.ts";
import { createSequelizeError } from "../factory/errorFactory.ts";
import redis from "../integrations/redis.ts";
import type { Transaction } from "sequelize";
import type { RoleName } from "../enums/enums.ts";

class UserRepository {
  private idKey(userId: string): string {
    return `user:id:${userId}`;
  }
  private usernameKey(username: string): string {
    return `user:username:${username}`;
  }

  private async cacheUser(user: User): Promise<void> {
    await Promise.all([
      redis.set(this.idKey(user.id), JSON.stringify(user)),
      redis.set(this.usernameKey(user.username), user.id),
    ]);
  }

  public async create({ userId, username, tokens }: { userId: string, username: string, tokens: number | null }): Promise<User> {
    const user = await User.create({ id: userId, username, tokens });
    await this.cacheUser(user);
    return user;
  }

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

  public async findByUsername(username: string): Promise<User | null> {
    const id = await redis.get(this.usernameKey(username));
    if (id) return this.findByPk(id);

    const user = await User.findOne({ where: { username } });
    if (user) await this.cacheUser(user);
    return user;
  }

  public async findAll(): Promise<User[]> {
    return await User.findAll();
  }

  public async findAllIds(): Promise<User[]> {
    return await User.findAll({ attributes: ['id'] });
  }

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

  public async deleteFromAuth0(userId: string): Promise<void> {
    return await managementClient.users.delete(userId).catch(() => { });
  }
}

const userRepository = new UserRepository();

export default userRepository;