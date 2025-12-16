import { Router } from "express";
import { prisma } from "../../db/client";
import { authMiddleware } from "../../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

// CA Dashboard
dashboardRouter.get("/", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  if (req.user.role === "CLIENT") {
    return res.status(403).json({ message: "Use /dashboard/client endpoint" });
  }

  try {
    // Get pending clients (clients with pending tasks)
    const pendingClientsCount = await prisma.client.count({
      where: {
        firmId: req.user.firmId,
        complianceTasks: {
          some: {
            status: {
              in: ["PENDING", "IN_PROGRESS"],
            },
          },
        },
      },
    });

    // Get upcoming deadlines (tasks due in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlines = await prisma.complianceTask.count({
      where: {
        firmId: req.user.firmId,
        dueDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });

    // Get pending tasks count
    const pendingTasksCount = await prisma.complianceTask.count({
      where: {
        firmId: req.user.firmId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });

    // Get recent tasks
    const recentTasks = await prisma.complianceTask.findMany({
      where: {
        firmId: req.user.firmId,
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
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

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      stats: {
        pendingClients: pendingClientsCount,
        upcomingDeadlines,
        pendingTasks: pendingTasksCount,
      },
      recentTasks,
      notifications,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// Client Dashboard
dashboardRouter.get("/client", async (req, res) => {
  if (!req.user?.clientId) {
    return res.status(400).json({ message: "Client context required" });
  }

  if (req.user.role !== "CLIENT") {
    return res.status(403).json({ message: "Use /dashboard endpoint" });
  }

  try {
    // Get pending tasks count
    const pendingTasksCount = await prisma.complianceTask.count({
      where: {
        clientId: req.user.clientId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });

    // Get uploaded documents count
    const uploadedDocumentsCount = await prisma.document.count({
      where: {
        clientId: req.user.clientId,
        status: "UPLOADED",
      },
    });

    // Get filing status
    const filingStatus = {
      pending: await prisma.complianceTask.count({
        where: {
          clientId: req.user.clientId,
          status: "PENDING",
        },
      }),
      inProgress: await prisma.complianceTask.count({
        where: {
          clientId: req.user.clientId,
          status: "IN_PROGRESS",
        },
      }),
      filed: await prisma.complianceTask.count({
        where: {
          clientId: req.user.clientId,
          status: "FILED",
        },
      }),
    };

    // Get recent tasks
    const recentTasks = await prisma.complianceTask.findMany({
      where: {
        clientId: req.user.clientId,
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
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

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      stats: {
        pendingTasks: pendingTasksCount,
        uploadedDocuments: uploadedDocumentsCount,
        filingStatus,
      },
      recentTasks,
      notifications,
    });
  } catch (error) {
    console.error("Client dashboard error:", error);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
});

