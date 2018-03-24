const tools = require('../tools');
const properties = require('../properties');

function Main() {
  const DateCoin = require('../build/contracts/DateCoin.json');
  const cap = tools.wei('live', '290769230');
  const dateCoinParams = tools.abiEncodedParams(['uint256'], [cap]);
  const bytecodeDateCoin = `${DateCoin.bytecode}${dateCoinParams}`;
  const gasDateCoin = tools.estimateGas('live', bytecodeDateCoin);

  console.log('DateCoin:');
  console.log(`${DateCoin.bytecode}${dateCoinParams}`);
  console.log('Gas Limit:', gasDateCoin);

  const {
    start,
    end,
    rate,
    wallet,
    vault,
    preSaleVault,
  } = properties.crowdsale;

  const DateCoinCrowdsale = require('../build/contracts/DateCoinCrowdsale.json');
  const dateCoinCrowdsaleParams = tools.abiEncodedParams(
    [
      'uint256',
      'uint256',
      'uint256',
      'address',
      'address',
      'address',
      'address',
    ],
    [
      start,
      end,
      rate,
      wallet,
      '0x507E58F28E14CC351558C555eC1B0dE374080383',
      vault,
      preSaleVault,
    ],
  );
  const bytecodeDateCoinCrowdsale = `${DateCoinCrowdsale.bytecode}${
    dateCoinCrowdsaleParams
  }`;
  const gasDateCoinCrowdsale = tools.estimateGas(
    'live',
    bytecodeDateCoinCrowdsale,
  );

  console.log('DateCoinCrowdsale:');
  console.log(bytecodeDateCoinCrowdsale);
  console.log('Gas Limit:', gasDateCoinCrowdsale);
}

Main();
