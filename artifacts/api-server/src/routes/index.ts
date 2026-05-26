import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meetsRouter from "./meets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meetsRouter);

export default router;
