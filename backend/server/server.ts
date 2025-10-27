import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import crypto from "crypto";

import connectDB from "./config/database";
import jwtAuthMiddleware from "./middleware/jwtAuth";
import libraryRoutes from "./routes/libraryRoutes";
import shelfRoutes from "./routes/shelfRoutes";
import bookRoutes from "./routes/bookRoutes";
import authRoutes from "./routes/authRoutes";
import loanRoutes from "./routes/loanRoutes"

const app = express();

connectDB();

app.use(mongoSanitize());

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Troppe richieste, riprova più tardi.",
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (pubbliche)
app.use("/api/auth", authRoutes);

// Protected routes (richiedono JWT)
app.use("/api/libraries", jwtAuthMiddleware, libraryRoutes);
app.use("/api/shelves", jwtAuthMiddleware, shelfRoutes);
app.use("/api/books", jwtAuthMiddleware, bookRoutes);
app.use("/api/loans", jwtAuthMiddleware, loanRoutes);

const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} non trovata`,
    });
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Errore server:", err);
    res.status(500).json({
      success: false,
      message: "Errore interno del server",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
);

const PORT: number = parseInt(process.env.PORT as string) || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server TypeScript running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});