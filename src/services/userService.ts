import { Errors } from "../factory/errorFactory.ts";
import userRepository from "../repositories/userRepository.ts";
import bidService from "./bidService.ts";

class UserService {
  public async getWallet(userId: string) {
    const user = await userRepository.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    return await bidService.getRealUserTokens(user);
  }

  public async topUpWallet(userId: string, tokens: number) {
    const user = await userRepository.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    await userRepository.incrementTokens(userId, tokens);
  }
}

const userService = new UserService();

export default userService;