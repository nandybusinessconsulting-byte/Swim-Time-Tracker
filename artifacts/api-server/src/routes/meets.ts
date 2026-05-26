import { Router, type IRouter } from "express";
import { ListMeetsResponse } from "@workspace/api-zod";
import { fetchNJMeets } from "../lib/meetsScraper";

const router: IRouter = Router();

router.get("/meets", async (req, res): Promise<void> => {
  const data = await fetchNJMeets();
  res.json(ListMeetsResponse.parse({ meets: data.meets, cachedAt: data.cachedAt }));
});

export default router;
