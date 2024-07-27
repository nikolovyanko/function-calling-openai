let openaiClient;

const initialize = (client) => {
    openaiClient = client;
};

const run = async (run, thread) => {

// Poll for the run status until it is completed
while (run.status !== "completed") {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Add a delay of 1.5 second
    console.log("INSIDE" + run.status);
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
    console.log("INSIDE1" + run.status);
}

};

export { initialize as initializeFloGeneral, run as runDefaultAssistant}; // Export the initialize function