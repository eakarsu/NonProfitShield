import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import nonprofitRouter from "./routes/nonprofit";
import { pool } from "./db";

const app = express();
app.use(express.json({ limit: "2mb", verify: (req: any, _res, buffer) => { req.rawBody = buffer; } }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  app.use(["/api/ai", "/api/extras"], (_req, res) => res.status(410).json({ error: "legacy_ai_surface_quarantined", replacement: "/api/nonprofit/v1" }));
  const server = await registerRoutes(app);
  app.use("/api/nonprofit/v1", nonprofitRouter);

  // Seed data is an explicit development-only operation, never a startup action.
  if (process.env.NODE_ENV === "development" && process.env.ALLOW_DEVELOPMENT_SEED === "true") app.post("/api/seed", async (_req: Request, res: Response) => {
    try {
      await seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (error: any) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Seed failed: " + error.message });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const readiness = await pool.query("SELECT to_regclass('nonprofit_organizations') AS table_name");
  if (!readiness.rows[0]?.table_name) throw new Error("Database migration missing; run npm run migrate");
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
