import { Component, Vue } from 'vue-property-decorator';
import { TezosToolkit } from "@taquito/taquito";
import { TempleWallet } from '@temple-wallet/dapp';
import contractCode from "../../contract/Escrow-contract.json"
import contractUtils from "../../contract/utils"

import { namespace } from 'vuex-class'
const contract = namespace('contract')
const user = namespace('user')

import data from "../../demo-data/offers.json"
const Tezos = new TezosToolkit('https://edonet.smartpy.io')

@Component
export default class Home extends Vue {

  public wallets = {
    1: "https://airgap.it/",
    2: "https://cryptonomic.tech/galleon.html",
    3: "https://wallet.kukai.app/",
    4: "https://www.ledger.com/",
    5: "https://spirewallet.com/",
    6: "https://templewallet.com/"
  }

  public step = 1;

  public originating = false;

  public originatingCompleted = false;

  public address: string | null = "";
  public offers: any[] = data.filter((data) => data.type === "offer");;

  public contractAddress = ""
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

  private wallet =  new TempleWallet("SmartLink Demo DApp");

  async originateContract() {
    // Request permissions
    const available = await TempleWallet.isAvailable();
    
    if (!available) {
      throw new Error("Temple Wallet not installed");
    }
    await this.wallet.connect('edo2net');
    
    Tezos.setWalletProvider(this.wallet);
   
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
