web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

if (typeof web3.version.getNodePromise === "undefined") {
    Promise.promisifyAll(web3.version, { suffix: "Promise" });
}

const BackendLedger = artifacts.require("./BackendLedger.sol");
const LedgerLinkedToken = artifacts.require("./LedgerLinkedToken.sol");

contract('Premission test contract', function(accounts) {

    let ledger, token0, token1,
        devTeam, user0, user1,user2, user3;
        
    const mintValue = randomIntIn(500, 1000);
    const transferValue = randomIntIn(1, 100);
    const address0 = "0x0000000000000000000000000000000000000000";

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
                return ledger.setOperatorToken(token0.address,{from:devTeam})
            })
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
                console.log("Set operator: ", token0.address);
            });

        });
    

        describe("Test basic permissions", function() {

         it("Test Minting permissions", function() {

              return ledger.setOperatorToken(token0.address,{from:devTeam})
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
                return ledger.mint(user0,mintValue, {from: user0});
            })
            .then(() => assert.isFalse(true,"Should fail to mint with invalid premissions user0"))
            .catch(error => {
                console.log("Catching error as expected - user0 premissions are invalid");
            return ledger.mint(user0,mintValue, {from: user1});
            })
            .then(() => assert.isFalse(true,"Should fail to mint with invalid premissions user1"))
            .catch(error => {
                console.log("Catching error as expected - user1 premissions are invalid");
                return ledger.mint(user0,mintValue, {from: token0});
            })
            .then(() => assert.isFalse(true,"Should fail to mint with invalid premissions token0"))
            .catch(error => {
                console.log("Catching error as expected - token0 premissions are invalid");
                return ledger.mint(user0,mintValue, {from: token1});
            })
            .then(() => assert.isFalse(true,"Should fail to mint with invalid premissions token1"))
            .catch(error => {
                console.log("Catching error as expected - token1 premissions are invalid");
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

          it("Test Transfer ledger permissions", function() {

              return ledger.setOperatorToken(token0.address,{from:devTeam})
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
                return ledger.transferFrom(user0,user1,mintValue, {from: user0});
            })
            .then(() => assert.isFalse(true,"Should fail to transfer funds with invalid premissions user0"))
            .catch(error => {
                console.log("Catching error as expected - user0 premissions are invalid");
                return ledger.transferFrom(user0,user1,mintValue, {from: user1});
            })
            .then(() => assert.isFalse(true,"Should fail to transfer funds with invalid premissions user1"))
            .catch(error => {
                console.log("Catching error as expected - user1 premissions are invalid");
                return ledger.transferFrom(user0,user1,mintValue, {from: devteam});
            })
            .then(() => assert.isFalse(true,"Should fail to transfer funds with invalid premissions devteam"))
            .catch(error => {
                console.log("Catching error as expected - devteam premissions are invalid");
                return ledger.transferFrom(user0,user1,mintValue, {from: token1.address});
            })
            .then(() => assert.isFalse(true,"Should fail to transfer funds with invalid premissions token1"))
            .catch(error => {
                console.log("Catching error as expected - token1 premissions are invalid");
                return ledger.transferFrom(user0,user1,mintValue,{from:token0.address});
            })
            .then(() => assert.isFalse(true,"Should fail to transfer funds without tokens private key"))
            .catch(error => {
                assert.include(error.toString(),"could not unlock signer account", "should fail on missing private key")
                console.log("Catching error as expected - token0 private key is missing");
            });
         }); //close it

           it("Test set operator ledger permissions", function() {

              return ledger.setOperatorToken(token0.address,{from:devTeam})
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
                return ledger.setOperatorToken(token1, {from: user0});
            })
            .then(() => assert.isFalse(true,"Should fail set new operator funds with invalid premissions user0"))
            .catch(error => {
                console.log("Catching error as expected - user0 premissions are invalid");
                return ledger.setOperatorToken(token1, {from: user1});
            })
            .then(() => assert.isFalse(true,"Should fail set new operator funds with invalid premissions user1"))
            .catch(error => {
                console.log("Catching error as expected - user1 premissions are invalid");
                return ledger.setOperatorToken(token1, {from: devteam});
            })
            .then(() => assert.isFalse(true,"Should fail set new operator funds with invalid premissions devteam"))
            .catch(error => {
                console.log("Catching error as expected - devteam premissions are invalid");
                return ledger.setOperatorToken(token1, {from: token1.address});
            })
            .then(() => assert.isFalse(true,"Should fail set new operator funds with invalid premissions token1"))
            .catch(error => {
                console.log("Catching error as expected - token1 premissions are invalid");
            });
         }); //close it

           it("Test upgrade token invalid permissions", function() {

              return ledger.setOperatorToken(token0.address,{from:devTeam})
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
                return token0.upgradeToken(token1.address, {from: user0});
            })
            .then(() => assert.isFalse(true,"Should fail to upgrade token with invalid premissions user0"))
            .catch(error => {
                console.log("Catching error as expected - user0 premissions are invalid");
                return token0.upgradeToken(token1.address, {from: user1});
            })
            .then(() => assert.isFalse(true,"Should fail to upgrade token with invalid premissions user1"))
            .catch(error => {
                console.log("Catching error as expected - user1 premissions are invalid");
                return token0.upgradeToken(token1.address, {from: devteam});
            })
            .then(() => assert.isFalse(true,"Should fail to upgrade token with invalid premissions devteam"))
            .catch(error => {
                console.log("Catching error as expected - devteam premissions are invalid");
                return token0.upgradeToken(token1.address, {from: token1.address});
            })
            .then(() => assert.isFalse(true,"Should fail to upgrade token with invalid premissions token1"))
            .catch(error => {
                console.log("Catching error as expected - token1 premissions are invalid");
            });
         }); //close it
    });
    });

});



/*              return Promise.allNamed({
                    isUser0: () => ledger.mint(user0,mintValue, {from: user0}),
                    isUser1: () => ledger.mint(user0,mintValue, {from: user1}),
                    isToken0: () => ledger.mint(user0,mintValue, {from: token0}),
                    isToken1: () => ledger.mint(user0,mintValue, {from: token1}),
                    address0: () => regulator.mint(address0)
                })
                .then(trueFalse => {
                    assert.isFalse(trueFalse.isUser0);
                    assert.isFalse(trueFalse.isUser1);
                    assert.isFalse(trueFalse.isToken0);
                    assert.isFalse(trueFalse.isToken1);
                    assert.isFalse(trueFalse.zero);
                });
        });*/