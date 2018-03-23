const properties = require('../properties');
const tools = require('../tools');

var DateCoin = artifacts.require('DateCoin');
var DateCoinCrowdsale = artifacts.require('DateCoinCrowdsale');

// Convert value to wei
const wei = value => web3.toWei(value, 'ether');

const emit = async (token, emission, owner, accounts) => {
  const labels = Object.keys(emission);
  
  for (const label of labels) {
    const { address, value } = properties.emission[label];
    const useAddress = accounts
      ? accounts[labels.indexOf(label) + 1]
      : address;
    console.log(`Emission for ${label} on ${address} of ${wei(value)}`);
    await token.mint(address, wei(value), { from: owner });
  }
  console.log(`Finish minting`);
  await token.finishMinting({ from: owner });
}

module.exports = async (deployer, network, accounts) => {
  switch(network) {
    case 'development':
    case 'develop':
      try {
        const owner = accounts[0];

        // First of all we need to deploy DateCoin contract
        const cap = wei('290769230');
        await deployer.deploy(DateCoin, cap, { from: owner });
        const token = await DateCoin.deployed();

        await emit(token, properties.emission, owner, accounts);

        // Then, we create Crowdsale contract
        // Params
        const {
          start,
          end,
          rate,
          wallet,
          vault, 
          preSaleVault
        } = properties.crowdsale;

        await deployer.deploy(
          DateCoinCrowdsale,
          start,
          end,
          rate,
          wallet,
          DateCoin.address,
          vault,
          preSaleVault,
          { gas: 4700000, from: owner }
        );
        
        console.log('////////////////////////////////////////////////////////////////\n');
        console.log(' -- PLEASE COPY INFORMATION BELOW\n');
        console.log('----------------------------------------------------------------');
        console.log('> Contract name:', tools.contractName(DateCoin));
        console.log('> Optimization:', true);
        console.log('> Runs (Optimizer):', 200);
        console.log('> Constructor params:');
        console.log(tools.abiEncodedParams(["uint256"], [cap]));
        console.log('----------------------------------------------------------------');
        console.log('> Contract name:', tools.contractName(DateCoinCrowdsale));
        console.log('> Optimization:', true);
        console.log('> Runs (Optimizer):', 200);
        console.log('> Constructor params:');
        console.log(tools.abiEncodedParams(["uint256","uint256","uint256","address","address","address","address",], [start,
          end,
          rate,
          wallet,
          DateCoin.address,
          vault,
          preSaleVault,])
        );
        console.log('----------------------------------------------------------------');
        console.log('////////////////////////////////////////////////////////////////\n');
      } catch (e) {
        console.error(e);
      }
      break;

    case 'ropsten':
      try {
        const owner = accounts[0];
        // First of all we need to deploy DateCoin contract
        const cap = wei('290769230')

        await deployer.deploy(DateCoin, cap, { from: owner });
        const token = await DateCoin.deployed();

        // emit(token, properties.emission, owner);

        // Then, we create Crowdsale contract
        // Params
        const {
          start,
          end,
          rate,
          wallet,
          vault, 
          preSaleVault
        } = properties.crowdsale;

        await deployer.deploy(
          DateCoinCrowdsale,
          start,
          end,
          rate,
          wallet,
          DateCoin.address,
          vault,
          preSaleVault,
          { gas: 4600000, from: owner }
        );
        
        console.log('////////////////////////////////////////////////////////////////\n');
        console.log(' -- PLEASE COPY INFORMATION BELOW\n');
        console.log('----------------------------------------------------------------');
        console.log('> Contract name:', tools.contractName(DateCoin));
        console.log('> Optimization:', true);
        console.log('> Runs (Optimizer):', 200);
        console.log('> Constructor params:');
        console.log(tools.abiEncodedParams(["uint256"], [cap]));
        console.log('----------------------------------------------------------------');
        console.log('> Contract name:', tools.contractName(DateCoinCrowdsale));
        console.log('> Optimization:', true);
        console.log('> Runs (Optimizer):', 200);
        console.log('> Constructor params:');
        console.log(tools.abiEncodedParams(["uint256","uint256","uint256","address","address","address","address",], [start,
          end,
          rate,
          wallet,
          DateCoin.address,
          vault,
          preSaleVault,])
        );
        console.log('----------------------------------------------------------------');
        console.log('////////////////////////////////////////////////////////////////\n');
      } catch (e) {
        console.error(e);
      }
      break;

    case 'live':
      try {
        const owner = accounts[0];
        // First of all we need to deploy DateCoin contract
        const cap = wei('290769230')

        await deployer.deploy(DateCoin, cap, { from: owner });
        const token = await DateCoin.deployed();

        // emit(token, properties.emission, owner);

        // Then, we create Crowdsale contract
        // Params
        const {
          start,
          end,
          rate,
          wallet,
          vault, 
          preSaleVault
        } = properties.crowdsale;

        await deployer.deploy(
          DateCoinCrowdsale,
          start,
          end,
          rate,
          wallet,
          DateCoin.address,
          vault,
          preSaleVault,
          { gas: 4600000, from: owner }
        );
        
        console.log('////////////////////////////////////////////////////////////////\n');
        console.log(' -- PLEASE COPY INFORMATION BELOW\n');
        console.log('----------------------------------------------------------------');
        console.log('> Contract name:', tools.contractName(DateCoin));
        console.log('> Optimization:', true);
        console.log('> Runs (Optimizer):', 200);
        console.log('> Constructor params:');
        console.log(tools.abiEncodedParams(["uint256"], [cap]));
        console.log('----------------------------------------------------------------');
        console.log('> Contract name:', tools.contractName(DateCoinCrowdsale));
        console.log('> Optimization:', true);
        console.log('> Runs (Optimizer):', 200);
        console.log('> Constructor params:');
        console.log(tools.abiEncodedParams(["uint256","uint256","uint256","address","address","address","address",], [start,
          end,
          rate,
          wallet,
          DateCoin.address,
          vault,
          preSaleVault,])
        );
        console.log('----------------------------------------------------------------');
        console.log('////////////////////////////////////////////////////////////////\n');
      } catch (e) {
        console.error(e);
      }
      break;

    default:
      console.log(`${network} is unknown network type`);
  }
};
