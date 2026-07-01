import type {
  Association,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../integrations/sequelize.ts';
import type { Bid } from './Bid.ts';
import type { Auction } from './Auction.ts';

const newUserTokens = 100;

export class User extends Model<
  InferAttributes<User, { omit: 'bids' | 'auctions'; }>,
  InferCreationAttributes<User, { omit: 'bids' | 'auctions'; }>

> {
  declare id: string;
  declare tokens: CreationOptional<number>;
  declare username: string;

  declare bids?: NonAttribute<Bid[]>;
  declare auctions?: NonAttribute<Auction[]>;

  declare static associations: {
    bids: Association<User, Bid>;
    auctions: Association<User, Auction>;
  };

}

User.init(
  {
    id: {
      type: new DataTypes.STRING(128),
      primaryKey: true
    },
    tokens: {
      type: DataTypes.INTEGER,
      defaultValue: newUserTokens
    },
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    }
  },
  {
    tableName: 'users',
    sequelize
  }
);
