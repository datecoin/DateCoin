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
      // First of all we need to deploy DateCoin contract
      await deployer.deploy(DateCoin);
      const token = await DateCoin.deployed();

      // Then, we create Crowdsale contract
      // Params
      const _startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;
      const _endTime = _startTime + 60 * 60 * 24 * 20;
      const _rate = 4000;
      const _limit = 752e6; // 752 000 000
      const _emission = 1150e6;
      const _wallet = accounts[9];
      const _frozenTokensWallet = accounts[8];
      const _teamTokensWallet = accounts[7];
      const _tokenContractAddress = DateCoin.address;
      await deployer.deploy(
        DateCoinCrowdsaleTestable,
        _startTime,
        _endTime,
        _rate,
        _limit,
        _emission,
        _wallet,
        _frozenTokensWallet,
        _teamTokensWallet,
        _tokenContractAddress,
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
