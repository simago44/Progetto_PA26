import { createContainer, asClass, asValue, InjectionMode } from "awilix";
import sequelize from "../integrations/sequelize.ts";
import redis from "../integrations/redis.ts";
import { authenticationClient, managementClient } from "../integrations/auth0.ts";

import UserRepository from "../repositories/userRepository.ts";
import AuctionRepository from "../repositories/auctionRepository.ts";
import BidRepository from "../repositories/bidRepository.ts";
import AuthService from "../services/authService.ts";
import AuctionService from "../services/auctionService.ts";
import UserController from "../controllers/userController.ts";
import BidService from "../services/bidService.ts";
import UserService from "../services/userService.ts";
import AuctionController from "../controllers/auctionController.ts";
import AuthController from "../controllers/authController.ts";
import BidController from "../controllers/bidController.ts";

const container = createContainer({ injectionMode: InjectionMode.PROXY });

container.register({
  // external I/O values registered as-is, not constructed
  sequelize: asValue(sequelize),
  redis: asValue(redis),
  managementClient: asValue(managementClient),
  authenticationClient: asValue(authenticationClient),

  // repositories
  auctionRepository: asClass(AuctionRepository).singleton(),
  bidRepository: asClass(BidRepository).singleton(),
  userRepository: asClass(UserRepository).singleton(),

  // services
  auctionService: asClass(AuctionService).singleton(),
  authService: asClass(AuthService).singleton(),
  bidService: asClass(BidService).singleton(),
  userService: asClass(UserService).singleton(),

  // controllers
  auctionController: asClass(AuctionController).singleton(),
  authController: asClass(AuthController).singleton(),
  bidController: asClass(BidController).singleton(),
  userController: asClass(UserController).singleton()
});

export default container;