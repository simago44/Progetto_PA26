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
  declare startPrice: number;
  declare type: AuctionType;
  declare description: string;
  declare minimumIncrement: CreationOptional<number | null>;
  declare decrementPrice: CreationOptional<number | null>;
  declare decrementInterval: CreationOptional<number | null>;
  declare minimumPrice: CreationOptional<number | null>;
  declare delayBeforeEnding: CreationOptional<number | null>;
  declare hasEnded: CreationOptional<boolean>;
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
        isAfterNow(startsAt: Date) {
          if (startsAt <= new Date()) {
            throw new Error("startsAt must be in the future");
          }
        },
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
    startPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
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
    minimumPrice: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },
    delayBeforeEnding: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },
    hasEnded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
