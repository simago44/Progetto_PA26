import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Association,
  ForeignKey
} from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.ts';
import type { User } from './User.ts';
import type { Bid } from './Bid.ts';
import { AuctionStatus, AuctionType, getAuctionStatus } from './AuctionUtils.ts';

export class Auction extends Model<
  InferAttributes<Auction, { omit: 'bids' }>,
  InferCreationAttributes<Auction, { omit: 'bids' }>
> {
  declare id: CreationOptional<number>;
  declare creatorId: ForeignKey<User['id']>;
  declare startAt: Date;
  declare endAt: CreationOptional<Date>;
  declare startPrice: number;
  declare type: AuctionType;
  declare minimumIncrement: CreationOptional<number>;
  declare decrementPrice: CreationOptional<number>;
  declare decrementTime: CreationOptional<number>;
  declare minimumPrice: CreationOptional<number>;
  declare winnerId: CreationOptional<ForeignKey<User['id']>>;
  declare finalPrice: CreationOptional<number>;

  declare bids?: NonAttribute<Bid[]>;

  declare static associations: {
    bids: Association<Auction, Bid>;
  };

  get status(): NonAttribute<AuctionStatus> { return getAuctionStatus(this) }
}

Auction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterNow(startAt: Date) {
          if (startAt <= new Date()) {
            throw new Error('startAt must be in the future');
          }
        },
        isBeforeEndAt(startAt: Date) {
          if (startAt >= this.endAt) {
            throw new Error('startAt must be before endAt');
          }
        },
      }
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStartAt(endAt: Date) {
          if (endAt <= this.startAt) {
            throw new Error('endAt must be after startAt');
          }
        },
      }
    },
    startPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(AuctionType)),
      allowNull: false
    },
    minimumIncrement: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1
      }
    },
    decrementPrice: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1
      }
    },
    decrementTime: {
      type: DataTypes.INTEGER,
      validate: {
        min: 60*1000 // 60 secondi
      }
    },
    minimumPrice: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0
      }
    },
    finalPrice: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1
      }
    }
  },
  {
    tableName: 'auctions',
    sequelize
  }
);
