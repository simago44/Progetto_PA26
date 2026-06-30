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
import sequelize from "../services/sequelize.ts";
import type { User } from "./User.ts";
import type { Bid } from "./Bid.ts";
import { getAuctionStatus, getMsToEnd } from "./AuctionUtils.ts";

export const AuctionType = {
  English: "english",
  Dutch: "dutch",
  FirstPrice: "first-price",
  SecondPrice: "second-price",
} as const;
export type AuctionType = (typeof AuctionType)[keyof typeof AuctionType];

export const AuctionStatus = {
  NotStarted: 0,
  InProgress: 1,
  Ended: 2,
} as const;
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];

const defaultDelayBeforeEnding = 5;

export class Auction extends Model<
  InferAttributes<Auction, { omit: "bids"; }>,
  InferCreationAttributes<Auction, { omit: "bids"; }>
> {
  declare id: CreationOptional<number>;
  declare creatorId: ForeignKey<User["id"]>;
  declare startAt: Date;
  declare endAt: CreationOptional<Date>;
  declare startPrice: number;
  declare type: AuctionType;
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
    return getAuctionStatus(this);
  }
  //get msToEnd(): NonAttribute<number> { return getMsToEnd(this); }
}

Auction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterNow(startAt: Date) {
          if (startAt <= new Date()) {
            throw new Error("startAt must be in the future");
          }
        },
        isBeforeEndAt(this: Auction, startAt: Date) {
          if (startAt >= this.endAt) {
            throw new Error("startAt must be before endAt");
          }
        },
      },
    },
    endAt: {
      type: DataTypes.DATE,
      validate: {
        isAfterStartAt(this: Auction, endAt: Date) {
          if (endAt <= this.startAt) {
            throw new Error("endAt must be after startAt");
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
