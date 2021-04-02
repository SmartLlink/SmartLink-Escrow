/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages the Admin page functionalities
 */

// Vue
import { Component, Vue } from 'vue-property-decorator'; // enables vue
import Navigation from "../../components/navigation/Navigation.vue" // Navigation side bar menu

// Data
import offers from "../../demo-data/offers.json" // Json with the items data
import info from "../../demo-data/types-info.json" // Info
import contractUtils from "../../contract/utils" // Contract utils functions

// Taquito and Beacon SDK
import { TezosToolkit } from "@taquito/taquito" // Tezos utils

import { TempleWallet } from '@temple-wallet/dapp';

const Tezos = new TezosToolkit("https://edonet.smartpy.io") // RPC of our choice

@Component({
  components: {
    Navigation
  },
})
export default class Sales extends Vue {
  // Booleans for the display
  public drawer: boolean = true; // Open or close the navigation side bar
  public loadTable: boolean = true;

  // Data
  public data = offers;
  public info = info;
  public itemsWaitingForTransfer: any = {}

  // Utils
  public contractUtils: contractUtils = new contractUtils(this.$store.state.contract.contractAddress)

  // Smart-contract storage variables
  public storage: any;
  public commissions = new Map();

  // Tables data
  public headers: Array<String> = ["Item", "Buyer", "Escrowed amount", ""]
  public commissions_headers: Array<String> = ["Variable", "Percentage"]

  // Display data
  public error: boolean = false;
  public error_msg: string = "";

  // Temple Wallet initialisation
  private wallet = new TempleWallet("SmartLink Demo DApp");

  /**
  * Function that sets up the user waller and connects it to the DApp
  */
  async walletSetup() {
    // Check if Temple wallet is available
    const available = await TempleWallet.isAvailable();

    if (!available) {
      this.error = true;
      this.error_msg += "The Temple wallet is not available. \n"
      console.error("The Temple wallet is not available")
    }

    // Connect to Edo2 testnet
    await this.wallet.connect('edo2net');

    // Set the wallet provider to the Temple wallet
    Tezos.setWalletProvider(this.wallet);

  }

  /**
    * Function called before the route mount that loads all the needed data
    */
  async beforeMount() {
    await this.loadItems()
    this.loadTable = false;
  }

  /**
    * Function that loads all the needed data from the smart cotnract storage
    */
  async loadItems() {
    this.storage = await this.contractUtils.getContractStorage(); // Get smart-contract storage
    this.commissions = this.contractUtils.getMap(this.storage, "exchange_types") // Get all the commissions
    this.itemsWaitingForTransfer = this.getItems("WAITING_FOR_TRANSFER") // Build the object with items waiting for transfer
  }

  /**
  * Function that gets all the exchanges with a specific state
  * @param {string} state - state of the retrieved exchanges
  * @return - updated object with the exchanges having a specific state
  */
  getItems(state: string) {
    const itemsInfo = this.contractUtils.getMap(this.storage, 'exchanges')
    let data = this.data.filter(data => (Array.from(itemsInfo.keys()).includes(data.id)) ? itemsInfo.get(data.id).state === state : false)
    data.map(data => Object.assign(data, itemsInfo.get(data.id), { confirmation: false }));
    return data;

  }

  /**
  * Function that updates the confirmation status of an object (used for the display of the button/progress loader)
  * @param items - items object we are working with
  * @param {string} id - id of the item getting its confirmation updated
  * @param {boolean} state - boolean representing the confirmation
  * @return - updated items object with the right confirmation
  */
  setConfirmation(items: any, id: string, state: boolean) {
    return items.map(
      (data: { id: string; confirmation: boolean; }) => {
        if (data.id === id) {
          data.confirmation = state
        }
        return data
      });
  }

  /**
  * Function that calls the validateSellerTransmission entrypoint of our smart contract for a specific item
  * @param {string} id - id of the item which seller transmission is validated
  */
  async validateSellerTransmission(id: string) {
    // set the item confirmation to true since we are starting the operation
    this.itemsWaitingForTransfer = this.setConfirmation(this.itemsWaitingForTransfer, id, true)

    Tezos.setWalletProvider(this.wallet); // set a wallet provider

    // Request the permission to use a wallet
    await this.walletSetup()
      .then(() => Tezos.wallet.at(this.$store.state.contract.contractAddress)) // Query the contract
      // Call the desired entrypoint
      .then((contract) => contract.methods.validateSellerTransmission(
        id
      )
      )
      .then((transaction) => transaction.send()) // Send the transaction
      .then((operation) => operation.confirmation()) // Get the confirmation of the transaction
      .then(() => {
        // If everything goes right, end the process and reload the items
        this.itemsWaitingForTransfer = this.setConfirmation(this.itemsWaitingForTransfer, id, false)
        this.loadItems()
      })
      .catch((error) => {
        console.log(error)
        this.error_msg = error.message
        this.itemsWaitingForTransfer = this.setConfirmation(this.itemsWaitingForTransfer, id, false)
      })
  }

}
