pragma solidity ^0.4.18;

import "./OpenZeppelin/BasicMintable.sol";
import "./LedgerLinkedTokenInterface.sol";

/**
 * @title BackendLedger
 * @dev Backend Ledger for all tokens balances and transfers operations
 * @dev Single ledger that supports mulitple upgradeable tokens balances
 */
contract BackendLedger is BasicMintable
{
    using SafeMath for uint256;
    
    /** Holds decimals for token */
    uint8 public decimals = 18;
    
    /** Holds the operator or the ledger */
    address public operator;
    
    /** Previous linked tokens */
    address[] public prevLinkedTokens;
    
    /** event on opertor setting */
    event OnOperatorSet(address oldOperator, address newOperator);
    

    /**
    * @dev operations allowed only by the operator of the ledger
    */ 
    modifier onlyOperator()
    {
        require(msg.sender == operator);
        _;
    }
    
    /**
     * @dev Constructor sets the first operator to be the owner
     */
    function BackendLedger()
    public
    {
        //totalSupply = 1 * 10 ** uint256(decimals);
        operator = msg.sender; //set first operator to be owner
        OnOperatorSet(address(0), operator);
        
    }
    
    /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint in full size.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
      require(owner != operator); //ledger can only mint after operator was defined
      require(super.mint(_to,_amount));
      
      //Update the token's total supply
      LedgerLinkedTokenInterface token = LedgerLinkedTokenInterface(operator);
      require(token.syncTotalSupply());
      
      return true;
  }

   /**
     * @dev Sets new operator
     * @param token New oprator to update
     */ 
    function setOperatorToken(LedgerLinkedTokenInterface token)
    onlyOperator
    public
    returns(bool)
    {
        require(token != address(0));
        require(token != operator);
        require(token.isLedgerLinkedToken());
        
        //sync with token supply
        token.syncTotalSupply();
            
        prevLinkedTokens.push(operator); //save prev tokens
        operator = token; //give away control
        
        OnOperatorSet(msg.sender, token);
        
       
        return true;
    }
    
 /**
  * @dev transfer token for a specified address only for the owner
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value)
  public
  onlyOwner
  returns (bool) 
  {
      return super.transfer(_to,_value);
  }
  
  /**
  * @dev Checks modifier and allows transfer if tokens are not locked.
  * @param _from The address that will send the tokens.
  * @param _to The address that will recieve the tokens.
  * @param _value The amount of tokens to be transferred.
  */
  function transferFrom(address _from, address _to, uint _value) 
  onlyOperator
  public
  returns(bool)
  {

    require(_to != address(0));
    require(_value <= balances[_from]);
    
    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
   
    Transfer(_from, _to, _value);
    return true;
  }
    
    
}
