pragma solidity ^0.4.18;

import '../DateCoinBuyBack.sol';

contract DateCoinBuyBackTestable is DateCoinBuyBack {

  function DateCoinBuyBackTestable(address _tokenAddress) public DateCoinBuyBack(_tokenAddress) {
  }

  function getBuyBackStart() public constant returns (uint256) {
    return startBuyBack;
  }

  function totalWeiAmountTestable() public pure returns (uint256) {
    return totalWeiAmount();
  }

  function calcCostTestable() public view returns (uint256) {
    return calcCost();
  }

  function calcWeiRewardTestable(uint256 _value, uint256 _cost) public view returns (uint256) {
    return calcWeiReward(_value, _cost);
  }

  function totalWeiAmount() internal pure returns (uint256) {
    uint256 emission = 1150;
    uint256 defaultPrice = 25;
    return emission.mul((1 ether)).mul(defaultPrice.mul(10**13));
  }
}
