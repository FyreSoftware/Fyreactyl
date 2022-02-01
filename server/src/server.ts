import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import colors from "colors";

import { authRouter } from "./routes";
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

(async () => {
  try {
    const res = await mongoose.connect(process.env.MONGODB_URI ?? "", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    console.log(colors.green("[✓] Connected to Database."));
  } catch (err: any) {
    console.log(colors.red("[✗] Cannot connect to Databse."));
    console.log(colors.red(`    > ${err.message}`));
  }
})();

app.use(express.json());

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.clear();
  console.log(
    colors.green(`ready - started server on`),
    colors.blue(`http://localhost:${PORT}`)
  );
});
