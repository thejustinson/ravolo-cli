import { arweave } from "./arweaveConnect.js";
export const generateKey = async () => {
    try {
        const key = await arweave.wallets.generate();
        return key;
    }
    catch (error) {
        console.error("Error generating key:", error);
    }
};
