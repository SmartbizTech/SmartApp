import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import { loadEnv } from "./config/env";
import { authRouter } from "./modules/auth/routes";
import { usersRouter } from "./modules/users/routes";
import { clientsRouter } from "./modules/clients/routes";
import { dashboardRouter } from "./modules/dashboard/routes";
import { documentsRouter } from "./modules/documents/routes";
import { chatRouter } from "./modules/chat/routes";
import { tasksRouter } from "./modules/tasks/routes";
import { calendarRouter } from "./modules/calendar/routes";
import { notificationsRouter } from "./modules/notifications/routes";
import { adminRouter } from "./modules/admin/routes";

const env = loadEnv();
const app = express();

// ensure upload directory exists
if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);

export default app;
