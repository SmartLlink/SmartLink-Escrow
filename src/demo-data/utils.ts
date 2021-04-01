import states from "./states.json"

export default class dataUtils {
    public states:any = states;

    async updateDefaultData(data: any, commission: number, slashing_rate:number) {
        let fees = data.price * ((slashing_rate / 100) + (commission / 100))
        Object.assign(data, {
            state: this.states['default_'+data.type],
            commission: commission,
            slashing: slashing_rate,
            total: data.price + fees,
            fees: fees.toFixed(2)
        })
    }

    updateDataWithExchange(data: any, exchange:any) {
        data.date = exchange.lastUpdate
        Object.assign(data, {
            state: this.states[exchange.state],
            commission: exchange.paid_price.commission/1000000,
            slashing: exchange.paid_price.slashing/1000000,
            total: exchange.paid_price.escrow/1000000,
            fees: (data.shipping + exchange.paid_price.slashing/1000000 + exchange.paid_price.commission/1000000).toFixed(2)
        })
    }
    
}
