import express, { response } from "express";
import OpenAI from "openai";
import { ASSISTANTS } from "../const/assistants.js"; // Ensure the correct path and file extension
import { OPEN_AI_FUNCTIONS, makeOrder } from "../const/functions.js";
import { initializeFloGeneral } from "../assistants/flo-general.js";
import { initializeFloCakeOrder } from "../assistants/flo-cake-order.js";
import { initializeFloManager } from "../assistants/assistant-manager.js";
import { deleteThreads } from "../assistants/assistant-manager.js";

const router = express.Router();

const iniOpenAiClient = () => {
  try {
    const client = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY })
    initializeFloGeneral(client);
    initializeFloCakeOrder(client);
    initializeFloManager(client);
    return client;
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
  }
}
const openaiClient = iniOpenAiClient();

router.delete("/threadDel", async (req, res) => {
  try {
    const threads = req.body.threads;
    const responseMessage = await deleteThreads(threads);
    res.json({ message: responseMessage });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/init", async (req, res) => {
  const API_KEY = req.header("Authorization");

  if (API_KEY !== process.env.OPEN_AI_API_KEY) {
    res.status(401).json({ error: "Unauthorized!" });
  }

  try {
    const floGeneralThread = await openaiClient.beta.threads.create();
    const floOrderThread = await openaiClient.beta.threads.create();

    res.json({
      flo_general_thread: floGeneralThread.id,
      flo_order_thread: floOrderThread.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Start conversation
router.post("/message", async (req, res) => {
  let {
    message,
    assistantId,
    flo_general_thread,
    flo_order_thread } = req.body;

  let thread;

  ({ assistantId, thread } = resolveThreadAndAssistantId(
    assistantId,
    thread,
    flo_general_thread,
    flo_order_thread));

  try {
    // Create a message
    await openaiClient.beta.threads.messages.create(thread, {
      role: "user",
      content: message,
    });

    //create a run 
    let run = await openaiClient.beta.threads.runs
      .create(thread, {
        assistant_id: assistantId,
      });

    // Poll for the run status until it is completed
    while (run.status !== "completed") {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Add a delay of 1.5 second
      run = await openaiClient.beta.threads.runs.retrieve(thread, run.id);

      if (run.status === "requires_action") {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        //iterate over the tool calls to identify different functions
        for (const toolCall of toolCalls) {
          let resolvedActionMessage = "";
          const toolType = toolCall.type; // Get the tool type
          const toolId = toolCall.id; // Get the tool ID

          if (toolType === "function") {
            const functionName = toolCall.function.name;
            const functionArgs = toolCall.function.arguments;


            // Call the function
            switch (functionName) {
              case OPEN_AI_FUNCTIONS.MAKE_ORDER:
                resolvedActionMessage = makeOrder(functionArgs);
                break;
              default:
                break;
            }
          }

          // Handle each tool call as needed
          // For example, you might need to submit tool outputs or take other actions
          await openaiClient.beta.threads.runs.submitToolOutputs(
            thread,
            run.id,
            {
              tool_outputs: [
                {
                  tool_call_id: toolId,
                  output: "",
                },
              ],
            }
          );

        }
      }
      //Checking the status at the end of the loop to avoid unnecessary polling
      run = await openaiClient.beta.threads.runs.retrieve(thread, run.id);
    }

    const messages = await openaiClient.beta.threads.messages.list(
      thread,
      run.id
    );

    const responseMessage = await messages.data[0].content[0].text.value;

    res.json({
      thread: thread,
      assistantId: assistantId,
      responseMessage: responseMessage
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



function resolveThreadAndAssistantId(assistantId, thread, flo_general_thread, flo_order_thread) {
  if (!assistantId) {
    thread = flo_general_thread;
    assistantId = ASSISTANTS.FLO_GENERAL_KNOWLEDGE.id;
  } else {
    thread = assistantId === ASSISTANTS.FLO_GENERAL_KNOWLEDGE.id ? flo_general_thread : flo_order_thread;
  }
  return { assistantId, thread };
}

export { router };