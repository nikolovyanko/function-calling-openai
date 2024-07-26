// assistants/flo-cake-order.js

let openaiClient;

const initialize = (client) => {
    openaiClient = client;
};


export { initialize as initializeFloGeneral }; // Export the initialize function