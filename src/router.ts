import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
