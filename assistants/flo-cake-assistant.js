const CAKE_ASSISTANT = "asst_JMEOHWDmcgJNNFAsA6hdHUcY";

let openaiClient;

const initialize = (client) => {
    openaiClient = client;
};

const run = async (thread) => {
    //TODO exception handling
    let run = await openaiClient.beta.threads.runs
        .create(thread, {
            assistant_id: CAKE_ASSISTANT,
        });

    // Poll for the run status until it is completed
    while (run.status !== "completed") {
        await new Promise(resolve => setTimeout(resolve, 1500)); 
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

                    // Call the needed function
                    switch (functionName) {
                        case FUNCTIONS.NONE:
                            resolvedActionMessage = makeOrder(functionArgs);
                            break;
                        default:
                            break;
                    }
                }

                // Handle each tool call as needed
                await openaiClient.beta.threads.runs.submitToolOutputs(
                    thread,
                    run.id,
                    {
                        tool_outputs: [
                            {
                                tool_call_id: toolId,
                                output: resolvedActionMessage,
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

    return {
        thread: thread,
        assistantId: CAKE_ASSISTANT,
        responseMessage: responseMessage
    };

};

const FUNCTIONS = { NONE: "non for the moment" };


export {
    CAKE_ASSISTANT,
    initialize as initializeFloCakeOrder,
    run as runCakeOrderAssistant
};