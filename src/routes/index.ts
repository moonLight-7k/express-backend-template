import { Router } from "express";
import { healthController } from "../controller/health/health";
import { versionController } from "../controller/version/version";
import { authMiddleware } from "../middleware/auth";
import { authRouter } from "./auth";
import { queueRouter } from "./queue";


const apiRouter = Router();

apiRouter.get("/health", authMiddleware, healthController);

apiRouter.get("/version", authMiddleware, versionController);

apiRouter.use("/auth", authRouter);

apiRouter.use("/queue", queueRouter);


export { apiRouter };
