var BackendLedger = artifacts.require("./BackendLedger.sol");
//var TestNoInterfaceToken = artifacts.require("./TestNoInterfaceToken.sol");
var TestNoInterfaceToken = artifacts.require("../test/TestNoInterfaceToken.sol");

module.exports = function(deployer,network,accounts) {
  let ledger,noIntefaceToken;
  let regulatotAddress = accounts[0];
  
   return BackendLedger.deployed()
  .then(instance => {

  ledger = instance;
    console.log("Ledger address: " ,ledger.address);
    deployer.deploy(TestNoInterfaceToken,ledger.address,5);
    
   });
}
     