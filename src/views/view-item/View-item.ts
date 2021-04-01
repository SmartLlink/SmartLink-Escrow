import { Component, Vue } from 'vue-property-decorator';
import {
  BeaconEvent,
  defaultEventCallbacks,
  NetworkType
} from "@airgap/beacon-sdk";
import { BeaconWallet } from "@taquito/beacon-wallet";

import offers from "../../demo-data/offers.json"
import info from "../../demo-data/types-info.json"
import contractUtils from "@/contract/utils"
import dataUtils from "@/demo-data/utils"

import { ContractAbstraction, TezosToolkit, Wallet } from "@taquito/taquito"
import { namespace } from 'vuex-class'
import Navigation from '@/components/navigation/Navigation.vue';

const contract = namespace('contract')
const user = namespace('user')

const Tezos = new TezosToolkit("https://edonet.smartpy.io")

@Component({
  components: {
    Navigation
  },
})
export default class Buy extends Vue {

  public drawer = true;

  public contractUtils = new contractUtils(this.$store.state.contract.contractAddress)
  public storage: any;
  public info = info;

  public id = this.$route.params.id
  public data:any = offers.find(data => data.id === this.$route.params.id);
  public isItemAvailable = false;
  public loaded = false;
  public commission = 0
  public slashing_rate = this.$store.state.contract.slashingRate
  public fees = 0
  public total = 0
  public isPaymentInProcess = false;
  public isPaymentSuccessful = false;
  public paymentFailed = false;
  public dataUtils = new dataUtils()
  
  @user.Action
  public updateRemoved!: (item: string) => void

  private wallet = new BeaconWallet({
    name: "Escrow DApp",
    eventHandlers: {
      // Overwrite standard behavior of certain events
      [BeaconEvent.PAIR_INIT]: {
        handler: async (syncInfo) => {
          // Add standard behavior back (optional)
          await defaultEventCallbacks.PAIR_INIT(syncInfo);
          console.log("syncInfo", syncInfo);
        },
      },
    },
  });

  async beforeMount() {
    if (typeof this.data !== 'undefined') {
      
      this.storage = await this.contractUtils.getContractStorage()
      const exchanges = this.contractUtils.getMap(this.storage, "exchanges")

      if ((((this.$route.name==='Buy item') && (this.data.type==='sale')) || ((this.$route.name==='Offer') && (this.data.type==='offer'))) && !exchanges.has(this.data!.id))
      {
        const commission = this.contractUtils.getCommission(this.storage, this.data!.escrow_type)
        this.dataUtils.updateDefaultData(this.data, commission, this.slashing_rate)
        this.isItemAvailable = true;
        
      }
      else if ((this.$route.name === 'Order') && exchanges.has(this.data!.id))
      {
        const exchange = exchanges.get(this.data!.id)
        this.dataUtils.updateDataWithExchange(this.data, exchange)
        this.isItemAvailable = true;     
      }
    }

    this.loaded = true;

  }

  async action(action_to_perform:string) {
    this.paymentFailed = false
    this.isPaymentInProcess = true;
    Tezos.setWalletProvider(this.wallet);
    // Request permissions
    await this.wallet.client.requestPermissions({ network: { type: NetworkType.EDONET } })
      .then(() => Tezos.wallet.at(this.$store.state.contract.contractAddress))
      .then((contract) =>{
        console.log(action_to_perform)
         if(action_to_perform==="init-escrow") return this.addNewExchange(contract)
         else if(action_to_perform==="validate") return this.validateExchange(contract)
        }
        )
      .then((transaction) => transaction!.send({ amount: this.data!.total }))
      .then((operation) => operation.confirmation())
      .then(() => {
        this.isPaymentSuccessful = true;
        this.isPaymentInProcess = false;
      })
      .catch((error) => {
        console.log(error);
        this.isPaymentSuccessful = false;
        this.paymentFailed = true
        this.isPaymentInProcess = false
      });
  }

  addNewExchange(contract:ContractAbstraction<Wallet>){
    return contract.methods.addNewExchange(
      this.data!.name,
      this.data!.escrow_type,
      this.data!.id,
      this.data!.price * 1000000,
      this.data!.seller
    )
  }

  validateExchange(contract:ContractAbstraction<Wallet>){
    return contract.methods.validateExchange(
      this.data!.id
    )
  }

  removeItem(id:string)
  {
    if(!this.$store.state.user.removed.includes(id)) this.updateRemoved(id);
  }

}