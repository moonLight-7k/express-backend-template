import { Router } from "express";
import { healthController } from "../controller/health/health";
import { versionController } from "../controller/version/version";
import { authMiddleware } from "../middleware/auth";
import { authRouter } from "./auth";


const apiRouter = Router();

apiRouter.get("/health", authMiddleware, healthController);

apiRouter.get("/version", authMiddleware, versionController);

apiRouter.use("/auth", authRouter);


export { apiRouter };
