pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract SaleLimitCrowdsale is Crowdsale, Ownable {
  uint256 public icoLimit;

  function SaleLimitCrowdsale(uint256 _icoLimit) public {
    require(_icoLimit > 0);
    icoLimit = _icoLimit;
  }

  // overriding Crowdsale#validPurchase to add extra sale limit logic
  // @return true if investors can buy at the moment
  function validPurchase() internal view returns (bool) {
    bool withinIcoLimit = token.totalSupply() < icoLimit;
    return super.validPurchase() && withinIcoLimit;
  }

  // overriding Crowdsale#hasEnded to add sale limit logic
  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    bool icoLimitReached = token.totalSupply() == icoLimit;
    return super.hasEnded() || icoLimitReached;
  }
}
