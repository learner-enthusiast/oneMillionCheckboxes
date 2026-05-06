import { Router } from "express";
import { authExchangeFromFreeApi } from "../controllers/freeAPI.controller";

const router = Router();

router.get("/:code", authExchangeFromFreeApi);

export default router;
