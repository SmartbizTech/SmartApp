import { Router } from "express";
import { prisma } from "../../db/client";
import { authMiddleware } from "../../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

// List notifications
notificationsRouter.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User context required" });
  }

  try {
    const { unreadOnly } = req.query;

    const where: any = {
      userId: req.user.id,
    };

    if (unreadOnly === "true") {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
notificationsRouter.post("/:id/read", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User context required" });
  }

  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        readAt: new Date(),
      },
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
notificationsRouter.post("/read-all", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User context required" });
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

