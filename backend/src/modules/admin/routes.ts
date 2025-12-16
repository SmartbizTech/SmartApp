import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../db/client";
import { authMiddleware } from "../../middleware/auth";

export const adminRouter = Router();

// All admin routes require platform SUPER_ADMIN
adminRouter.use(authMiddleware);
adminRouter.use((req, res, next) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
});

// List all firms with their CA admins
adminRouter.get("/firms", async (_req, res) => {
  const firms = await prisma.firm.findMany({
    include: {
      users: {
        where: { role: "CA_ADMIN" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(firms);
});

// List users (CAs and contributors) in a firm with permissions
adminRouter.get("/firms/:firmId/users", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { firmId: req.params.firmId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      canViewClients: true,
      canEditClients: true,
      canAccessDocuments: true,
      canAccessTasks: true,
      canAccessCalendar: true,
      canAccessChat: true,
      createdAt: true,
    },
  });

  return res.json(users);
});

// Create a user (CA admin or CA staff) under a firm
adminRouter.post("/firms/:firmId/users", async (req, res) => {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: "CA_ADMIN" | "CA_STAFF";
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.params.firmId },
    });

    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        firmId: firm.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        canViewClients: true,
        canEditClients: true,
        canAccessDocuments: true,
        canAccessTasks: true,
        canAccessCalendar: true,
        canAccessChat: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Failed to create user under firm", error);
    return res.status(400).json({ message: "Failed to create user" });
  }
});

// Update permissions for a user (typically CA_STAFF contributor)
adminRouter.patch("/users/:id/permissions", async (req, res) => {
  const {
    canViewClients,
    canEditClients,
    canAccessDocuments,
    canAccessTasks,
    canAccessCalendar,
    canAccessChat,
  } = req.body as {
    canViewClients?: boolean;
    canEditClients?: boolean;
    canAccessDocuments?: boolean;
    canAccessTasks?: boolean;
    canAccessCalendar?: boolean;
    canAccessChat?: boolean;
  };

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        canViewClients,
        canEditClients,
        canAccessDocuments,
        canAccessTasks,
        canAccessCalendar,
        canAccessChat,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canViewClients: true,
        canEditClients: true,
        canAccessDocuments: true,
        canAccessTasks: true,
        canAccessCalendar: true,
        canAccessChat: true,
      },
    });

    return res.json(user);
  } catch (error) {
    console.error("Failed to update user permissions", error);
    return res.status(400).json({ message: "Failed to update permissions" });
  }
});

// Reset password for a user
adminRouter.patch("/users/:id/password", async (req, res) => {
  const { password } = req.body as { password?: string };

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to reset user password", error);
    return res.status(400).json({ message: "Failed to reset password" });
  }
});


