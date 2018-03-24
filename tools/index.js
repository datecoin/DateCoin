const abi = require('ethereumjs-abi');
const Web3 = require('web3');
const properties = require('../properties');

module.exports = {
  contractName: contract => contract._json.contractName,

  compileVersion: contract => contract._json.compiler.version,

  abiEncodedParams: (types, values) =>
    abi.rawEncode(types, values).toString('hex'),

  getRPCServer: network =>
    `https://${network === 'live' ? 'mainnet' : 'ropsten'}.infura.io/${
      properties.infuraAccessToken
    }`,

  getWeb3Instance: function(network) {
    const provider = new Web3.providers.HttpProvider(
      this.getRPCServer(network),
    );
    console.log(this.getRPCServer(network));
    return new Web3(provider);
  },

  getGasLimit: function(network) {
    const w3 = this.getWeb3Instance(network);
    const blockNumber = w3.eth.blockNumber;
    const lastBlock = w3.eth.getBlock(blockNumber);
    return lastBlock.gasLimit;
  },

  getGasPrice: function(network) {
    const w3 = this.getWeb3Instance(network);
    return w3.eth.gasPrice;
  },

  gasInfo: function(network) {
    const gas = this.getGasLimit(network);
    const gasPrice = this.getGasPrice(network);
    return { gas, gasPrice };
  },

  estimateGas: function(network, data) {
    const w3 = this.getWeb3Instance(network);
    return w3.eth.estimateGas({ data });
  },

  wei: function(network, value) {
    const w3 = this.getWeb3Instance(network);
    return w3.toWei(value, 'ether');
  },
};
