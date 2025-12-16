import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../db/client";
import { authMiddleware, requireRole } from "../../middleware/auth";

export const clientsRouter = Router();

clientsRouter.use(authMiddleware);

// List clients for firm
clientsRouter.get("/", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  const clients = await prisma.client.findMany({
    where: { firmId: req.user.firmId },
    select: {
      id: true,
      displayName: true,
      type: true,
      pan: true,
      gstin: true,
      cin: true,
      createdAt: true,
      primaryUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return res.json(clients);
});

// Get client details
clientsRouter.get("/:id", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  const client = await prisma.client.findFirst({
    where: { id: req.params.id, firmId: req.user.firmId },
    include: {
      primaryUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }

  return res.json(client);
});

// Create client (CA roles)
clientsRouter.post(
  "/",
  requireRole(["CA_ADMIN", "CA_STAFF"]),
  async (req, res): Promise<void> => {
    if (!req.user?.firmId) {
      res.status(400).json({ message: "Firm context required" });
      return;
    }

    const { displayName, type, pan, gstin, cin, contactName, contactEmail } =
      req.body as {
        displayName?: string;
        type?: string;
        pan?: string;
        gstin?: string;
        cin?: string;
        contactName?: string;
        contactEmail?: string;
      };

    if (!displayName || !type || !contactName || !contactEmail) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    try {
      // Generate a temporary password hash (client will reset password on first login)
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const txResult = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: contactName,
            email: contactEmail,
            passwordHash,
            role: "CLIENT",
            firmId: req.user!.firmId!,
          },
        });

        const client = await tx.client.create({
          data: {
            firmId: req.user!.firmId!,
            primaryUserId: user.id,
            type: type.toUpperCase() as any,
            pan,
            gstin,
            cin,
            displayName,
          },
        });

        return { user, client };
      });

      // Fetch the created client with relations for response
      const createdClient = await prisma.client.findFirst({
        where: { id: txResult.client.id, firmId: req.user!.firmId! },
        include: {
          primaryUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(201).json(createdClient);
    } catch (error: any) {
      console.error("Failed to create client:", error);
      
      // Handle duplicate email error
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        res.status(400).json({ message: "Email already exists" });
        return;
      }
      
      // Handle other Prisma errors
      if (error.code) {
        res.status(400).json({ message: `Database error: ${error.message || 'Failed to create client'}` });
        return;
      }
      
      res.status(500).json({ message: "Failed to create client" });
    }
  }
);

// Update client (CA roles)
clientsRouter.put(
  "/:id",
  requireRole(["CA_ADMIN", "CA_STAFF"]),
  async (req, res): Promise<void> => {
    if (!req.user?.firmId) {
      res.status(400).json({ message: "Firm context required" });
      return;
    }

    const {
      displayName,
      type,
      pan,
      gstin,
      cin,
      contactName,
      contactEmail,
    } = req.body as {
      displayName?: string;
      type?: string;
      pan?: string;
      gstin?: string;
      cin?: string;
      contactName?: string;
      contactEmail?: string;
    };

    try {
      const existing = await prisma.client.findFirst({
        where: { id: req.params.id, firmId: req.user.firmId },
        include: { primaryUser: true },
      });

      if (!existing) {
        res.status(404).json({ message: "Client not found" });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.client.update({
          where: { id: existing.id },
          data: {
            displayName: displayName ?? existing.displayName,
            type: type ? (type.toUpperCase() as any) : existing.type,
            pan: pan ?? existing.pan,
            gstin: gstin ?? existing.gstin,
            cin: cin ?? existing.cin,
          },
        });

        if (existing.primaryUser && (contactName || contactEmail)) {
          await tx.user.update({
            where: { id: existing.primaryUserId },
            data: {
              name: contactName ?? existing.primaryUser.name,
              email: contactEmail ?? existing.primaryUser.email,
            },
          });
        }
      });

      const updated = await prisma.client.findFirst({
        where: { id: req.params.id, firmId: req.user.firmId },
        include: {
          primaryUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to update client", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  }
);

