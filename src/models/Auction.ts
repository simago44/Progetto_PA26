import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Association,
  ForeignKey,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyCreateAssociationMixin,
} from "sequelize";
import { DataTypes, Model } from "sequelize";
import sequelize from "../integrations/sequelize.ts";
import type { User } from "./User.ts";
import type { Bid } from "./Bid.ts";
import service from "../services/auctionService.ts";

export const AuctionType = {
  English: "english",
  Dutch: "dutch",
  FirstPrice: "first-price",
  SecondPrice: "second-price",
} as const;
export type AuctionType = (typeof AuctionType)[keyof typeof AuctionType];

export const AuctionStatus = {
  NotStarted: "not-started",
  InProgress: "in-progress",
  Ended: "ended",
} as const;
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];

const defaultDelayBeforeEnding = 5;
export const descriptionMinLenght = 10;
export const descriptionMaxLenght = 1023;

export class Auction extends Model<
  InferAttributes<Auction, { omit: "bids"; }>,
  InferCreationAttributes<Auction, { omit: "bids"; }>
> {
  declare id: CreationOptional<number>;
  declare creatorId: ForeignKey<User["id"]>;
  declare startsAt: Date;
  declare endsAt: CreationOptional<Date>;
  declare startPrice: number;
  declare type: AuctionType;
  declare description: string;
  declare minimumIncrement: CreationOptional<number>;
  declare decrementPrice: CreationOptional<number>;
  declare decrementInterval: CreationOptional<number>;
  declare minimumPrice: CreationOptional<number>;
  declare delayBeforeEnding: CreationOptional<number>;
  declare hasEnded: CreationOptional<boolean>;
  declare winnerId: CreationOptional<ForeignKey<User["id"]>>;
  declare finalPrice: CreationOptional<number>;

  declare getBids: HasManyGetAssociationsMixin<Bid>;
  declare addBid: HasManyAddAssociationMixin<Bid, number>;
  declare createBid: HasManyCreateAssociationMixin<Bid>;

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
          if (startsAt >= this.endsAt) {
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
        len: [descriptionMinLenght, descriptionMaxLenght],
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
        min: 60 * 1000, // 60 secondi
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
      defaultValue: defaultDelayBeforeEnding,
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
