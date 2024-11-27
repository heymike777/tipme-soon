export class ExplorerManager {

    static getUrlToAccount(address: string): string {
        return `https://solscan.io/account/${address}?cluster=custom&customUrl=https%3A%2F%2Frpc.testnet.soo.network%2Frpc`;
    }

    static getUrlToToken(address: string): string {
        return `https://solscan.io/token/${address}?cluster=custom&customUrl=https%3A%2F%2Frpc.testnet.soo.network%2Frpc`;
    }

    static getUrlToAddress(address: string): string {
        return `https://solscan.io/address/${address}?cluster=custom&customUrl=https%3A%2F%2Frpc.testnet.soo.network%2Frpc`;
    }

    static getUrlToTransaction(signature: string): string {
        return `https://solscan.io/tx/${signature}?cluster=custom&customUrl=https%3A%2F%2Frpc.testnet.soo.network%2Frpc`;
    }
    
}