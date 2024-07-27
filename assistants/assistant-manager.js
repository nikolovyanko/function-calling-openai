import OpenAI from "openai";
import { ASSISTANTS } from "../constants/assistants.js";
import { runDefaultAssistant, initializeFloGeneral } from "./flo-general.js";
import { runCakeOrderAssistant, initializeFloCakeOrder } from "./flo-cake-order.js";

const iniOpenAiClient = () => {
    try {
      const client = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY })
      initializeFloGeneral(client);
      initializeFloCakeOrder(client);
      return client;
    } catch (error) {
      console.error("Failed to initialize OpenAI client:", error);
    }
  }
  const openaiClient = iniOpenAiClient();

const messageAssistant = async (message, assistantId, thread) => {
    try {
        //pick the default assistant if assistantId is not provided
        if (!assistantId) {
            assistantId = ASSISTANTS.FLO_GENERAL_KNOWLEDGE.id;
        }
        //Create a new thread if thread is not provided, pick the default assistant if assistantId is not provided
        if (!thread) {
            const newThread = await openaiClient.beta.threads.create();
            thread = newThread.id;
            console.log(`Created thread: ${thread}`);
        }

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

        //Pick an assistant based on the assistantId to handle the run
        switch (assistantId) {
            case ASSISTANTS.FLO_CAKE_ORDER.id:
                runCakeOrderAssistant(run, thread);
                break;

            default:
                await runDefaultAssistant(run, thread);
                break;
        }
        console.log("OUTSIDE" + run.status);

        const messages = await openaiClient.beta.threads.messages.list(
            thread,
            run.id
        );

        const responseMessage = await messages.data[0].content[0].text.value;
        console.log("INSIDE" + responseMessage);

        return {
            thread: thread,
            assistantId: assistantId,
            responseMessage: responseMessage
        };

    } catch (error) {
        console.error(error);
        console.log("INSIDE ERROR" + responseMessage);
        return {
            thread: thread,
            assistantId: assistantId,
            responseMessage: "Sorry there was a problem executing your request, can you please try again?"
        };
    }
};

const deleteThreads = async (threads) => {

    for (const thread of threads) {
        await openaiClient.beta.threads.del(thread);

        return "Threads deleted";
    }
};


const resolveThreadAndAssistantId = async (assistantId, thread) => {
    if (!assistantId) {
        assistantId = ASSISTANTS.FLO_GENERAL_KNOWLEDGE.id;
    }

    if (!thread) {
        console.log("Creating a new thread");
        const newThread = await openaiClient.beta.threads.create();
        thread = newThread.id;
        console.log(`Created thread: ${thread}`);
    }
    return { assistantId, thread };
}


export {deleteThreads, messageAssistant }; // Export the initialize function