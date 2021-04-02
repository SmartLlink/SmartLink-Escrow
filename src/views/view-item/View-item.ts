// Vue
import { Component, Vue } from 'vue-property-decorator';
import Navigation from '@/components/navigation/Navigation.vue';

// Data
import offers from "../../demo-data/offers.json"
import info from "../../demo-data/types-info.json"

// Utils
import contractUtils from "@/contract/utils"
import dataUtils from "@/demo-data/utils"


// Taquito & Temple Wallet
import { ContractAbstraction, TezosToolkit, Wallet } from "@taquito/taquito"
import { TempleWallet } from '@temple-wallet/dapp';
const Tezos = new TezosToolkit("https://edonet.smartpy.io")

// Local storage
import { namespace } from 'vuex-class'
const user = namespace('user')

@Component({
  components: {
    Navigation
  },
})
export default class Buy extends Vue {

  // Vue Display booleans
  public drawer: boolean = true;
  public isPaymentInProcess: boolean = false;
  public isPaymentSuccessful: boolean = false;
  public paymentFailed: boolean = false;
  public isItemAvailable: boolean = false;
  public loaded: boolean = false;
  public error: boolean = false;

  // Vue display info
  public error_msg: string = ""

  // Utils
  public contractUtils: contractUtils = new contractUtils(this.$store.state.contract.contractAddress)
  public dataUtils: dataUtils = new dataUtils()

  // Smart contract info
  public storage: any;
  public slashing_rate: number = this.$store.state.contract.slashingRate

  // Data
  public info = info;
  public data: any = offers.find(data => data.id === this.$route.params.id);

  // Router params
  public id: string = this.$route.params.id

  // Local storage
  @user.Action
  public updateRemoved!: (item: string) => void

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
  * Function that prepares the data before the page load
  */
  async beforeMount() {
    // If the data exists for the given id in parameters
    if (typeof this.data !== 'undefined') {
      // Get the contract storage
      this.storage = await this.contractUtils.getContractStorage()
      // Get the exchanges map
      const exchanges = this.contractUtils.getMap(this.storage, "exchanges")
      // If we are looking at a marketplace page and it is an item for sale
      // Or if we are looking at the offers page and it is an offer item 
      // And that no one started an exchange for that item
      if ((((this.$route.name === 'Buy item') && (this.data.type === 'sale')) || ((this.$route.name === 'Offer') && (this.data.type === 'offer'))) && !exchanges.has(this.data!.id)) {
        // Get the commission
        const commission = this.contractUtils.getCommission(this.storage, this.data!.escrow_type)
        // Update the default data with the needed information
        this.dataUtils.updateDefaultData(this.data, commission, this.slashing_rate)
        this.isItemAvailable = true; // assert that the item is available and ready
      }
      // If we are looking at the orders page and the item has an init exchange
      else if ((this.$route.name === 'Order') && exchanges.has(this.data!.id)) {
        // get the smart contract information for that item
        const exchange = exchanges.get(this.data!.id)
        // Update the data with the exchange information
        this.dataUtils.updateDataWithExchange(this.data, exchange)
        this.isItemAvailable = true; // assert that the item is available and ready
      }
    }

    this.loaded = true; // Assert that the page is loaded

  }

  /**
   * Function that interacts with the smart contract depending on the state of the exchange
   * @param {string} action_to_perform - name of the action to perform (init an escrow or validate the exchange)
   */
  async action(action_to_perform: string) {
    // Reset the display booleans
    this.paymentFailed = false
    this.isPaymentInProcess = true;

    // Set the Temple wallet
    await this.walletSetup()
      // Interact with the contract
      .then(() => Tezos.wallet.at(this.$store.state.contract.contractAddress))
      // Call an entry point
      .then((contract) => {
        console.log(action_to_perform)
        if (action_to_perform === "init-escrow") return this.addNewExchange(contract)
        else if (action_to_perform === "validate") return this.validateExchange(contract)
      })
      // Send the transaction with the right amount
      .then((transaction) => transaction!.send({ amount: this.data!.total }))
      // Wait for the operation confirmation
      .then((operation) => operation.confirmation())
      // Display the right information
      .then(() => {
        this.isPaymentSuccessful = true;
        this.isPaymentInProcess = false;
      })
      .catch((error) => {
        console.error(error);
        this.error_msg = error.message
        this.isPaymentSuccessful = false;
        this.paymentFailed = true
        this.isPaymentInProcess = false
      });
  }

  /**
   * Function that calls the entry point addNewExchange of the smart contract
   * @param {ContractAbstraction<Wallet>} contract - contract object of the called contract
   */
  addNewExchange(contract: ContractAbstraction<Wallet>) {
    return contract.methods.addNewExchange(
      this.data!.name,
      this.data!.escrow_type,
      this.data!.id,
      this.data!.price * 1000000,
      this.data!.seller,
      this.data!.shipping * 1000000
    )
  }

  /**
   * Function that calls the entry point validateExchange of the smart contract
   * @param {ContractAbstraction<Wallet>} contract - contract object of the called contract
   */
  validateExchange(contract: ContractAbstraction<Wallet>) {
    return contract.methods.validateExchange(
      this.data!.id
    )
  }

  /**
   * Function that removes the item of the offers list
   * @param {string} id - id of the item to remove
   */
  removeItem(id: string) {
    if (!this.$store.state.user.removed.includes(id)) this.updateRemoved(id);
  }

}