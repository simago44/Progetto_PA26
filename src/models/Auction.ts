import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Association,
  ForeignKey,
} from "sequelize";
import { DataTypes, Model } from "sequelize";
import sequelize from "../integrations/sequelize.ts";
import type { User } from "./User.ts";
import type { Bid } from "./Bid.ts";
import service from "../services/auctionService.ts";
import { SECONDS } from "../utils/dateUtils.ts";
import { AuctionType, type AuctionStatus } from "../enums/enums.ts";
import { AuctionConstants } from "../constants/constants.ts";

export class Auction extends Model<
  InferAttributes<Auction, { omit: "bids"; }>,
  InferCreationAttributes<Auction, { omit: "bids"; }>
> {
  declare id: CreationOptional<number>;
  declare creatorId: ForeignKey<User["id"]>;
  declare startsAt: Date;
  declare endsAt: CreationOptional<Date | null>;
  declare reservePrice: number;
  declare type: AuctionType;
  declare description: string;
  declare minimumIncrement: CreationOptional<number | null>;
  declare decrementPrice: CreationOptional<number | null>;
  declare decrementInterval: CreationOptional<number | null>;
  declare startPrice: CreationOptional<number | null>;
  declare delayBeforeEnding: CreationOptional<number | null>;
  declare endedAt: CreationOptional<Date | null>;
  declare winnerId: CreationOptional<ForeignKey<User["id"]> | null>;
  declare finalPrice: CreationOptional<number | null>;

  declare bids?: NonAttribute<Bid[]>;

  declare static associations: {
    bids: Association<Auction, Bid>;
  };

  get status(): NonAttribute<AuctionStatus> {
    return service.getAuctionStatus(this);
  }
}

Auction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isBeforeendsAt(this: Auction, startsAt: Date) {
          if (this.endsAt && startsAt >= this.endsAt) {
            throw new Error("startsAt must be before endsAt");
          }
        },
      },
    },
    endsAt: {
      type: DataTypes.DATE,
      validate: {
        isAfterstartsAt(this: Auction, endsAt: Date) {
          if (endsAt <= this.startsAt) {
            throw new Error("endsAt must be after startsAt");
          }
        },
      },
    },
    reservePrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: AuctionConstants.minReservePrice,
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(AuctionType)),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [AuctionConstants.descriptionMinLenght, AuctionConstants.descriptionMaxLenght],
      },
    },
    minimumIncrement: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
      },
    },
    decrementPrice: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
      },
    },
    decrementInterval: {
      type: DataTypes.INTEGER,
      validate: {
        min: 60 * SECONDS,
      },
    },
    startPrice: {
      type: DataTypes.INTEGER,
      validate: {
        higherThanReservePrice(this: Auction, startPrice: number) {
          if (startPrice <= this.reservePrice) {
            throw new Error("startPrice must be higher than the reservePrice");
          }
        },
      },
    },
    delayBeforeEnding: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },
    endedAt: {
      type: DataTypes.DATE,
    },
    finalPrice: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
      },
    },
  },
  {
    tableName: "auctions",
    sequelize,
  },
);
