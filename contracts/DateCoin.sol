pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';

contract DateCoin is MintableToken, BurnableToken {
  string public constant name = "DateCoin ICO Token";
  string public constant symbol = "DTC";
  uint256 public constant decimals = 18;

  address public frozenWallet = address(0);
  uint256 public freezingDate = 0;

  /**
    * overriding BasicToken#transfer
    */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    if (msg.sender == frozenWallet && now < freezingDate) {
      return false;
    }

    return super.transfer(_to, _value);
  }


  function setFrozenWallet(address _frozenWallet) public onlyOwner {
    require(_frozenWallet != address(0));
    frozenWallet = _frozenWallet;
  }


  function setFreezingDate(uint256 _freezingDate) public onlyOwner {
    require(_freezingDate > now);
    freezingDate = _freezingDate;
  }

  function burnFrom(address _from, uint256 _value) public onlyOwner {
    require(_value <= balances[_from]);

    balances[_from] = balances[_from].sub(_value);
    totalSupply = totalSupply.sub(_value);
    Burn(_from, _value);
  }
}
