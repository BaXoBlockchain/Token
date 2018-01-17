pragma solidity ^0.4.18;

import "./BackendLedger.sol";
import "./LedgerLinkedTokenInterface.sol";

/**
 * @title Linked Token BasicToken , Ownable, Transferable and implements LedgerLinkedTokenInterface 
 * @dev Updgradeable token, relaying on BackendLedger for balances and transfers
 */
contract LedgerLinkedToken is LedgerLinkedTokenInterface
{
    /**Ledger for the token */
    BackendLedger internal ledger;
    
    /**Ledger address for the token */
    address public ledgerAddress;
    
    /**Holds the new upgraded token address for future qurries - if no address exist then this is the most up to date token */
    address public newUpgradedToken;
    
    /**Holds token's properties */
    uint8 public decimals = 18;
    string public constant name = "BaXo Token";
    string public constant symbol = "BAXO";
    uint256 public version;
    
    /** log upgrade events */
    event LogUpgrade(address oldToken,address newToken);
    event LogSyncTotalSupply(uint newSupply);
    event LogNewToken(address newToken,address ledger, uint version);
    
    /**
    * @dev Modifier for ledger sender
    */ 
    modifier fromLedger()
    {
        require(msg.sender == ledgerAddress);
        _;
    }
    
    /**
    * @dev Constructor Creating a new token that is connected to a BackendLedger
    * @param existingLedger A BackendLedger that holds token's balances information
    */
    function LedgerLinkedToken(address existingLedger,uint newVersion)
    public
    {
       require(existingLedger != address(0));
       
       //set version
       version = newVersion;

       //set ledger
       ledger = BackendLedger(existingLedger);
       ledgerAddress = existingLedger;

       //log 
       LogNewToken(this,ledger,version);
       
    }     
    
  /**
  * @dev upgrade to a new Token by moving ledger operator rights
  * @param newToken A new upgraded token
  */
    function upgradeToken(LedgerLinkedToken newToken)
    onlyOwner
    public
    returns(bool)
    {
       require(newToken.ledgerAddress() == ledgerAddress); //must be same ledger
       require(newToken.version() > version); //must be different version
       require(ledger.setOperatorToken(newToken));
       newUpgradedToken = newToken;
       
       //sync the total supply with ledger
       totalSupply = ledger.totalSupply();
       LogSyncTotalSupply(totalSupply);
       LogUpgrade(this, newToken);
       
       return true;
       
    }

 
  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value)
  canTransfer
  public
  returns (bool) {
    require(_to != address(0));
    require(_value <= getBalance());

    // SafeMath.sub will throw if there is not enough balance.
    require(ledger.transferFrom(msg.sender,_to,_value));
    
    return true;
  }
  

    /**
     * @dev Reflect balance of msg.sender from the BackendLedger
     * @param owner Addess for balance check 
    */
    function balanceOf(address owner)
    constant
    public
    returns(uint)
    {
        return ledger.balanceOf(owner);
    }
 
    /**
     * @dev Reflect balance of msg.sender from the BackendLedger
    */
    function getBalance()
    constant
    public
    returns(uint)
    {
        return ledger.balanceOf(msg.sender);
    }
    
    /**
     * @dev Sync the current total supply with the ledger's total supply
    */
    function syncTotalSupply()
    fromLedger
    public
    returns(bool)
    {
        //sync the total supply with ledger
        totalSupply = ledger.totalSupply();
        LogSyncTotalSupply(totalSupply);
        return true;
    }
    
    
}

