import { RoleName } from "../enums/enums.ts";
import { createAuth0Error, createSequelizeError, Errors } from "../factory/errorFactory.ts";
import { getAuthenticationToken } from "../integrations/auth0.ts";
import userRepository from "../repositories/userRepository.ts";

class AuthService {
  public async signup(username: string, password: string): Promise<string> {
    let userId: string;
    try {
      userId = await userRepository.createAuth0User({ username, password, role: RoleName.BidParticipant });
    } catch (err) {
      throw createAuth0Error(err);
    }

    try {
      const user = await userRepository.create({ userId, username, role: RoleName.BidParticipant });
      return user.id;
    } catch (err) {
      await userRepository.deleteFromAuth0(userId);
      throw createSequelizeError(err, "signup");
    }
  }

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