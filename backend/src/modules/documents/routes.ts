import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../../db/client";
import { authMiddleware, requireRole } from "../../middleware/auth";
import { loadEnv } from "../../config/env";

const env = loadEnv();
export const documentsRouter = Router();

documentsRouter.use(authMiddleware);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// List documents
documentsRouter.get("/", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { folderId, clientId } = req.query;

    const where: any = {
      firmId: req.user.firmId,
    };

    if (req.user.role === "CLIENT" && req.user.clientId) {
      where.clientId = req.user.clientId;
    } else if (clientId) {
      where.clientId = String(clientId);
    }

    if (folderId) {
      where.folderId = String(folderId);
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// Upload document
documentsRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const { folderId, clientId, status } = req.body;

    if (!folderId || !clientId) {
      return res.status(400).json({ message: "folderId and clientId are required" });
    }

    // Verify client belongs to firm
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        firmId: req.user.firmId,
      },
    });

    if (!client) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Client not found" });
    }

    // Get latest version number for this file
    const latestVersion = await prisma.document.findFirst({
      where: {
        fileName: req.file.originalname,
        folderId,
      },
      orderBy: {
        versionNumber: "desc",
      },
    });

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    const versionGroupId = latestVersion?.versionGroupId || `vg-${Date.now()}`;

    const document = await prisma.document.create({
      data: {
        folderId,
        firmId: req.user.firmId,
        clientId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        storagePath: req.file.path,
        versionGroupId,
        versionNumber,
        status: status || "UPLOADED",
        uploadedById: req.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error("Error uploading document:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Failed to upload document" });
  }
});

// Download document
documentsRouter.get("/:id/download", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
        ...(req.user.role === "CLIENT" && req.user.clientId
          ? { clientId: req.user.clientId }
          : {}),
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!fs.existsSync(document.storagePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${document.fileName}"`);
    res.setHeader("Content-Type", document.mimeType);
    return res.sendFile(path.resolve(document.storagePath));
  } catch (error) {
    console.error("Error downloading document:", error);
    return res.status(500).json({ message: "Failed to download document" });
  }
});

// Update document status
documentsRouter.patch("/:id/status", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { status } = req.body;

    if (!["REQUESTED", "UPLOADED", "REVIEWED", "APPROVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const document = await prisma.document.updateMany({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
      },
      data: {
        status,
      },
    });

    if (document.count === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.json({ message: "Status updated" });
  } catch (error) {
    console.error("Error updating document status:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
});

// Delete document (CA roles)
documentsRouter.delete("/:id", requireRole(["CA_ADMIN", "CA_STAFF"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const doc = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        firmId: req.user.firmId,
      },
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete from DB
    await prisma.document.delete({
      where: { id: doc.id },
    });

    // Best-effort delete file from disk
    try {
      if (fs.existsSync(doc.storagePath)) {
        fs.unlinkSync(doc.storagePath);
      }
    } catch (err) {
      console.warn("Failed to delete document file from disk", err);
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ message: "Failed to delete document" });
  }
});

// Get document folders
documentsRouter.get("/folders", async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { clientId, financialYear } = req.query;

    const where: any = {
      firmId: req.user.firmId,
    };

    if (req.user.role === "CLIENT" && req.user.clientId) {
      where.clientId = req.user.clientId;
    } else if (clientId) {
      where.clientId = String(clientId);
    }

    if (financialYear) {
      where.financialYear = String(financialYear);
    }

    const folders = await prisma.documentFolder.findMany({
      where,
      include: {
        _count: {
          select: {
            documents: true,
            subfolders: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return res.status(500).json({ message: "Failed to fetch folders" });
  }
});

// Create or find folder (upsert)
documentsRouter.post("/folders", requireRole(["CA_ADMIN", "CA_STAFF", "CLIENT"]), async (req, res) => {
  if (!req.user?.firmId) {
    return res.status(400).json({ message: "Firm context required" });
  }

  try {
    const { clientId, financialYear, name, parentFolderId } = req.body;

    if (!clientId || !financialYear || !name) {
      return res.status(400).json({ message: "clientId, financialYear, and name are required" });
    }

    // Check if folder already exists
    const existingFolder = await prisma.documentFolder.findFirst({
      where: {
        firmId: req.user.firmId,
        clientId,
        financialYear,
        name,
        parentFolderId: parentFolderId || null,
      },
    });

    if (existingFolder) {
      return res.status(200).json(existingFolder);
    }

    // Create new folder
    const folder = await prisma.documentFolder.create({
      data: {
        firmId: req.user.firmId,
        clientId,
        financialYear,
        name,
        parentFolderId: parentFolderId || null,
      },
    });

    return res.status(201).json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    return res.status(500).json({ message: "Failed to create folder" });
  }
});

