pragma solidity ^0.4.18;

import './DateCoin.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract DateCoinBuyBack is Ownable {

  using SafeMath for uint256;

  DateCoin token;
  uint256 startBuyBack;

  function DateCoinBuyBack(address _tokenAddress) public {
    require(_tokenAddress != address(0));
    startBuyBack = 0;
    token = DateCoin(_tokenAddress);
  }

  function runBuyBackAt(uint256 _start) public onlyOwner {
    require(_start > now);
    startBuyBack = _start;
  }

  function buyBack(uint256 _value) public nonZeroValue(_value) returns (uint256 rewardInWei) {
    require(now > startBuyBack && startBuyBack != 0);
    uint256 costBefore = calcCost();
    token.burnFrom(msg.sender, _value);
    rewardInWei = calcWeiReward(_value, costBefore);
    require(msg.sender.send(rewardInWei));
    return rewardInWei;
  }

  function transferTokenOwnership(address _newOwner) public onlyOwner nonZeroAddres(_newOwner) {
    token.transferOwnership(_newOwner);
  }

  function () public payable {}

  function totalWeiAmount() internal pure returns (uint256) {
    uint256 emission = 1150;
    uint256 defaultPrice = 25;
    return emission.mul((1000000 ether)).mul(defaultPrice.mul(10**13));
  }

  function calcCost() internal view returns (uint256) {
    return totalWeiAmount().div(token.totalSupply());
  }

  function calcWeiReward(uint256 _value, uint256 _cost) internal view returns (uint256) {
    return _value.mul(_cost).div(10**token.decimals());
  }

  modifier nonZeroValue(uint256 _value) {
    require(_value != 0);
    _;
  }

  modifier nonZeroAddres(address _value) {
    require(_value != address(0));
    _;
  }
}
