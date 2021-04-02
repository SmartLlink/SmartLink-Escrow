/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages the utility functions for smart contract interactions
 */

import { TezosToolkit } from "@taquito/taquito" // Allows to interact with the smart contract

const Tezos = new TezosToolkit("https://edonet.smartpy.io") // Uses the RPC of the EDO network

export default class contractUtils {
    public contractAddress: string;

    constructor(contractAddress: string) {
        this.contractAddress = contractAddress
    }

    /**
    * Function that gets the contract and retrieves its storage
    * @returns {Object} - smart contract's storage
    */
    public async getContractStorage() {
        const contract = await Tezos.contract.at(this.contractAddress);
        const storage: any = await contract.storage();
        return storage;
    }

    /**
    * Function that retrieves the slashing rate of a smart contract
    * @param {any} storage - smart contract's storage to parse
    * @returns {number} - smart contract's slashing rate
    */
    public getSlashingRate(storage: any) {
        return storage.slashing_rate.toNumber();
    }

    /**
    * Function that retrieves the commission for a given escrow_type
    * @param {any} storage - smart contract's storage to parse
    * @param {string} escrow_type - type of the escrow
    * @returns {number} - smart contract's slashing rate
    */
    public getCommission(storage: any, escrow_type: string) {
        const commission = storage.exchange_types.get(escrow_type);
        return commission.toNumber();
    }

    /**
    * Function that retrieves the data of the given 
    * @param {any} storage - smart contract's storage to parse
    * @param {string} data_name - name of the state variable to retrieve
    * @returns {Map} - map with all the items of the state variable
    */
    public getMap(storage: any, data_name: string) {
        let items = new Map()

        // Retrieve the map from the storage
        const data = storage[data_name]
        // Get all the keys of the map
        const keys = data.keyMap.keys()

        // For each key, get the value
        for (let key of keys) {

            key = key.replace(/"/g, "") // Strip the quotes from the key
            let item = data.get(key)

            // If the item exists, append it to the map
            if (typeof item !== 'undefined') {
                items.set(key, item)
            }
        }

        return items;
    }

}
