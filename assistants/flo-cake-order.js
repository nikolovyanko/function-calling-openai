// assistants/flo-cake-order.js

let openaiClient;

const initialize = (client) => {
    openaiClient = client;
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

export { initialize as initializeFloCakeOrder, makeOrder };