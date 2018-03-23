const abi = require('ethereumjs-abi');

module.exports = {
  contractName: contract => contract._json.contractName,
  compileVersion: contract => contract._json.compiler.version,
  abiEncodedParams: (types, values) =>
    abi.rawEncode(types, values).toString('hex')
};