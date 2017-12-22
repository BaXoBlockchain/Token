var BackendLedger = artifacts.require("./BackendLedger.sol");

module.exports = function(deployer,network,accounts) {
   
  deployer.deploy(BackendLedger);
  
}
     