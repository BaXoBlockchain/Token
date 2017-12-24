web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");
Promise.allSeq = require("../utils/sequentialPromise.js");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

if (typeof web3.version.getNodePromise === "undefined") {
    Promise.promisifyAll(web3.version, { suffix: "Promise" });
}

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const BackendLedger = artifacts.require("./BackendLedger.sol");
const LedgerLinkedToken = artifacts.require("./LedgerLinkedToken.sol");
const TestNoInterfaceToken = artifacts.require("./TestNoInterfaceToken.sol");

contract('Token Advanced Tests', function(accounts) {

    let ledger, token0, token1, noIntefaceToken,
        devTeam, user0, user1,user2;

    let isTestRPC;
        
    const mintValue = randomIntIn(500, 1000);
    const transferValue = randomIntIn(1, 100);
    
    before("should prepare", function() {
        assert.isAtLeast(accounts.length, 4);
        devTeam = accounts[0];
        user0 = accounts[1];
        user1 = accounts[2];
        user2 = accounts[3];
        return web3.version.getNodePromise()
        .then(node => isTestRPC = node.indexOf("TestRPC") > -1)
        .then(() => web3.eth.getBalancePromise(devTeam))
        .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
    });

    describe("Create Ledger", function() {
     
        beforeEach("Prepar ledger and a token", function() {
            return BackendLedger.new( { from: devTeam })
            .then(instance =>{
              ledger = instance;
              return LedgerLinkedToken.new(ledger.address,1,{from:devTeam})
            })
            .then(instance => {
                token0 = instance;
                console.log("First token deployed at: ", token0.address);
                return token0.setTransfers(true, {from:devTeam});
            })
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newState,true,"Token0 set transfers has failed");
                return LedgerLinkedToken.new(ledger.address,2,{from:devTeam})
            })
            .then(instance => {
                token1 = instance;
                console.log("Second token deployed at: ", token1.address);
                           
            });

        });
    

        describe("Token Minting", function() {

            it("Single Minting", function() {
              return ledger.mint(user0,mintValue, {from: devTeam})
            
            .then(() => {
               return ledger.balanceOf(user0, {from: user0});
            })
            .then(() => assert.isFalse(true,"Should fail to mint without linked token"))
            .catch(error => {
                console.log("Catching error as expected - ledger is not link to any token");
                return ledger.setOperatorToken(token0.address,{from:devTeam});
            })
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
                return ledger.mint(user0,mintValue, {from: devTeam});
            })

            .then(tx => {
                assert.strictEqual(tx.logs[0].args.to,user0,"Failed to mint tokensCreation to the correct user");
                assert.strictEqual(tx.logs[0].args.amount.toNumber(),mintValue,"Failed to mint the correct amount");
                return ledger.balanceOf(user0,{from: devTeam})
            })
            .then(balance => {
                assert.isAtLeast(balance.toNumber(), 500);
            })

         });

        const count = 1;
            it("Stress minting", function() {

              if (!isTestRPC) this.skip();

              //Set operator
              return ledger.setOperatorToken(token0.address,{from:devTeam})
             .then(tx => {
              assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
              this.slow(300000);
              const logValue = [];
              let overallMinting =0;
              let totalMintingCheck =0;
              for (let i = 1; i <= count; i++) {
              logValue.push(() => {
                process.stderr.write("Minting interation " + i + "          " + '\r');
                overallMinting += i;
                return ledger.mint(user0,i, {from: devTeam});
               });
              }
              return Promise.allSeq(logValue)
              .then(txs => {
               console.log("Starting log retrivals...");
                Promise.allSeq(txs.map((tx,i) => () =>{
                    //process.stderr.write("Retriving Minting interation " + i + "          " + '\r');
                    totalMintingCheck += tx.logs[0].args.amount.toNumber();
                    return i;
               }))
              
              .then(i=> { 
                if (i < count) return; //exit if on going iteration number
                assert.strictEqual(totalMintingCheck,overallMinting,"Invalid total miniting amount");
                console.log("Minited amount of " , totalMintingCheck, " was successfully verfied ");
              })

              })
            
            });

            });

            it("Interface Test", function() {
                return TestNoInterfaceToken.new(ledger.address,5,{from:devTeam})
            .then(instance => {
                noIntefaceToken = instance;
                console.log("Create new token without inteface at ", noIntefaceToken.address);
                return token0.isLedgerLinkedToken({from:devTeam})
            })
            .then(res => {
                assert.isTrue(res,"Should implement interface");
                return noIntefaceToken.isLedgerLinkedToken({from:devTeam})
            })
            .then(() => assert.isFalse(true,"Shouldn't implement interface"))
            .catch(error => {
                console.log("No interface was implemented as expected");
                return ledger.setOperatorToken(noIntefaceToken.address,{from:devTeam});
            })  
            .then(() => assert.isFalse(true,"Should faild to set a new operator token without implementing the interface"))
            .catch( error => {
                console.log("Successfully failed to set new operator with an invalid interface");
                return ledger.setOperatorToken(token0.address,{from:devTeam});
            })
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
                console.log("Valid operator token was set successfully");
            })
                            
            });  
            upgradeCount = 20;
            it("Upgrade token stress Test", function() {
               let token3;
               const upgrades = [];
               const tokensCreation = [];
               const tokensInstances = [];
                                
               return ledger.setOperatorToken(token0.address,{from:devTeam})
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
                this.slow(300000);
                                              
                for (let i = 1; i <= upgradeCount; i++) {
                    tokensCreation.push(() => {
                    process.stderr.write("Creating new token interation " + i + "          " + '\r');
                    return LedgerLinkedToken.new(ledger.address,i*100,{from:devTeam});
                    });
                }
                                                
                return Promise.allSeq(tokensCreation)
            })
            .then(txs => {
                 console.log("Starting Token initialzation...");
                 Promise.allSeq(txs.map((tx,i) => () =>{
                    //console.log("new Token: " , tx.address);
                    
                    if (i ==0) //upgrade first token - from token0
                    {
                       console.log("Push first token"); 
                       tokensInstances[0] = tx;
                       upgrades.push(() => {
                        return token0.upgradeToken(tokensInstances[0].address,{from:devTeam});
                       });
                    }
                    else //upgrade all other tokens
                    { 
                        tokensInstances[i] = tx;
                        upgrades.push(() => {
                        process.stderr.write("Deploying upgrade interation " + (i+1) + "          " + '\r');
                        return tokensInstances[i-1].upgradeToken(tokensInstances[i].address,{from:devTeam});
                        });
                    }

                    return i;
                   
                 }))

             
            
            .then(countOftokensCreation=> {
                //continue after all tokensCreation have been deployed
                assert.strictEqual(countOftokensCreation.length,upgradeCount,"Invalid upgrade count");
                
                console.log(" Done creation - Starting Token upgrade sequence...");
                console.log("upgrades count " , upgrades.length);
                console.log("tokens instance count " , tokensInstances.length);
                               
                return Promise.allSeq(upgrades)
                
            })
            
            .then(txs => { 
                 Promise.allSeq(txs.map((tx,i) => () =>{
                 assert.isAtLeast(tx.logs[0].args.newSupply,1,"Invalid amount of upgrade");
                 if (tx.logs[1].args.oldToken != token0.address) //skip first token
                 assert.strictEqual(tx.logs[1].args.oldToken, tokensInstances[i-1].address,"Invalid old token");
                 assert.strictEqual(tx.logs[1].args.newToken, tokensInstances[i].address,"Invalid old token");
                      return i;   
                 }))


            .then(countOfUpgrades=> {
                //continue after all tokensCreation have been deployed
                assert.strictEqual(countOfUpgrades.length,upgradeCount,"Invalid number of upgrades");
                console.log("All upgrades were successfully deployed");
          
            })
            })
            })    
               
            }); //close it
                        
            
        });

           
       
    });
});

