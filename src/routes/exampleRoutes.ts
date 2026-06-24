import { Router } from "express";
import { ExampleController } from "../controllers/exampleController.ts";

const router = Router();
const controller = new ExampleController()

router.get("/cheers", controller.cheers)

export default router