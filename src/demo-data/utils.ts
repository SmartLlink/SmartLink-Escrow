/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages the utility functions for the data management
 */
import states from "./states.json"

export default class dataUtils {
    public states:any = states;

    async updateDefaultData(data: any, commission: number, slashing_rate:number) {
        let fees = data.price * ((slashing_rate / 100) + (commission / 100))
        Object.assign(data, {
            state: this.states['default_'+data.type],
            commission: commission,
            slashing: slashing_rate,
            total: data.price + fees + data.shipping,
            fees: fees.toFixed(2)
        })
    }

    updateDataWithExchange(data: any, exchange:any) {
        data.date = exchange.lastUpdate
        data.shipping = exchange.total_escrow.shipping/1000000
        Object.assign(data, {
            state: this.states[exchange.state],
            commission: exchange.total_escrow.commission/1000000,
            slashing: exchange.total_escrow.slashing/1000000,
            total: exchange.total_escrow.escrow/1000000,
            fees: (exchange.total_escrow.slashing/1000000 + exchange.total_escrow.commission/1000000).toFixed(2)
        })
    }
    
}
