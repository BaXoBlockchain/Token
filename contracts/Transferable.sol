pragma solidity ^0.4.18;

import "./OpenZeppelin/Ownable.sol";

/**
 * @title Ownable 
 * @dev Define transferablility  
 */

contract Transferable is  Ownable
{
    /* Holds whether transfers are allowed */
    bool public allowTransfers;
    
    /* Log Events */
    event OnSetTransfer(address sender,bool newState);
    
    /** @dev Modifier for allow transfers 
    */
    modifier canTransfer()
    {
        require(allowTransfers);
        _;
    }

    /**
     * @dev Sets whether transfers are allows
     * @param isAllowed whether transfers are allowed
    */
    function setTransfers(bool isAllowed)
    onlyOwner
    public
    returns(bool)
    {
        require(isAllowed != allowTransfers);
        
        allowTransfers = isAllowed;
        
        OnSetTransfer(msg.sender,allowTransfers);
        
        return true;
    }
    
   
}
