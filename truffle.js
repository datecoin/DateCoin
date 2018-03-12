require('babel-polyfill');
require('babel-register');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
    },
    rinkeby: {
      host: 'localhost', // Connect to geth on the specified
      port: 8545,
      from: '0x8156b4E0909e80eeE5CfaA5F15FC91975556740F', // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 3000000,
    },
  },
};
