var BackendLedger = artifacts.require("./BackendLedger.sol");
var LinkedLedgerToken = artifacts.require("./LedgerLinkedToken.sol");
//var NoInterfaceToken = artifacts.require("../test/TestNoInterfaceToken.sol");

module.exports = function(deployer,network,accounts) {
  let ledger,token;
  let regulatotAddress = accounts[0];
  
  deployer.deploy(BackendLedger);
  return BackendLedger.deployed()
  .then(instance => {

  ledger = instance;
    console.log("Ledger address: " ,ledger.address);
    deployer.deploy(LinkedLedgerToken,ledger.address,1);
    
   });
}
     