import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { SequelizeConnection } from '../services/sequelize.ts';
import type { User } from './User.ts';
import type { Auction } from './Auction.ts';

const sequelize = SequelizeConnection.getInstance();

export class Bid extends Model<InferAttributes<Bid>, InferCreationAttributes<Bid>> {
  declare id: CreationOptional<number>;

  declare userId: ForeignKey<User['id']>;
  declare auctionId: ForeignKey<Auction['id']>;

  declare createdAt: CreationOptional<Date>;
  declare bidPrice: number;
}

Bid.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    createdAt: DataTypes.DATE,
    bidPrice: {
      type: DataTypes.INTEGER.UNSIGNED
    }
  },
  {
    tableName: 'bids',
    sequelize
  }
);
