import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();
app.use(express.json());
import responseHandler from "./middleware/responseHandler";
app.use(responseHandler);

app.get("/health", (req, res) => res.ok({ status: "ok" }));
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
