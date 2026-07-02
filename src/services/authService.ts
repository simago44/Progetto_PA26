import { RoleName } from "../enums/enums.ts";
import { createAuth0Error, Errors } from "../factory/errorFactory.ts";
import { getAuthenticationToken } from "../integrations/auth0.ts";
import userRepository from "../repositories/userRepository.ts";

class AuthService {
  public async signup(username: string, password: string) {
    await userRepository.create(username, password, RoleName.BidParticipant);
  }

  public async login(username: string, password: string) {
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