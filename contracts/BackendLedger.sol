pragma solidity ^0.4.18;


import "./OpenZeppelin/BasicMintable.sol";
import "./LedgerLinkedTokenInterface.sol";

/**
 * @title BasicMintable
 * @dev Backend Ledger for all tokens balances and transfers operations
 * @dev Single ledger that supports mulitple upgradeable tokens balances
 */
contract BackendLedger is BasicMintable
{
    using SafeMath for uint256;
    
    uint8 public decimals = 2;
    
    // Holds the operator or the ledger
    address public operator;
    
    //previous linked tokens
    address[] public prevLinkedTokens;
    
    // event on opertor setting
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
        totalSupply = 1 * 10 ** uint256(decimals);
        operator = msg.sender; //set first operator to be owner
        OnOperatorSet(address(0), operator);
        
    }
    
    /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
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
     * @param _operator New oprator to update
     */ 
    function setOperator(address _operator)
    onlyOperator
    public
    returns(bool)
    {
        require(_operator != address(0));
        require(_operator != operator);
        
        //Check that _operator is implementing LedgerLinkedTokenInterface
        LedgerLinkedTokenInterface token = LedgerLinkedTokenInterface(_operator);
        require(token != address(0));
        
        
        prevLinkedTokens.push(operator); //save prev tokens
        operator = _operator; //give away control
        
        
        OnOperatorSet(msg.sender, operator);
        return true;
    }
    
    /**
   * @dev Checks modifier and allows transfer if tokens are not locked.
   * @param _to The address that will recieve the tokens.
   * @param _value The amount of tokens to be transferred.
   */
  function transfer(address _to, uint _value) 
  onlyOperator
  public
  returns(bool)
  {
    return super.transfer(_to, _value);
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
    
