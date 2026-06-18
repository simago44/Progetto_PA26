import { DataTypes } from 'sequelize';
import { SequelizeConnection } from "../services/sequelize.ts";

const sequelize = SequelizeConnection.getInstance();

export const Ship = sequelize.define('Ship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  short_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  length: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  mmsi: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'ships',
  timestamps: false
});

export const Ping = sequelize.define('Ping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  lat: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  lon: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  mmsi: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  tableName: 'pings',
  timestamps: false,
});

Ship.hasMany(Ping, { foreignKey: 'mmsi', sourceKey: 'mmsi' });
Ping.belongsTo(Ship, { foreignKey: 'mmsi', targetKey: 'mmsi' });
