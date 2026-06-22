import express, { type Request, type Response } from 'express';
import { Ship, Ping } from "./models/models.ts";
import { Op } from 'sequelize';
import authRoutes from "./routes/authRoutes.ts";

// Initialize Express app
const app = express();
const PORT = process.env.NODE_PORT || 3000;

// Middleware for parsing json bodies
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use("/auth", authRoutes)

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
