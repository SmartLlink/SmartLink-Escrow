/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages Orders page functionalities
 */

// Vue
import { Component, Vue } from 'vue-property-decorator';
import Navigation from '@/components/navigation/Navigation.vue';

// Data
import offers from "../../demo-data/offers.json"
import states from "../../demo-data/states.json"

// Utils
import contractUtils from "../../contract/utils"
import dataUtils from "../../demo-data/utils"

// Vue data store / Local storage
import moment from "moment"



@Component({
    components: {
        Navigation
    },
})
export default class Sales extends Vue {
    // Display Vue booleans
    public drawer: boolean = true;
    public loadTable: boolean = true;
    public error: boolean = false;

    // Smart contract information
    public slashing_rate: number = this.$store.state.contract.slashingRate
    public storage: any;

    // Data
    public data = offers;
    public states: any = states;

    // Tables display data
    public headers: Array<String> = ["Product", "Seller", "State", "Total", ""];
    public offers_period: string | null = "";
    public purchases_period: string | null = "";

    // Utils
    public contractUtils: contractUtils = new contractUtils(this.$store.state.contract.contractAddress)
    public dataUtils: dataUtils = new dataUtils();

    /**
     * Function that loads the data from the test data and the smart contract storage
     */
    loadData() {
        const exchanges = this.contractUtils.getMap(this.storage, "exchanges")
        this.data = this.data.filter((data) => exchanges.has(data.id))
        console.log(this.data)
        this.data.map((data) => {
            const exchange = exchanges.get(data.id)
            this.dataUtils.updateDataWithExchange(data, exchange)
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
    * @param {string} type - filters data depending on the type, it can be either offer or sale
    */
    filteredEvents(type: string) {
        const today = moment();
        const data = this.data.filter(data => data.type === type)
        // Filter the offers or the purches table
        const period = (type === 'offer') ? this.offers_period : this.purchases_period

        if (period == "day") {
            return data.filter(data => moment(data.date).toISOString().substr(0, 10) === today.toISOString().substr(0, 10))
        }
        else if (period == "week") {
            return data.filter(data => today.isoWeek() === moment(data.date).isoWeek())
        }
        else if (period == "month") {
            return data.filter(data => moment(data.date).toISOString().substr(0, 7) === today.toISOString().substr(0, 7))
        }
        else {
            return data
        }

    }

}
