import env from "../config.ts";
import { User } from "../models/User.ts";
import { Auth0Roles, managementClient, RoleName } from "../integrations/auth0.ts";
import { Errors, createAuth0Error, createSequelizeError } from "../factory/errorFactory.ts";

class UserRepository {
  public async create(username: string, password: string, role: RoleName): Promise<User> {
    let user_id: string;

    try {
      const user = await managementClient.users.create({
        connection: env.AUTH0_CONNECTION,
        username,
        password
      });
      user_id = user.user_id as string;
      await managementClient.users.roles.assign(user_id, {
        roles: [Auth0Roles[role].id]
      });
    } catch (err) {
      throw createAuth0Error(err);
    }

    try {
      return await User.create({ id: user_id, username });
    } catch (err) {
      // Local save failed after the Auth0 user already exists — clean up
      // to avoid an orphaned Auth0 account with no matching local record.
      await managementClient.users.delete(user_id).catch(() => { });
      throw createSequelizeError(err, "createUser");
    }
  }

  public async findByPk(userId: string): Promise<User|null> {
    return await User.findByPk(userId);
  }

  public async findByUsername(username: string): Promise<User|null> {
    return await User.findOne({ where: { username } });
  }

  public async findAll(): Promise<User[]> {
    return await User.findAll();
  }

  public async findAllIds(): Promise<User[]> {
    return await User.findAll({ attributes: ['id'] });
  }

  public async update(user: User): Promise<User> {
    // TODO: prevent username change

    try {
      return await user.save();
    } catch (err) {
      throw createSequelizeError(err, "updateUser");
    }
  }

  public async delete(user: User): Promise<void> {
    try {
      await user.destroy();
    } catch (err) {
      throw createSequelizeError(err, "deleteUser");
    }
  }
}

const userRepository = new UserRepository();

export default userRepository;