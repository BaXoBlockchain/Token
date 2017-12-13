pragma solidity ^0.4.18;

/**
 * @dev Inteface for ledger linked token 
 * Allow syncing the Backend Ledger total supply with the token's total supply
 */
contract LedgerLinkedTokenInterface 
{
    /**
     * @dev Sync the current total supply with the ledger's total supply
    */
    function syncTotalSupply()
    public
    returns(bool);   
}
