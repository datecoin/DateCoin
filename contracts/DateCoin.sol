pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/CappedToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';

contract DateCoin is CappedToken, BurnableToken {

  string public constant name = "DateCoin ICO Token";
  string public constant symbol = "DTC";
  uint256 public constant decimals = 18;

  mapping(address => uint256) timeLocks;

  function DateCoin(uint256 _cap) public CappedToken(_cap) {
  }

  // Override burn of super contract 
  function burn(uint256 _value) public onlyUnlocked(msg.sender) {
    super.burn(_value);
  }

  // Override transferFrom of super contract 
  function transferFrom(address _from, address _to, uint256 _value) public onlyUnlocked(_from) returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  // Override transfer of super contract 
  function transfer(address _to, uint256 _value) public onlyUnlocked(msg.sender) returns (bool) {
    return super.transfer(_to, _value);
  }

  /**
    * @dev lock special account balance until release time 
    * @param _account The account address will be locked 
    * @param _releaseTime The release time of locked account
    */
  function lockAccount(address _account, uint256 _releaseTime) public onlyOwner onlyUnlocked(_account) {
    require(_account != address(0));
    require(balances[_account] > 0);
    require(_releaseTime > now);

    timeLocks[_account] = _releaseTime;
  }

  /**
    * @dev unlock special account balance 
    * @param _account The account address will be unlocked
    */
  function unlockAccount(address _account) public onlyOwner {
    require(_account != address(0));
    require(now < timeLocks[_account]);

    timeLocks[_account] = 0;
  }

  /**
    * @dev check account is lock or not
    * @param _account The account address will be checked
    *
    * @return result of checkout
    */
  function isAccountLocked(address _account) public view returns(bool) {
    return timeLocks[_account] > now;
  }

  modifier onlyUnlocked(address _account) {
    require(_account != address(0));
    require(now > timeLocks[_account]);
    _;
  }
}
