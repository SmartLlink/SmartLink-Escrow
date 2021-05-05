import smartpy as sp

# The Exchange structure represents any exchange initialized in the contract. It takes as parameters:
# -  the seller of the goods
# -  the buyer of the goods whose tokens are going to be held in the contract
# -  the type of the exchange (by default in the demo it can only be a DOMAIN_NAME)
# -  the timestamp of last update of the state of the exchange
# -  a structure representing the total_escrow with the following fields: 
#    -  the amount sent to be stored in the contract
#    -  the calculated slashing amount: the incentive for the buyer to validate the exchange at the end of the escrow; If he validates the exchange he gets the slashing amount back, if not, he looses it.
#    -  the calculated commission amount: the commission on the escrow type that is sent to the contract owne at the end of the exchange 
#    -  the price of the goods set by the seller
# - the hash of the domain name
Exchange = sp.TRecord(
            seller = sp.TAddress, 
            buyer = sp.TAddress,
            state = sp.TString, 
            exchange_type = sp.TString, 
            lastUpdate = sp.TTimestamp, 
            total_escrow = sp.TRecord(
                escrow = sp.TMutez, 
                slashing = sp.TMutez, 
                commission = sp.TMutez, 
                asked_price = sp.TMutez,
                shipping = sp.TMutez),
            domain_name = sp.TString
        )

