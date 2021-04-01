/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages Marketplace page functionalities
 */

// Vue
import { Component, Vue } from 'vue-property-decorator';
import Navigation from '@/components/navigation/Navigation.vue';

// Dates
import moment from "moment"

// Data
import offers from "../../demo-data/offers.json"

// Utils
import contractUtils from "../../contract/utils"
import dataUtils from "../../demo-data/utils"

@Component({
    components: {
        Navigation
    },
})
export default class Sales extends Vue {
    // Display data
    public drawer: boolean = true;
    public loadTable: boolean = true;

    // Table and filters data
    public period: string | null = "";
    public headers: Array<String> = ["Product", "Seller", "Total", ""];

    // Smart-contract variables
    public slashing_rate: number = this.$store.state.contract.slashingRate
    public storage: any;

    // Data
    public data = offers;

    // Util variables
    public contractUtils: contractUtils = new contractUtils(this.$store.state.contract.contractAddress)
    public dataUtils: dataUtils = new dataUtils();

    /**
     * Function that loads the data from the test data and the smart contract storage
     */
    loadData() {
        // Get the exchanges map
        const exchanges = this.contractUtils.getMap(this.storage, "exchanges")
        // Get all the sold items that are not in the exchanges map of the smart contract
        this.data = this.data.filter((data) => !exchanges.has(data.id) && data.type === "sale")

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
}
