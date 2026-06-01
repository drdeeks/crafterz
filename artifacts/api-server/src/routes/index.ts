import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import gameRouter from "./game.js";
import heistsRouter from "./heists.js";
import agentsRouter from "./agents.js";
import weatherRouter from "./weather.js";
import captionsRouter from "./captions.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gameRouter);
router.use(heistsRouter);
router.use(agentsRouter);
router.use(weatherRouter);
router.use(captionsRouter);

export default router;
