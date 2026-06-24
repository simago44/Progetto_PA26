import type {
  Association,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { SequelizeConnection } from '../services/sequelize.ts'
import type { Bid } from './Bid.ts'

const sequelize = SequelizeConnection.getInstance();

const newUserTokens = 100;

export class User extends Model<
  InferAttributes<User, { omit: 'bids' }>,
  InferCreationAttributes<User, { omit: 'bids' }>
> {
  declare id: string;
  declare tokens: CreationOptional<number>;

  declare bids?: NonAttribute<Bid[]>;

  declare static associations: {
    bids: Association<User, Bid>;
  };
}

User.init(
  {
    id: {
      type: new DataTypes.STRING(128),
      primaryKey: true
    },
    tokens: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: newUserTokens
    }
  },
  {
    tableName: 'users',
    sequelize
  }
);
