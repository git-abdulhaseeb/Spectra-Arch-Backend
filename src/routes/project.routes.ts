import { Router } from "express";
import { Project } from "../models/Project.js";
import { authCheck, type AuthRequest } from "../middlewares/authCheck.js";
export const projectRouter = Router();
projectRouter.use(authCheck);
projectRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json(
      await Project.find({ userId: req.userId }).sort({ updatedAt: -1 }),
    );
  } catch (e) {
    next(e);
  }
});
projectRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    if (title.length < 2 || title.length > 80)
      return res
        .status(400)
        .json({ message: "Project name must be between 2 and 80 characters." });
    const supportedDatabases = [
      "mongodb",
      "postgresql",
      "mysql",
      "mariadb",
      "sqlite",
      "cockroachdb",
      "dynamodb",
      "firebase",
    ] as const;
    const requestedDatabase = String(req.body.databaseEngine || "mongodb");
    const databaseEngine =
      supportedDatabases.find((item) => item === requestedDatabase) ||
      "mongodb";
    const framework =
      String(req.body.framework || "express-ts")
        .trim()
        .slice(0, 60) || "express-ts";
    const requestedCanvas = req.body.canvasState;
    const canvasState =
      requestedCanvas &&
      Array.isArray(requestedCanvas.nodes) &&
      Array.isArray(requestedCanvas.edges) &&
      requestedCanvas.nodes.length <= 80 &&
      requestedCanvas.edges.length <= 160
        ? { nodes: requestedCanvas.nodes, edges: requestedCanvas.edges }
        : { nodes: [], edges: [] };
    res
      .status(201)
      .json(
        await Project.create({
          title,
          framework,
          databaseEngine,
          userId: req.userId,
          canvasState,
          dbSchema: [],
          prdContent: "",
        }),
      );
  } catch (e) {
    next(e);
  }
});
projectRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const p = await Project.findOne({ _id: req.params.id, userId: req.userId });
    p ? res.json(p) : res.status(404).json({ message: "Project not found" });
  } catch (e) {
    next(e);
  }
});
projectRouter.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const allowed: Record<string, unknown> = {};
    for (const key of [
      "title",
      "framework",
      "databaseEngine",
      "canvasState",
      "dbSchema",
      "prdContent",
    ])
      if (req.body[key] !== undefined) allowed[key] = req.body[key];
    const current = await Project.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!current) return res.status(404).json({ message: "Project not found" });
    const last = current.auditTrail.at(-1);
    if (!last || Date.now() - new Date(last.createdAt).getTime() > 120000) {
      current.auditTrail.push({
        actorId: current.userId,
        action: String(
          req.body.auditAction || "Updated the architecture canvas",
        ).slice(0, 160),
        createdAt: new Date(),
      });
      current.auditTrail = current.auditTrail.slice(-50);
    }
    Object.assign(current, allowed);
    await current.save();
    res.json(current);
  } catch (e) {
    next(e);
  }
});
projectRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const p = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    p
      ? res.status(204).end()
      : res.status(404).json({ message: "Project not found" });
  } catch (e) {
    next(e);
  }
});
