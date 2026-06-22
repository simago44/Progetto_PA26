import express, { type Request, type Response } from 'express';
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
