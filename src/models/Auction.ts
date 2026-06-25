import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Association,
  ForeignKey
} from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { SequelizeConnection } from '../services/sequelize.ts';
import type { User } from './User.ts';
import type { Bid } from './Bid.ts';
import { AuctionStatus, AuctionType, getAuctionStatus } from './AuctionUtils.ts';

const sequelize = SequelizeConnection.getInstance();

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

  declare bids?: NonAttribute<Bid[]>;

  declare static associations: {
    bids: Association<Auction, Bid>;
  };

  get status(): NonAttribute<AuctionStatus> { return getAuctionStatus(this) }
}

Auction.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    startAt: DataTypes.DATE,
    endAt: DataTypes.DATE,
    startPrice: {
      type: DataTypes.INTEGER.UNSIGNED
    },
    type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    minimumIncrement: {
      type: DataTypes.INTEGER.UNSIGNED
    },
    decrementPrice: {
      type: DataTypes.INTEGER.UNSIGNED
    },
    decrementTime: {
      type: DataTypes.INTEGER.UNSIGNED
    },
    minimumPrice: {
      type: DataTypes.INTEGER.UNSIGNED
    }
  },
  {
    tableName: 'auctions',
    sequelize
  }
);
