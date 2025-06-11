import express from "express";
import { handleChatRequest } from "../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/chatbot", handleChatRequest);

router.get("/chatbot/ping", (req, res) => {
  res.json({ message: "Chatbot is active" });
});

export default router;
