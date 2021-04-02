/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages Home page functionalities
 */

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
  public error_msg: string = "" // Error message to display if needed

  // Display booleans
  public originating: boolean = false; // Displays the loader during the contract origination
  public originatingCompleted: boolean = false; // Displays the contract address and the Go to Demo button once the origination is done and is successfull
  public error: boolean = false; // Displays an error if there is no Temple wallet installed
  public loadingContract: boolean = false;

  // smart contract interaction
  public address: string | null = ""; // Tezos address of the user
  public contractAddress: string = "" // Address of the contract
  public slashing_rate: number;

  // Data
  public nbOffers: number = data.filter((data) => data.type === "offer").length;

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
  private wallet = new TempleWallet("SmartLink Demo DApp");

  /**
  * Function that sets up the user waller and connects it to the DApp
  */
  async walletSetup() {
    // Check if Temple wallet is available
    const available = await TempleWallet.isAvailable();

    // Check if the wallet is available
    if (!available) {
      this.error = true;
      this.error_msg = "The Temple wallet is not available. \n"
      console.error(this.error_msg)
    }

    // Connect to Edo2 testnet
    await this.wallet.connect('edo2net');

    // Set the wallet provider to the Temple wallet
    Tezos.setWalletProvider(this.wallet);

    // Get the wallet address
    this.wallet.getPKH()
      .then((address) => this.address = address)
      .catch((error) => {
        this.error = true;
        this.error_msg = "Could not retrieve the public address from Temple Wallet \n"
        console.error(this.error_msg, error)
      })

  }

  /**
   * Function that returns the initial contract storage for the contract origination
   * @param {string} address - public address of the user originating the contract
   * @returns {JSON} - Michelson contract storage in a JSON form
   */
  initContractStorage(address: string) {
    return {
      "prim": "Pair",
      "args": [
        {
          "prim": "Pair",
          "args": [
            [
              { "prim": "Elt", "args": [ { "int": "0" }, { "string": "WAITING_FOR_TRANSFER" } ] },
              { "prim": "Elt", "args": [ { "int": "1" }, { "string": "WAITING_FOR_VALIDATION" } ] },
              { "prim": "Elt", "args": [ { "int": "2" }, { "string": "VALIDATED" } ] },
              { "prim": "Elt", "args": [ { "int": "3" }, { "string": "CANCELLED" } ] }
            ],
            [
              { "prim": "Elt", "args": [ { "string": "DOMAIN_NAME" }, { "int": "3" } ] },
              { "prim": "Elt", "args": [ { "string": "OBJECT" }, { "int": "2" } ] },
              { "prim": "Elt", "args": [ { "string": "OTHER" }, { "int": "1" } ] }
            ]
          ]
        },
        { "prim": "Pair", "args": [ [], { "prim": "Pair", "args": [ { "string": this.address }, { "int": "1" } ] } ] }
      ]
    }
  }

  /**
   * Function that originates the contract
   */
  async originateContract() {
    // Set up the wallet
    this.walletSetup()
      // Send the origination transaction
      .then(() => {
        this.originating = true;
        return Tezos.wallet.originate({
          code: contractCode,
          init: this.initContractStorage(this.address!)
        })
          .send()
      })

      // Get the originated contract
      .then((originationOp) => {
        return originationOp.contract();
      })

      // Get the contract address and update the local storage
      .then((contract) => {
        this.contractAddress = contract.address
        this.updateLocalStorage()
      })

      // Update the item info and end the origination
      .then(() => {
        this.updateItemsInfo();
        this.originating = false;
        this.originatingCompleted = true;
      })

      // Catch errors if any
      .catch((error) => {
        this.originating = false;
        this.error = true;
        this.error_msg = error.message
        console.error(this.error_msg, error)
      })
  }

  /**
   * Function that updates the offers local storage
   */
  updateItemsInfo() {
    this.updateNumberOfItems(this.nbOffers);

    // Reset past local storage information
    this.updateResetRemoved();
    this.updateResetViewed();
  }

  /**
   * Function that updates the contract local storage
   */
  async updateLocalStorage() {
    const cutils = new contractUtils(this.contractAddress)
    const storage = await cutils.getContractStorage()

    this.slashing_rate = cutils.getSlashingRate(storage)
    this.updateContract(this.contractAddress)
    this.updateSlashingRate(this.slashing_rate)
  }

  /**
   * Function that runs a given contract address if it exists
   */
  async openContract() {
    this.checkLocalStorage()
    this.loadingContract = true;
    await this.updateLocalStorage()
      .then(() => {
        this.$router.push('marketplace')
      })
      .catch((error) => {
        this.loadingContract = false;
        this.error = true;
        this.error_msg = "Could not access the contract storage. The contract address might be wrong or not exist. \n"
        console.error(this.error_msg, error)
      }
      )
  }


  /**
   * Function that checks the user local storage and updates its 
   */
  checkLocalStorage() {
    // Check if there is a vuex local storage: if it exists, retrieve the user object, else return null
    const user = (localStorage.getItem('vuex') !== null && typeof localStorage.getItem('vuex') !== undefined) ? JSON.parse(localStorage.getItem('vuex')!).user : null;
    // Check if the user exists, if it exists retrive the numberOfItems from the user object, else return null
    const nbOfItems = ((user !== null) && (typeof user !== undefined)) ? user.numberOfItems : null

    // Check if there is a vuex local storage: if it exists, retrieve the contract object, else return null
    const contract = (localStorage.getItem('vuex') !== null && typeof localStorage.getItem('vuex') !== undefined) ? JSON.parse(localStorage.getItem('vuex')!).contract : null;
    // Check if the contract exists, if it exists retrive the contractAddress from the contract object, else return null
    const contractAddress = (contract !== null && typeof contract !== undefined) ? contract.contractAddress : null;

    if (!(contractAddress === this.contractAddress && nbOfItems !== null && typeof nbOfItems !== undefined)) {
      // Update the number of items to default
      this.updateItemsInfo();
    }
  }

  /**
   * Function that sets the contracts depending on the local storage
   */
  beforeMount() {
    (this.$store.state.contract.contractAddress) ? this.contractAddress = this.$store.state.contract.contractAddress : ""
  }

}