class Escrow(sp.Contract):
    # The Escrow constructor takes as parameters:
    # - The address of the owner of the contract
    # - The slashing rate
    def __init__(self, owner, slashing_rate):
        self.init(owner = owner, 
        slashing_rate = slashing_rate,
        exchange_types = sp.map(l={"DOMAIN_NAME":5, "OBJECT":3, "OTHER":2}, tkey = sp.TString, tvalue = sp.TNat),
        exchange_states = sp.vector(["WAITING_FOR_TRANSFER", "WAITING_FOR_VALIDATION", "VALIDATED","CANCELLED"]),
        exchanges = sp.map(tkey = sp.TString, tvalue = Exchange)
    )
    
    # The is_owner function is used internally by the contract to check if the sender of a transaction is the owner of the contract defined in the storage. It takes as paramaters:
    # - the address of the sender of the transaction
    def is_owner(self, sender):
        return self.data.owner == sender
    
    # The updateEscrowType entry point allows the owner of the contract to add a new exchange type or to update the existing ones. It takes as parameters:
    # - The escrow type name
    # - The commission associated to the escrow type
    @sp.entry_point
    def updateExchangeType(self, params):
        sp.set_type(params, sp.TRecord(
            escrow_type = sp.TString, 
            commission = sp.TNat).layout(('escrow_type', 'commission')))
        sp.verify(self.is_owner(sp.sender), message = "Only the owner of the contract can update the escrow types")
        self.data.exchange_types[params.escrow_type] = params.commission
    
    # The changeOwner entry point allows the owner of the contract defined in the storage to set a new owner  
    @sp.entry_point
    def changeOwner(self, params):
        sp.set_type(params, sp.TRecord(new_owner = sp.TAddress))
        sp.verify(self.is_owner(sp.sender), message = "Only the owner of the contract can designate a new owner")
        self.data.owner = params.new_owner

    # The calculate_percentage function is used internally by the contract to calculate the commission and the slashing amount. It takes as parameters:
    # - the price of the goods set by the seller
    # - the percentage that sould be computed
    def calculate_percentage(self, amount, percentage):
        return sp.split_tokens(amount, percentage, 100)
      
    # The addNewExhange entry point is used by a buyer to initialize a new exchange. It must fit the following statements:
    # - The exchange type must exist in the storage
    # - The amount sent by the buyer must be greater than the price set by the seller + the commission amount + the slashing amount
    # - The buyer should not have any ongoing exhanges
    # It takes the following paramets:
    # - The seller address
    # - The exchange type
    # - The price of the goods set by the buyer
    # - the hash of the domain name
    @sp.entry_point
    def addNewExchange(self, params):
        sp.set_type(params, sp.TRecord(
            id = sp.TString,
            seller = sp.TAddress, 
            exchange_type = sp.TString, 
            price = sp.TMutez, 
            shipping = sp.TMutez,
            domain_name = sp.TString))
        sp.verify(self.data.exchange_types.contains(params.exchange_type), "The type"+params.exchange_type+" does not exist")
        
        commission = self.calculate_percentage(params.price, self.data.exchange_types[params.exchange_type])
        slashing = self.calculate_percentage(params.price, self.data.slashing_rate)
        
        sp.verify(sp.amount >= params.price + commission + slashing + params.shipping, message = "The amount sent is not enough")
        sp.verify(~(self.data.exchanges.contains(params.id)), message= "The exchange for this item already exists")
     
        new_exchange = sp.record(
            buyer = sp.sender,
            seller = params.seller, 
            state = self.data.exchange_states[0], 
            exchange_type = params.exchange_type, 
            lastUpdate = sp.now, 
            total_escrow = sp.record(
                escrow = sp.amount, 
                slashing = slashing, 
                commission = commission, 
                shipping = params.shipping,
                asked_price = params.price), 
            domain_name = params.domain_name)
        
        self.data.exchanges[params.id] = new_exchange
    
    # The validateSellerTransmission entry point is used by the owner of the contract to confirm that the seller transmitted the domain name code to the buyer. The owner can validate the seller transmission only of the exchanges that are awaiting for it. It takes the following parameters:
    # - The buyer address
    @sp.entry_point
    def validateSellerTransmission(self, params):
        sp.set_type(params, sp.TRecord(id = sp.TString))
        sp.verify(self.is_owner(sp.sender), message = "Only the owner of the contract can validate the transmission of the goods")
        sp.verify(self.data.exchanges.contains(params.id), message = "The exchange does not exist")
        sp.verify_equal(self.data.exchanges[params.id].state, self.data.exchange_states[0])
        self.data.exchanges[params.id].state = self.data.exchange_states[1]
        self.data.exchanges[params.id].lastUpdate = sp.now
    
    # The validateExchange entry point is used by the buyer or the owner of the contract to validate that the buyer received what he bought. The slashing amount held in the contract is collected by the caller of this function. The commission is sent to the owner of the contract, and the seller receives the price of the goods. Only the exchanges awaiting for validation can be validated. The function takes the following parameters:
    # - The buyer address
    
    @sp.entry_point
    def validateExchange(self, params):
        sp.set_type(params, sp.TRecord(id = sp.TString))
        sp.verify(self.is_owner(sp.sender) | (self.data.exchanges[params.id].buyer == sp.sender), message= "Only the owner of the contract or the buyer can validate the reception of the goods")
        sp.verify(self.data.exchanges.contains(params.id),  message = "The exchange does not exist")
        sp.verify_equal(self.data.exchanges[params.id].state, self.data.exchange_states[1],  message = "The exchange is not waiting for a validation")
        
        sp.send(sp.sender, self.data.exchanges[params.id].total_escrow.slashing) 
        sp.send(self.data.owner, self.data.exchanges[params.id].total_escrow.commission)
            
        sp.send(self.data.exchanges[params.id].seller, (self.data.exchanges[params.id].total_escrow.asked_price + self.data.exchanges[params.id].total_escrow.shipping))
        self.data.exchanges[params.id].state = self.data.exchange_states[2]   
        self.data.exchanges[params.id].lastUpdate = sp.now   
        
