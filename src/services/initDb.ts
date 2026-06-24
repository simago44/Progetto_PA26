import { SequelizeConnection } from './sequelize.ts';

import '../models/relationships.ts';

export async function initDb() {
  const sequelize = SequelizeConnection.getInstance();
  await sequelize.sync({ force: true });
}
