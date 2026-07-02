import { createAuth0Error, Errors } from "../factory/errorFactory.ts";
import { getAuthenticationToken, RoleName } from "../integrations/auth0.ts";
import userRepository from "../repositories/userRepository.ts";

class AuthService {
  public async signup(username: string, password: string) {
    await userRepository.create(username, password, RoleName.BidParticipant);
  };

  public async login(username: string, password: string) {
    // check that username exists in db!
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Errors.WrongCredentialsErrors();

    try {
      return await getAuthenticationToken(username, password);
    } catch (err) {
      throw createAuth0Error(err);
    }
  };
}

const authService = new AuthService();

export default authService;