// Vue
import { Component, Vue } from 'vue-property-decorator';
import Navigation from '@/components/navigation/Navigation.vue';

// Dates
import moment from "moment"

// Data
import offers from "../../demo-data/offers.json"
import states from "../../demo-data/states.json"

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
    public drawer = true;
    public error = false;
    public loadTable = true;
    public period: string | null = "";
    public headers = ["Product", "Seller", "Total", ""];

    // Smart-contract variables
    public slashing_rate = this.$store.state.contract.slashingRate
    public storage: any;
    public commissions_temp = new Map()

    // Data
    public data = offers;
    public states: any = states;
    
    // Util variables
    public contractUtils = new contractUtils(this.$store.state.contract.contractAddress)
    public dataUtils = new dataUtils();

    loadData() {
        const exchanges = this.contractUtils.getMap(this.storage, "exchanges")
        this.data = this.data.filter((data) => !exchanges.has(data.id) && data.type==="sale")
        console.log(this.data)
        this.data.map((data) => {
            //const commission = this.getCommission(data.escrow_type)
            const commission = this.contractUtils.getCommission(this.storage, data.escrow_type)
            this.dataUtils.updateDefaultData(data, commission, this.slashing_rate)
        })
    }

    async beforeMount() {
        this.storage = await this.contractUtils.getContractStorage();
        this.loadData();
        this.loadTable = false;
    }

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
