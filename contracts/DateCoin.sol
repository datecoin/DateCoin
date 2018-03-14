pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/CappedToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';

contract DateCoin is CappedToken, BurnableToken {

  string public constant name = "DateCoin ICO Token";
  string public constant symbol = "DTC";
  uint256 public constant decimals = 18;

  function DateCoin(uint256 _cap) public CappedToken(_cap) {
  }
}
