// Vue
import { Component, Vue } from 'vue-property-decorator';

// Taquito (smart contract interactions)
import { TezosToolkit } from "@taquito/taquito";
import { TempleWallet } from '@temple-wallet/dapp';

// Utils
import contractCode from "../../contract/Escrow-contract.json"
import contractUtils from "../../contract/utils"

// Data stores
import data from "../../demo-data/offers.json"
import { namespace } from 'vuex-class'

const contract = namespace('contract')
const user = namespace('user')

const Tezos = new TezosToolkit('https://edonet.smartpy.io') // Connecting to Edo2 testnet RPC

@Component
export default class Home extends Vue {

  public wallets = {
    1: "https://templewallet.com/"
  }

  // VueJs display variables
  public step = 1; // Displays the information pannel or the origination pannel

  // Display booleans
  public originating = false; // Displays the loader during the contract origination
  public originatingCompleted = false; // Displays the contract address and the Go to Demo button once the origination is done and is successfull
  public walletAvailable = true; // Displays an error if there is no Temple wallet installed

  public address: string | null = ""; // Tezos address of the user
  public contractAddress = "" // Address of the contract

  // Data
  public offers: any[] = data.filter((data) => data.type === "offer");;

  // Setters; set contract and user data in the local storage
  @contract.Action
  public updateContract!: (contractAddress: string) => void

  @contract.Action
  public updateSlashingRate!: (slashingRate: number) => void

  @user.Action
  public updateNumberOfItems!: (numberOfItems: number) => void

  @user.Action
  public updateResetRemoved!: () => void

  @user.Action
  public updateResetViewed!: () => void
  
  // Temple Wallet initialisation
  private wallet =  new TempleWallet("SmartLink Demo DApp");

  async walletSetup(){
    // Check if Temple wallet is available
    const available = await TempleWallet.isAvailable();
    
    if (!available) {
      this.walletAvailable = false;
      throw new Error("Temple Wallet not installed");
    }
    
    // Connect to Edo2 testnet
    await this.wallet.connect('edo2net');

    // Set the wallet provider to the Temple wallet
    Tezos.setWalletProvider(this.wallet);

    // Retrieve user's wallet
    this.address = await this.wallet.getPKH()
  }
  

  async originateContract() {
    // Set the wallet
    await this.walletSetup();

    const originationOp = await Tezos.wallet
      .originate({
        code: contractCode,
        init: {
          "prim": "Pair",
          "args": [
            {
              "prim": "Pair",
              "args": [
                [
                  { "prim": "Elt", "args": [{ "int": "0" }, { "string": "WAITING_FOR_TRANSFER" }] },
                  { "prim": "Elt", "args": [{ "int": "1" }, { "string": "WAITING_FOR_VALIDATION" }] },
                  { "prim": "Elt", "args": [{ "int": "2" }, { "string": "VALIDATED" }] },
                  { "prim": "Elt", "args": [{ "int": "3" }, { "string": "CANCELLED" }] }
                ],
                [
                  { "prim": "Elt", "args": [{ "string": "DOMAIN_NAME" }, { "int": "5" }] },
                  { "prim": "Elt", "args": [{ "string": "OBJECT" }, { "int": "3" }] },
                  { "prim": "Elt", "args": [{ "string": "OTHER" }, { "int": "2" }] }
                ]
              ]
            },
            { "prim": "Pair", "args": [[], { "prim": "Pair", "args": [{ "string": this.address }, { "int": "5" }] }] }
          ]
        }
      })
      .send();
    this.originating = true;

    const contract = await originationOp.contract();
    this.contractAddress = contract.address
    const storage: any = await contract.storage()
    this.updateContract(contract.address)
    this.updateSlashingRate(storage.slashing_rate)
    const nbOffers = this.offers.length;
    this.updateNumberOfItems(nbOffers);
    this.updateResetRemoved();
    this.updateResetViewed();
    this.originating = false;
    this.originatingCompleted = true;
  }

  async openContract() {
    const cutils = new contractUtils(this.contractAddress)
    const storage = await cutils.getContractStorage();
    const slashing_rate = cutils.getSlashingRate(storage)
    this.checkLocalStorage()
    this.updateContract(this.contractAddress)
    this.updateSlashingRate(slashing_rate)
    this.$router.push('marketplace')
  }

  checkLocalStorage() {
    const nbOffers = this.offers.length;

    const user = (localStorage.getItem('vuex') !== null && typeof localStorage.getItem('vuex') !== undefined) ? JSON.parse(localStorage.getItem('vuex')!).user : null;
    const nbOfItems = ((user !== null) && (typeof user !== undefined)) ? user.numberOfItems : null
    if (nbOfItems === null || typeof nbOfItems === undefined) {
      this.updateNumberOfItems(nbOffers);
    }

  }

  beforeMount() {
    (this.$store.state.contract.contractAddress) ? this.contractAddress = this.$store.state.contract.contractAddress : ""
  }

}
