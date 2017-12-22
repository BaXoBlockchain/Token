pragma solidity ^0.4.18;

import "./Transferable.sol";
import "./OpenZeppelin/BasicToken.sol";


/**
 * @dev Inteface for ledger linked token 
 * Allow syncing the Backend Ledger total supply with the token's total supply
 */
contract LedgerLinkedTokenInterface is BasicToken, Transferable
{
    /**
     * @dev Sync the current total supply with the ledger's total supply
    */
    function syncTotalSupply()
    public
    returns(bool);  

    /** interface marker */
    function isLedgerLinkedToken()
    pure
    public
    returns(bool)
    { return true; } 
}
