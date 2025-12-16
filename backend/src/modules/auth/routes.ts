import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/client";
import { loadEnv } from "../../config/env";
import { authMiddleware } from "../../middleware/auth";

const env = loadEnv();
export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { client: true, firm: true },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ userId: user.id }, env.jwtSecret, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ userId: user.id }, env.jwtRefreshSecret, {
    expiresIn: "7d",
  });

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
      clientId: user.client?.id ?? null,
      firmName: user.firm?.name ?? null,
    },
  });
});

// Get current user
authRouter.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { client: true, firm: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    firmId: user.firmId,
    clientId: user.client?.id ?? null,
    firmName: user.firm?.name ?? null,
  });
});
