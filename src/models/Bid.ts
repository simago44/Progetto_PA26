import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../integrations/sequelize.ts';
import type { User } from './User.ts';
import type { Auction } from './Auction.ts';

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
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bidPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    }
  },
  {
    tableName: 'bids',
    sequelize
  }
);
