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
  console.log('Gas Limit:', gasDateCoin, '\n');

  const {
    start,
    end,
    rate,
    wallet,
    vault,
    preSaleVault
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
      'address'
    ],
    [
      start,
      end,
      rate,
      wallet,
      '0x1111111111111111111111111111111111111111',
      vault,
      preSaleVault
    ]
  );
  const bytecodeDateCoinCrowdsale = `${
    DateCoinCrowdsale.bytecode
  }${dateCoinCrowdsaleParams}`;
  // const gasDateCoinCrowdsale = tools.estimateGas(
  //   'live',
  //   bytecodeDateCoinCrowdsale
  // );

  console.log('DateCoinCrowdsale:');
  console.log(bytecodeDateCoinCrowdsale);
  // console.log('Gas Limit:', gasDateCoinCrowdsale, '\n');

  const TokenTimelock = require('../build/contracts/TokenTimelock.json');
  const timeLockerParams = tools.abiEncodedParams(
    ['address', 'address', 'uint64'],
    [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      8888888888
    ]
  );
  const bytecodeTimeLocker = `${TokenTimelock.bytecode}${timeLockerParams}`;
  // const gasTimeLocker = tools.estimateGas(
  //   'live',
  //   bytecodeTimeLocker
  // );

  console.log('TokenTimelock:');
  console.log(bytecodeTimeLocker);
  // console.log('Gas Limit:', gasTimeLocker, '\n');
}

Main();
