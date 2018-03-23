require('babel-polyfill');
require('babel-register');

const HDWalletProvider = require("truffle-hdwallet-provider");
const properties = require("./properties");

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
    },
    ropsten: {
      provider: () => {
        const { mnemonic, infuraAccessToken, ownerIndex } = properties;
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraAccessToken}`, ownerIndex);
      },
      gas: 3000000,
      network_id: 3,
    },
    live: {
      provider: () => {
        const { mnemonic, infuraAccessToken, ownerIndex} = properties;
        return new HDWalletProvider(mnemonic, `https://mainnet.infura.io/${infuraAccessToken}`, ownerIndex);
      },
      gas: 3000000,
      network_id: 1,
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
