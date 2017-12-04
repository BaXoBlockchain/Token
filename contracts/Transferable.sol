pragma solidity ^0.4.18;

import "./Ownable.sol";

contract Transferable is  Ownable
{
    bool public allowTransfers;
    
    event OnSetTransfer(address sender,bool newState);
    
    modifier canTransfer()
    {
        require(allowTransfers);
        _;
    }
    
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
