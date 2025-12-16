import { Router } from "express";
import { prisma } from "../../db/client";
import { authMiddleware, requireRole } from "../../middleware/auth";

export const calendarRouter = Router();

calendarRouter.use(authMiddleware);

// List calendar events
calendarRouter.get("/events", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { startDate, endDate, clientId } = req.query;

    const where: any = {
      firmId: req.user.firmId,
    };

    if (req.user.role === "CLIENT" && req.user.clientId) {
      where.clientId = req.user.clientId;
    } else if (clientId) {
      where.clientId = String(clientId);
    }

    if (startDate && endDate) {
      where.startAt = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            displayName: true,
          },
        },
        task: {
          select: {
            id: true,
            complianceType: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        startAt: "asc",
      },
    });

    return res.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return res.status(500).json({ message: "Failed to fetch calendar events" });
  }
});

// Create calendar event
calendarRouter.post("/events", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { clientId, title, description, startAt, endAt, relatedTaskId } = req.body;

    if (!title || !startAt || !endAt) {
      return res.status(400).json({ message: "title, startAt, and endAt are required" });
    }

    // Verify client belongs to firm if provided
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          firmId: req.user.firmId,
        },
      });

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        firmId: req.user.firmId,
        clientId: clientId || null,
        title,
        description: description || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        source: "MANUAL",
        relatedTaskId: relatedTaskId || null,
      },
      include: {
        client: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return res.status(500).json({ message: "Failed to create calendar event" });
  }
});

// Delete calendar event
calendarRouter.delete("/events/:id", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const event = await prisma.calendarEvent.deleteMany({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
        source: "MANUAL", // Only allow deletion of manual events
      },
    });

    if (event.count === 0) {
      return res.status(404).json({ message: "Event not found or cannot be deleted" });
    }

    return res.json({ message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return res.status(500).json({ message: "Failed to delete calendar event" });
  }
});

