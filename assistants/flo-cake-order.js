// assistants/flo-cake-order.js

let openaiClient;

const initialize = (client) => {
    openaiClient = client;
};

const run = async (run, thread) => {

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
    
    };





const makeOrder = async (args) => {
    try {
        const parsedArgs = JSON.parse(args); // Parse the JSON string into an object
        const orderProduct = parsedArgs.orderProduct; // Access the orderProduct property
        console.log(`Making order for: ${orderProduct}`);
        // Use openaiClient here if needed
        return 'Ok';
    } catch (error) {
        console.error("Failed to parse arguments:", error);
    }
};

export { initialize as initializeFloCakeOrder, makeOrder, run as runCakeOrderAssistant }; // Export the initialize function