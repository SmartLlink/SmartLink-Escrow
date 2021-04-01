import { TempleWallet } from "@temple-wallet/dapp";
import { TezosToolkit } from "@taquito/taquito";

export default class WalletUtils {
    public wallet:TempleWallet;
    
    constructor()
    {
        this.wallet = new TempleWallet("SmartLink Demo DApp");
    }


    async walletSetup(Tezos:TezosToolkit, error:boolean, error_msg:string) {
        // Check if Temple wallet is available
        const available = await TempleWallet.isAvailable();
        
        if (!available) {
          error = true;
          error_msg += "The Temple wallet is not available. \n"
          console.error("The Temple wallet is not available")
        }
    
        // Connect to Edo2 testnet
        await this.wallet.connect('edo2net');
    
        // Set the wallet provider to the Temple wallet
        Tezos.setWalletProvider(this.wallet);
    
        return this.wallet;
      }
}
