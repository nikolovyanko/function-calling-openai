import express from "express";
import { deleteThreads, messageAssistant } from "../assistants/assistant-manager.js";

const router = express.Router();
const regex = /【.*source】/g;
router.delete("/threadDel", async (req, res) => {
  try {
    const threads = req.body.threads;
    const responseMessage = await deleteThreads(threads);
    return res.json({ message: responseMessage });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Start conversation
router.post("/message", async (req, res) => {
  try {
    const API_KEY = req.header("Authorization");

    if (API_KEY !== process.env.OPEN_AI_API_KEY) {
      return res.status(401).json({ error: "Unauthorized!" });
    }

    let { message, assistantId, thread } = req.body;

    // Call messageAssistant and destructure the result
    const {
      thread: newThread,
      assistantId: newAssistantId,
      responseMessage } = await messageAssistant(message, assistantId, thread);


      const response = responseMessage.replace(regex, '');

    return res.json({
      thread: newThread,
      assistantId: newAssistantId,
      responseMessage: response
    });


  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export { router };