import { Request, Response, NextFunction } from "express";

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] as string | undefined;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || token !== process.env.VITE_API_TOKEN) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
}
export default authMiddleware;