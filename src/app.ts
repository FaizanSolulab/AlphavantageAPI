import express, { Application, Request, Response, NextFunction } from "express";
import {  getStocks } from "./controllers/stocks";
import { registerUser, verifyOtp } from "./controllers/auth";
import connectDb from "./config/dbonnection";
import { verifyTokenAndAuthorization } from "./middleware/validateTokenHandler";

const app: Application = express();
const port: number | string = process.env.PORT || 5000;

/**Connect to Mongo */
connectDb();

app.use(express.json());

app.use("/api/v1/auth/register", registerUser);
app.use("/api/v1/auth", verifyOtp);
app.use("/api/v1/stocks", verifyTokenAndAuthorization, getStocks);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log(`Server runnning on port ${port}`);
  console.log(`Listening at http://localhost:${port}`);
});


