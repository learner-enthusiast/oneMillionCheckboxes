import { Router } from "express";
import { exchangeCodeAndVerify } from "../controllers/oidc.controller.ts";

const router = Router();

// GET /oidc/:code
router.get("/:code", exchangeCodeAndVerify);

export default router;
