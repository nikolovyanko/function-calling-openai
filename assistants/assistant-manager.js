let openaiClient;

const initialize = (client) => {
    openaiClient = client;
};


const messageFlo = async (message, assistantId, flo_general_thread, flo_order_thread) => {
    let thread;

    ({ assistantId, thread } = resolveThreadAndAssistantId(
        assistantId,
        thread,
        flo_general_thread,
        flo_order_thread));
};

const deleteThreads = async (threads) => {

    for (const thread of threads) {
        await openaiClient.beta.threads.del(thread);

        return "Threads deleted";
    }
};


function resolveThreadAndAssistantId(assistantId, thread, flo_general_thread, flo_order_thread) {
    if (!assistantId) {
        thread = flo_general_thread;
        assistantId = ASSISTANTS.FLO_GENERAL_KNOWLEDGE.id;
    } else {
        thread = assistantId === ASSISTANTS.FLO_GENERAL_KNOWLEDGE.id ? flo_general_thread : flo_order_thread;
    }
    return { assistantId, thread };
}

export { initialize as initializeFloManager, deleteThreads }; // Export the initialize function