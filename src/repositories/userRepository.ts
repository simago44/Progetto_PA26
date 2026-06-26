import env from "../config.ts";
import { User } from "../models/User.ts";
import { Auth0Roles, managementClient, RoleName } from "../services/auth0.ts";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";

const AUTH0_REALM = env.AUTH0_REALM;

class UserRepository {
  public async save(username: string, password: string, role: RoleName): Promise<User> {
    // TODO: validation
    // TODO: auth0
    //throw new ValidationError("a", []);

    const user = await managementClient.users.create({
      connection: AUTH0_REALM,
      username: username,
      password: password
    })

    const user_id = user.user_id as string;

    await managementClient.users.roles.assign(user_id, {
      roles: [Auth0Roles[role].id]
    });

    return await User.build({ id: "", username: username }).save();
  }

  public async loadByPk(userId: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error();

    return user;
  }

  public async loadByUsername(username: string): Promise<User> {
    const user = await User.findOne({ where: { username } });
    if (!user) throw createError(ErrorEnum.WrongCredentials);

    return user;
  }

  public async loadAll(): Promise<User[]> {
    return await User.findAll();
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