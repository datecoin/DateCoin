var DateCoin = artifacts.require('./DateCoin.sol');

// Testable contracts
var DateCoinCrowdsaleTestable = artifacts.require(
  './testable/DateCoinCrowdsaleTestable.sol',
);
var DateCoinBuyBackTestable = artifacts.require(
  './testable/DateCoinBuyBackTestable.sol',
);

module.exports = async function(deployer, network, accounts) {
  if (
    network === 'development' ||
    network === 'develop' ||
    network === 'test'
  ) {
    try {
      const owner = accounts[0];

      // First of all we need to deploy DateCoin contract
      await deployer.deploy(DateCoin, 290769231);
      const token = await DateCoin.deployed();

      //const totalEmission = 290769230;
      //await token.mint(owner, totalEmission);
      //await token.finishMinting();

      // Then, we create Crowdsale contract
      // Params
      const _startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;
      const _endTime = _startTime + 60 * 60 * 24 * 20;
      const _rate = 4000;
      const _wallet = accounts[9];
      const _vault = accounts[8];
      const _preSaleVault = accounts[7];
      const _tokenContractAddress = DateCoin.address;
      await deployer.deploy(
        DateCoinCrowdsaleTestable,
        _startTime,
        _endTime,
        _rate,
        _wallet,
        _tokenContractAddress,
        _vault,
        _preSaleVault,
      );

      // Then, we create BuyBack contract
      await deployer.deploy(DateCoinBuyBackTestable, _tokenContractAddress);

      // And transfer ownership to Crowdsale
      await token.transferOwnership(DateCoinCrowdsaleTestable.address);
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log('Unknown network type', network);
  }
};
