import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import {
  auth,
  adminUsers,
  dailyActivities,
  houses,
  customers,
  sales,
  feedRecipes,
  ingredients,
  feedBatches,
} from "./routes";
import { responseHandler, errorHandler } from "./middleware";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// attach response helpers early so middleware/routes can use res.ok/res.fail
app.use(responseHandler);

app.get("/api/health", (_req, res) => res.ok({ status: "ok" }));

app.use("/api/auth", auth);
app.use("/api/daily-activities", dailyActivities);
app.use("/api/houses", houses);
app.use("/api/customers", customers);
app.use("/api/sales", sales);
app.use("/api/feed-recipes", feedRecipes);
app.use("/api/ingredients", ingredients);
app.use("/api/feed-batches", feedBatches);
app.use("/api/admin/users", adminUsers);

// error handler should be last
app.use(errorHandler);

export default app;
