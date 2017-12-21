web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const BackendLedger = artifacts.require("./BackendLedger.sol");
const LedgerLinkedToken = artifacts.require("./LedgerLinkedToken.sol");

contract('Token Miniting', function(accounts) {

    let ledger, token0, token1,
        devTeam, user0, user1,user2;
        
    const mintValue = randomIntIn(500, 1000);
    const transferValue = randomIntIn(1, 100);
    
    before("should prepare", function() {
        assert.isAtLeast(accounts.length, 4);
        devTeam = accounts[0];
        user0 = accounts[1];
        user1 = accounts[2];
        user2 = accounts[3];
        return web3.eth.getBalancePromise(devTeam)
            .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
            console.log("Before operation");
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
                return ledger.setOperator(token0.address,{from:devTeam});
            })
            .then(tx => {
                assert.strictEqual(tx.logs[0].args.newOperator,token0.address,"ledger operator permission set transfers has failed");                
                return ledger.mint(user0,mintValue, {from: devTeam});
            })

            .then(tx => {
                assert.strictEqual(tx.logs[0].args.to,user0,"Failed to mint tokens to the correct user");
                assert.strictEqual(tx.logs[0].args.amount.toNumber(),mintValue,"Failed to mint the correct amount");
                return ledger.balanceOf(user0,{from: devTeam})
            })
            .then(balance => {
                assert.isAtLeast(balance.toNumber(), 500);
            })

         });
              
        });
           
       
    });
});

