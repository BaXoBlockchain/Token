pragma solidity ^0.4.18;

import "./OpenZeppelin/Ownable.sol";

/**
 * @title Transferable Ownable 
 * @dev Define transferablility  
 */

contract Transferable is  Ownable
{
    
    //bool public allowTransfers;
    
    /* Holds the transfer type */
    enum TransfersType {NotAllowed, OnlyOwner, Allowed}
    
    /* Holds whether transfers are allowed */
    TransfersType public allowTransfers = TransfersType.NotAllowed;
    
    /* Log Events */
    event OnSetTransfer(address sender,uint newState);
    
    /** @dev Modifier for allow transfers 
    */
    modifier canTransfer()
    {
        require(
            allowTransfers == TransfersType.Allowed  ||
            (owner == msg.sender && allowTransfers == TransfersType.OnlyOwner)
               );
        _;
    }

    /**
     * @dev Sets whether transfers are allows
     * @param newValue whether transfers are allowed
    */
    function setTransfers(uint newValue)
    onlyOwner
    public
    returns(bool)
    {
      //make sure the value is in limit bound
      require(uint(TransfersType.Allowed) >= newValue);
      
      //make sure this is a new value
      require(uint(allowTransfers) != newValue);
      
      //make the change  
      allowTransfers = TransfersType(newValue);
      
      //log the event
      OnSetTransfer(msg.sender,uint(allowTransfers));
        
      return true;
    }
    
   
}
