import env from "../config.ts";
import { User } from "../models/User.ts";
import { Auth0Roles, managementClient, RoleName } from "../services/auth0.ts";
import { Errors, parseAuth0Error, parseSequelizeError } from "../factory/errorFactory.ts";

class UserRepository {
  public async save(username: string, password: string, role: RoleName): Promise<User> {
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
      throw parseAuth0Error(err);
    }

    try {
      return await User.create({ id: user_id, username });
    } catch (err) {
      // Local save failed after the Auth0 user already exists — clean up
      // to avoid an orphaned Auth0 account with no matching local record.
      await managementClient.users.delete(user_id).catch(() => {});
      throw parseSequelizeError(err, "createUser");
    }
  }

  public async loadByPk(userId: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    return user;
  }

  public async loadByUsername(username: string): Promise<User> {
    const user = await User.findOne({ where: { username } });
    if (!user) throw new Errors.WrongCredentialsErrors();

    return user;
  }

  public async loadAll(): Promise<User[]> {
    return await User.findAll();
  }

  public async loadAllIds(): Promise<User[]> {
    return await User.findAll({ attributes: ['id'] });
  }

  public async update(user: User): Promise<User> {
    // TODO: validation
    // TODO: prevent username change

    return await user.save();
  }

  public async delete(user: User): Promise<void> {
    // TODO: delete from auth0
    await user.destroy();
  }
}

const userRepository = new UserRepository();

export default userRepository;