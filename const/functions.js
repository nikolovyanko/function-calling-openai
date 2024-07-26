//TODO rename
const OPEN_AI_FUNCTIONS = {
    MAKE_ORDER:"makeOrder"
}

const makeOrder = async (args) => {
    try {
        const parsedArgs = JSON.parse(args); // Parse the JSON string into an object
        const orderProduct = parsedArgs.orderProduct; // Access the orderProduct property
        console.log(`Making order for: ${orderProduct}`);
        return 'Ok';
    } catch (error) {
        console.error("Failed to parse arguments:", error);
    }
}
export { OPEN_AI_FUNCTIONS, makeOrder };