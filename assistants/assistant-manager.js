import OpenAI from "openai";
import { runDefaultAssistant, initializeFloGeneral, GENERAL_ASSISTANT } from "./flo-general-assistant.js";
import { runCakeOrderAssistant, initializeFloCakeOrder, CAKE_ASSISTANT } from "./flo-cake-assistant.js";

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
            assistantId = GENERAL_ASSISTANT;
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

        //Pick an assistant based on the assistantId to handle the run
        switch (assistantId) {
            case CAKE_ASSISTANT:
                return await runCakeOrderAssistant(thread);

            //The dafault assistant is the General Knowledge Flo assistant
            default:
                return await runDefaultAssistant(thread);
        }

    } catch (error) {
        console.error(error);
        return {
            thread: thread,
            assistantId: assistantId,
            responseMessage: "Sorry there was a problem executing your request, can you please try again?"
        };
    }
};

const deleteThreads = async (threads) => {
    let responseMessage = "";
    for (const thread of threads) {
        await openaiClient.beta.threads.del(thread);
        responseMessage += `Thread ${thread} deleted\n`;
        
    }
    return responseMessage;
};


export { deleteThreads, messageAssistant }; // Export the initialize function