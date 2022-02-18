import Web3 from "web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import console from "console";

class DappWallet {
    public chain_id: number
    constructor(chain_id: number) {
        this.chain_id = chain_id;
    }

    /**
     * getConnectedProvier
     */
    public getConnectedProvier() {
        console.log(this.chain_id)
    }
}