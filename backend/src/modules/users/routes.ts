import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../db/client";
import { authMiddleware, requireRole } from "../../middleware/auth";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

// List users by role within firm
usersRouter.get("/", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }
  const { role } = req.query;

  const whereClause: { firmId: string; role?: string } = {
    firmId: req.user.firmId,
  };
  if (role) {
    whereClause.role = String(role).toUpperCase();
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      canViewClients: true,
      canEditClients: true,
      canAccessDocuments: true,
      canAccessTasks: true,
      canAccessCalendar: true,
      canAccessChat: true,
    },
  });

  return res.json(users);
});

// Create staff or client user (CA admin only)
usersRouter.post(
  "/",
  requireRole(["CA_ADMIN"]),
  async (req, res): Promise<void> => {
    if (!req.user?.firmId) {
      res.status(400).json({ message: "Firm context required" });
      return;
    }

    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role.toUpperCase() as any,
          firmId: req.user.firmId,
        },
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      res.status(400).json({ message: "Failed to create user" });
    }
  }
);

// Update permissions for a user within firm (CA admin)
usersRouter.patch(
  "/:id/permissions",
  requireRole(["CA_ADMIN"]),
  async (req, res): Promise<void> => {
    if (!req.user?.firmId) {
      res.status(400).json({ message: "Firm context required" });
      return;
    }

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
      // ensure user belongs to same firm
      const target = await prisma.user.findFirst({
        where: { id: req.params.id, firmId: req.user.firmId },
      });

      if (!target) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const updateData: {
        canViewClients?: boolean;
        canEditClients?: boolean;
        canAccessDocuments?: boolean;
        canAccessTasks?: boolean;
        canAccessCalendar?: boolean;
        canAccessChat?: boolean;
      } = {};
      
      if (canViewClients !== undefined) updateData.canViewClients = canViewClients;
      if (canEditClients !== undefined) updateData.canEditClients = canEditClients;
      if (canAccessDocuments !== undefined) updateData.canAccessDocuments = canAccessDocuments;
      if (canAccessTasks !== undefined) updateData.canAccessTasks = canAccessTasks;
      if (canAccessCalendar !== undefined) updateData.canAccessCalendar = canAccessCalendar;
      if (canAccessChat !== undefined) updateData.canAccessChat = canAccessChat;

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          canViewClients: true,
          canEditClients: true,
          canAccessDocuments: true,
          canAccessTasks: true,
          canAccessCalendar: true,
          canAccessChat: true,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to update staff permissions", error);
      res.status(400).json({ message: "Failed to update permissions" });
    }
  }
);


