import express, { type Request, type Response, type NextFunction } from 'express';
import { SequelizeConnection } from "./services/sequelize.ts";
import { Ship, Ping } from "./models/models.ts";
import { Op } from 'sequelize';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Initialize sequelize connection and set singleton instance
 */
let sequelize = SequelizeConnection.getInstance();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const main = async () => {
  //await sequelize.sync()
  // Trova una nave e i suoi pings
  const nave = await Ship.findOne({
    where: { mmsi: 247112304 }
  });
  console.log(nave ? nave.toJSON() : "nothing...");

  const navi = await Ship.findAll();
  console.log(navi ? "something..." : "nothing...");

  // Trova un ping e la nave associata
  const ping = await Ping.findOne({
    include: Ship
  });
  console.log(ping?.toJSON());

  const ships = await Ship.findAll({
    where: {
      length: { 
        [Op.gt]: 100
      }
    }
  }
  );
  ships.map(item => console.log(item.toJSON()));
}

main();
