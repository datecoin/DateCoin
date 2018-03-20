const Web3 = require('web3');

const web3 = new Web3();

const bytecode = require('./bytecode.json');
const abi = require('./abi.json');

const Contract = web3.eth.contract(abi);

console.log('Bytecode:', `0x${bytecode.object}`);

const byteCodeWithParams = Contract.new.getData(
  1,
  2,
  4000,
  '0xWallet',
  '0xToken',
  '0xCrowdsale',
  '0xPreSale',
  { data: bytecode.object },
);

console.log('Bytecode with params:', `0x${byteCodeWithParams}`);
