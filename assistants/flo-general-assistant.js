import { runCakeOrderAssistant} from "./flo-cake-assistant.js";

const GENERAL_ASSISTANT = "asst_GLQq9mCSOtPnebURI1P1xdNO";
let openaiClient;

const initialize = (client) => {
    openaiClient = client;
};

const run = async (thread) => {
    //TODO exception handling
    let run = await openaiClient.beta.threads.runs
        .create(thread, {
            assistant_id: GENERAL_ASSISTANT,
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
                const toolType = toolCall.type;
                const toolId = toolCall.id;

                if (toolType === "function") {
                    const functionName = toolCall.function.name;
                    const functionArgs = toolCall.function.arguments;


                    // Call the required function
                    switch (functionName) {
                        case FUNCTIONS.MAKE_ORDER :
                            return await transitionToCakeAssistant(
                                thread,
                                functionArgs
                            );
                            
                        default:
                            break;
                    }
                }

                // Handle each tool call as needed
                // await openaiClient.beta.threads.runs.submitToolOutputs(
                //     thread,
                //     run.id,
                //     {
                //         tool_outputs: [
                //             {
                //                 tool_call_id: toolId,
                //                 output: resolvedActionMessage,
                //             },
                //         ],
                //     }
                // );

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

    return {
        thread: thread,
        assistantId: GENERAL_ASSISTANT,
        responseMessage: responseMessage
    };

};

const FUNCTIONS = { MAKE_ORDER: "makeOrder" };

const transitionToCakeAssistant = async (oldThread, args) => {
    try {
        //First we clear the current thread, as it is for the General Assistant, and we need a new thread for the Cake Assistant
        await openaiClient.beta.threads.del(oldThread);
        //Create a new thread for the Cake Assistant
        const thread = await openaiClient.beta.threads.create();
        console.log(`Created thread by General Assistant: ${thread.id}`);

        //TODO decide what arguments will be there and what will be needed if anything
        // const parsedArgs = JSON.parse(args); // Parse the JSON string into an object

        //Call the Cake Assistant
        return await runCakeOrderAssistant(thread.id);
    } catch (error) {
        console.error("Failed to parse arguments:", error);
    }
}

export {
    GENERAL_ASSISTANT,
    initialize as initializeFloGeneral,
    run as runDefaultAssistant
}; 