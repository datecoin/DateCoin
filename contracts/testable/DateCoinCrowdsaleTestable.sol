pragma solidity ^0.4.18;

import '../DateCoinCrowdsale.sol';

contract DateCoinCrowdsaleTestable is DateCoinCrowdsale {

  function DateCoinCrowdsaleTestable(uint256 _startTime,
                                     uint256 _endTime,
                                     uint256 _rate,
                                     address _wallet,
                                     address _tokenContractAddress,
                                     address _vault,
                                     address _preSaleVault) public
    DateCoinCrowdsale(_startTime,
                      _endTime,
                      _rate,
                      _wallet,
                      _tokenContractAddress,
                      _vault,
                      _preSaleVault)
  {
  }

  // overriding DateCoinCrowdsale#defineDiscountBorderLines for changing discount borderlines
  function defineDiscountBorderLines() internal onlyOwner {
    discountTokens[25] = 57 * (1 ether);
    discountTokens[20] = 114 * (1 ether);
    discountTokens[15] = 171 * (1 ether);
    discountTokens[10] = 228 * (1 ether);
    discountTokens[5] = 285 * (1 ether);
  }


  function discount(uint8 _percent) public view returns (uint256) {
    return _discount(_percent);
  }

  function calculateTokens(uint256 _tokens, uint8 _percent, uint256 _totalSupplied) public view returns (uint256) {
    return _calculateTokens(_tokens, _percent, _totalSupplied);
  }
}
