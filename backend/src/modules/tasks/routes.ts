import { Router } from "express";
import { prisma } from "../../db/client";
import { authMiddleware, requireRole } from "../../middleware/auth";

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);

// List compliance tasks
tasksRouter.get("/", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { status, clientId } = req.query;

    const where: any = {
      firmId: req.user.firmId,
    };

    if (req.user.role === "CLIENT" && req.user.clientId) {
      where.clientId = req.user.clientId;
    } else if (clientId) {
      where.clientId = String(clientId);
    }

    if (status) {
      where.status = String(status);
    }

    const tasks = await prisma.complianceTask.findMany({
      where,
      include: {
        complianceType: true,
        client: {
          select: {
            id: true,
            displayName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// Get compliance types
tasksRouter.get("/compliance-types", async (req, res) => {
  try {
    const types = await prisma.complianceType.findMany({
      orderBy: {
        displayName: "asc",
      },
    });

    return res.json(types);
  } catch (error) {
    console.error("Error fetching compliance types:", error);
    return res.status(500).json({ message: "Failed to fetch compliance types" });
  }
});

// Get task by ID
tasksRouter.get("/:id", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const task = await prisma.complianceTask.findFirst({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
        ...(req.user.role === "CLIENT" && req.user.clientId
          ? { clientId: req.user.clientId }
          : {}),
      },
      include: {
        complianceType: true,
        client: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({ message: "Failed to fetch task" });
  }
});

// Create compliance task (CA roles only)
tasksRouter.post("/", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const {
      clientId,
      complianceTypeId,
      periodStart,
      periodEnd,
      dueDate,
      assignedToUserId,
    } = req.body;

    if (!clientId || !complianceTypeId || !periodStart || !periodEnd || !dueDate) {
      return res.status(400).json({
        message: "clientId, complianceTypeId, periodStart, periodEnd, and dueDate are required",
      });
    }

    // Verify client belongs to firm
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        firmId: req.user.firmId,
      },
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Verify compliance type exists
    const complianceType = await prisma.complianceType.findUnique({
      where: { id: complianceTypeId },
    });

    if (!complianceType) {
      return res.status(404).json({ message: "Compliance type not found" });
    }

    const task = await prisma.complianceTask.create({
      data: {
        firmId: req.user.firmId,
        clientId,
        complianceTypeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: new Date(dueDate),
        assignedToUserId: assignedToUserId || null,
        createdByUserId: req.user.id,
      },
      include: {
        complianceType: true,
        client: {
          select: {
            id: true,
            displayName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Failed to create task" });
  }
});

// Update task status
tasksRouter.patch("/:id/status", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { status } = req.body;

    if (!["PENDING", "IN_PROGRESS", "FILED", "APPROVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await prisma.complianceTask.updateMany({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
      },
      data: {
        status,
      },
    });

    if (task.count === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Status updated" });
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
});

// Assign task
tasksRouter.patch("/:id/assign", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { assignedToUserId } = req.body;

    const task = await prisma.complianceTask.updateMany({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
      },
      data: {
        assignedToUserId: assignedToUserId || null,
      },
    });

    if (task.count === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task assigned" });
  } catch (error) {
    console.error("Error assigning task:", error);
    return res.status(500).json({ message: "Failed to assign task" });
  }
});

// Add comment to task
tasksRouter.post("/:id/comments", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User context required" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Comment message is required" });
    }

    // Verify task exists and user has access
    const whereClause: { id: string; clientId?: string; firmId?: string } = {
      id: req.params.id,
    };
    
    if (req.user.role === "CLIENT" && req.user.clientId) {
      whereClause.clientId = req.user.clientId;
    } else if (req.user.firmId) {
      whereClause.firmId = req.user.firmId;
    }

    const task = await prisma.complianceTask.findFirst({
      where: whereClause,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: req.params.id,
        authorUserId: req.user.id,
        message,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: "Failed to add comment" });
  }
});

