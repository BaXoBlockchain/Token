> Linked Ledger Token
> ===================
> 
> Description
> ---------- 
> This solution provides a way to connect a single ledger to a chain of linked tokens.  The goal of the design is to allow the
> development team to upgrade the token in a single atomic action. The
> action should force all token holders to participate in the upgrade
> process.  Transactions cost for the tokens will be relativity low and
> close to the standard tokens transfers cost. Anyone can create an
> upgrade for the token, but only the development team is allowed to
> connect the upgraded token to the BackendLedger for allowing
> transfers.  
> 
> Design
> -------------
> **BackendLedger**
> * The only contract that holds the balances of token holders at any given time
> * Allow to mint new tokens until minting is finished
> * Holds operator for doing transfers and owner to control minting
> * Holds the linked tokens that used the ledger in the past
> 
> **LinkedLedgerToken**
> * Token that is connected to a single back end ledger
> * Allow upgrading by passing the operator rights to the newly upgraded token
> * The only contract that allows transfers between holders
> 
> **How it work**
> 1. Owner should create a BackendLedger - by which he is both the owner and operator of the contract.
> 2. Owner should create a LinkedLedgerToken
> 3. Owner should call BackendLedger - setOperator(..) with the LinkedLedgerToken address - thus moving the operator rights to the
> Token.
> 4. Owner can mint tokens until minting is finished (can also take place after step 1).
> 5. Anyone can create a new LinkedLedgerToken with upgraded\bug fixes functionalities.
> 6. Owner is calling the upgradeToken(..) function with the newly upgraded token. All rights are transferred by the smart contract.
>
> **Test**
> 1. Run npm install
> 2. Run truffle compile
> 3. Run testrpc
> 4. Run truffle test

