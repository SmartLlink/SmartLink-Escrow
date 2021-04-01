// Vue
import { Component, Vue } from 'vue-property-decorator';
import Navigation from '@/components/navigation/Navigation.vue';

// Data
import offers from "../../demo-data/offers.json"
import states from "../../demo-data/states.json"

// Utils
import contractUtils from "../../contract/utils"
import dataUtils from "../../demo-data/utils"

// Local storage
import moment from "moment"
import { namespace } from 'vuex-class'

const user = namespace('user')

@Component({
    components: {
        Navigation
    },
})
export default class Sales extends Vue {

    // Vue display booleans
    public drawer = true;
    public loadTable = true;
    public error = false;

    // Smart contract variables
    public slashing_rate = this.$store.state.contract.slashingRate
    public storage: any;

    // Data
    public data = offers;
    public states: any = states;

    // Tables display info
    public headers = ["Product", "Seller", "Total", "", ""];
    public period: string | null = "";

    // Utils
    public contractUtils = new contractUtils(this.$store.state.contract.contractAddress)
    public dataUtils = new dataUtils();

    // Local storage
    @user.Action
    public updateViewed!: (item: string) => void

    @user.Action
    public updateRemoved!: (item: string) => void
    
    /**
     * Function that loads the data from the test data and the smart contract storage
     */
    loadData() {
        // Get the exchanges map
        const exchanges = this.contractUtils.getMap(this.storage, "exchanges")
        // Get all the offers items that are not in the exchanges map of the smart contract
        this.data = this.data.filter((data) => !exchanges.has(data.id) && data.type === "offer" && !this.$store.state.user.removed.includes(data.id))

        // Get the commission and update the data object
        this.data.map((data) => {
            const commission = this.contractUtils.getCommission(this.storage, data.escrow_type)
            this.dataUtils.updateDefaultData(data, commission, this.slashing_rate)
        })
    }

    /**
     * Function that prepares the data before the mount
     */
    async beforeMount() {
        this.storage = await this.contractUtils.getContractStorage();
        this.loadData();
        this.loadTable = false;
    }

     /**
     * Function that filters events depending on the selected period
     */
    filteredEvents() {
        const today = moment();

        if (this.period == "day") {
            return this.data.filter(data => moment(data.date).toISOString().substr(0, 10) === today.toISOString().substr(0, 10))
        }
        else if (this.period == "week") {
            return this.data.filter(data => today.isoWeek() === moment(data.date).isoWeek())
        }
        else if (this.period == "month") {
            return this.data.filter(data => moment(data.date).toISOString().substr(0, 7) === today.toISOString().substr(0, 7))
        }
        else {
            return this.data
        }

    }

     /**
     * Function that updates the view number after clicking "view"
     * @param {string} id - id of the viewed item
     */
    updateNotification(id:string) {
        if(!this.$store.state.user.viewed.includes(id)) this.updateViewed(id);
    } 
    
    /**
     * Function that checks if the item is viewed - Helps to display the "new" chip
     * @param {string} id - id of the item to check
     */
    isUnviewed(id:string){
        return !this.$store.state.user.viewed.includes(id)
    }

    /**
     * Function that removes the item of the offers list
     * @param {string} id - id of the item to remove
     */
    removeItem(id:string){
        if(!this.$store.state.user.removed.includes(id)) this.updateRemoved(id);
        this.loadData()
    }

}
