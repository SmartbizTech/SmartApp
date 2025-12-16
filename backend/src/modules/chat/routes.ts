import { Router } from "express";
import { prisma } from "../../db/client";
import { authMiddleware } from "../../middleware/auth";

export const chatRouter = Router();

chatRouter.use(authMiddleware);

// List conversations
chatRouter.get("/conversations", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const where: any = {
      firmId: req.user.firmId,
    };

    if (req.user.role === "CLIENT" && req.user.clientId) {
      where.clientId = req.user.clientId;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            displayName: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                reads: {
                  none: {
                    userId: req.user.id,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      clientId: conv.clientId,
      clientName: conv.client.displayName,
      lastMessage: conv.messages[0]?.body,
      lastMessageAt: conv.messages[0]?.createdAt,
      unreadCount: conv._count.messages,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Get or create conversation
chatRouter.post("/conversations", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { clientId, relatedDocumentId, relatedTaskId } = req.body;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
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

    // Try to find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        firmId: req.user.firmId,
        clientId,
        relatedDocumentId: relatedDocumentId || null,
        relatedTaskId: relatedTaskId || null,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          firmId: req.user.firmId,
          clientId,
          createdByUserId: req.user.id,
          type: req.user.role === "CLIENT" ? "CA_CLIENT" : "INTERNAL",
          relatedDocumentId: relatedDocumentId || null,
          relatedTaskId: relatedTaskId || null,
        },
      });
    }

    return res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({ message: "Failed to create conversation" });
  }
});

// Get messages for a conversation
chatRouter.get("/conversations/:id/messages", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    // Verify conversation belongs to firm
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
        ...(req.user.role === "CLIENT" && req.user.clientId
          ? { clientId: req.user.clientId }
          : {}),
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: req.params.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        reads: {
          where: {
            userId: req.user.id,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formatted = messages.map((msg) => ({
      id: msg.id,
      body: msg.body,
      senderId: msg.sender.id,
      senderName: msg.sender.name,
      createdAt: msg.createdAt,
      read: msg.reads.length > 0,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Send message
chatRouter.post("/conversations/:id/messages", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: "Message body is required" });
    }

    // Verify conversation belongs to firm
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
        ...(req.user.role === "CLIENT" && req.user.clientId
          ? { clientId: req.user.clientId }
          : {}),
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderUserId: req.user.id,
        body,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      id: message.id,
      body: message.body,
      senderId: message.sender.id,
      senderName: message.sender.name,
      createdAt: message.createdAt,
      read: false,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

// Mark message as read
chatRouter.post("/messages/:id/read", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User context required" });
  }

  try {
    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId: req.params.id,
          userId: req.user.id,
        },
      },
      create: {
        messageId: req.params.id,
        userId: req.user.id,
      },
      update: {},
    });

    return res.json({ message: "Message marked as read" });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return res.status(500).json({ message: "Failed to mark message as read" });
  }
});

