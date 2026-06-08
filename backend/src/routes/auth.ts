import { Router } from "express";
import { RegisterSchema, LoginSchema } from "../validation/auth.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import type { AppContainer } from "../app.js";

export const authRouter = (appContainer: AppContainer) => {
  const router = Router();

  router.post("/register", async (req, res) => {
    try {
      const data = RegisterSchema.parse(req.body);
      const user = await appContainer.services.authService.register(data);
      res.json(user);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
        return;
      }
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await appContainer.services.authService.login(data.email, data.passwordHash);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
        return;
      }
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  router.get("/me", requireAuth, async (req, res) => {
    try {
      const user = await appContainer.services.authService.getMe(req.headers.authorization!.split(" ")[1]);
      res.json(user);
    } catch (error: any) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({ error: error.message });
    }
  });

  return router;
};