@sp.add_test(name="Escrow")
def test():
    
    scenario = sp.test_scenario()
    scenario.h1("Escrow tests")

    scenario.table_of_contents()
    
    owner = sp.test_account("Owner")
    alice = sp.test_account("Alice")
    bob = sp.test_account("Robert")
    
    scenario.h1("Accounts")
    scenario.show([owner, alice, bob])
    
    slashing_rate = 5
    
    scenario.h1("Contract")
    escrow_contract = Escrow(owner.address, slashing_rate)

    scenario += escrow_contract
    scenario.h2("Escrow types update")
    scenario.h3("Owner adds a new type")
    scenario += escrow_contract.updateExchangeType(escrow_type ="DOMAIN_NAME", commission = 3).run(sender = owner)
    scenario.h3("Owner updates a type")
    scenario += escrow_contract.updateExchangeType(escrow_type ="DOMAIN_NAME", commission = 5).run(sender = owner)
    scenario.h3("Alice tries to update a type but is not the owner")
    scenario += escrow_contract.updateExchangeType(escrow_type ="TEST", commission = 5).run(sender = alice, valid = False)

    scenario.h2("Init a new exchange")
    scenario.h3("Bob tries to init a new exchange of a type that does not exist")
    scenario += escrow_contract.addNewExchange(id = "1", seller = alice.address, exchange_type = sp.string("DOMAINNAME"), price = sp.mutez(13500000), shipping = sp.mutez(0), domain_name = sp.string("be9bcb44747656f3132fa9b922a28ccf92f0fc71fcae4ecb8dd6812603a8b597")).run(sender = bob, amount = sp.mutez(25000000), valid = False)
    scenario.h3("Bob inits a new exchange with Alice but sends too few tezos")
    scenario += escrow_contract.addNewExchange(id = "2", seller = alice.address, exchange_type = sp.string("DOMAIN_NAME"), price = sp.mutez(13500000), shipping = sp.mutez(10000000), domain_name = sp.string("be9bcb44747656f3132fa9b922a28ccf92f0fc71fcae4ecb8dd6812603a8b597")).run(sender = bob, amount = sp.mutez(24000000), valid = False)
    scenario.h3("Bob inits a new exchange with Alice")
    scenario += escrow_contract.addNewExchange(id = "3", seller = alice.address, exchange_type = sp.string("DOMAIN_NAME"), price = sp.mutez(13500000), shipping = sp.mutez(0), domain_name = sp.string("be9bcb44747656f3132fa9b922a28ccf92f0fc71fcae4ecb8dd6812603a8b597")).run(sender = bob, amount = sp.mutez(25000000))
    scenario.h3("Bob tries to init a new exchange that is already taken")
    scenario += escrow_contract.addNewExchange(id = "3", seller = alice.address, exchange_type = sp.string("DOMAIN_NAME"), price = sp.mutez(13500000), shipping = sp.mutez(10000000), domain_name = sp.string("be9bcb44747656f3132fa9b922a28ccf92f0fc71fcae4ecb8dd6812603a8b597")).run(sender = bob, amount = sp.mutez(25000000), valid = False)
    scenario.h3("Bob inits a new exchange while he has an ongoing one")
    scenario += escrow_contract.addNewExchange(id = "4", seller = alice.address, exchange_type = sp.string("DOMAIN_NAME"), price = sp.mutez(13500000), shipping = sp.mutez(10000000), domain_name = sp.string("be9bcb44747656f3132fa9b922a28ccf92f0fc71fcae4ecb8dd6812603a8b597")).run(sender = bob, amount = sp.mutez(25000000))
    
    scenario.h2("Validate seller transmission")
    scenario.h3("Bob tries to confirm the transfer but he is not the owner")
    scenario += escrow_contract.validateSellerTransmission(id = "3").run(sender = bob, valid = False)
    scenario.h3("Owner tries to confirm an exchange, but it does not exist")
    scenario += escrow_contract.validateSellerTransmission(id = "5").run(sender = owner, valid = False)
    scenario.h3("Owner confirms the transfers")
    scenario += escrow_contract.validateSellerTransmission(id = "3").run(sender = owner)
    scenario += escrow_contract.validateSellerTransmission(id = "4").run(sender = owner)
    scenario.h3("Owner tries to confirm a transfer, but it is not awaiting for confirmation")
    scenario += escrow_contract.validateSellerTransmission(id = "3").run(sender = owner, valid = False)
    
    scenario.h2("Validate an exchange without slashing")
    scenario.h3("Bob validates his exchange and receives back his tokens")
    scenario += escrow_contract.validateExchange(id = "3").run(sender = bob)
    scenario.h3("Owner tries to validate an exchange but it is not awaiting for validation")
    scenario += escrow_contract.validateExchange(id = "3").run(sender = owner, valid = False)
    
    scenario.h2("Validate an exchange with slashing")
    scenario.h3("Owner validates the exchange")
    scenario += escrow_contract.validateExchange(id = "4").run(sender = bob)