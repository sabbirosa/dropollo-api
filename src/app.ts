import cors from "cors";
import express, { Request, Response } from "express";

import { envVars } from "./app/config/env";
import router from "./app/routes";

const app = express();

app.use(express.json());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Dropollo API Server",
  });
});

export default app;
