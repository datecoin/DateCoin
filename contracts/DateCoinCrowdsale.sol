pragma solidity ^0.4.18;

// DateCoin 
import './DateCoin.sol';

// Zeppelin
import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract DateCoinCrowdsale is Crowdsale, Ownable {

  uint256 public decimals = 18;
  uint256 public emission;

  // Discount border-lines
  mapping(uint8 => uint256) discountTokens;

  // New
  uint256 public totalSupply;
  address public vault;
  address public preSaleVault;

  function DateCoinCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address _tokenContractAddress, address _vault, address _preSaleVault) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    require(_vault != address(0));

    vault = _vault;
    preSaleVault = _preSaleVault;

    token = DateCoin(_tokenContractAddress);
    decimals = DateCoin(token).decimals();

    totalSupply = token.balanceOf(vault);

    defineDiscountBorderLines();
  }

  // overriding Crowdsale#buyTokens
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;
    uint256 sold = totalSold();

    uint256 tokens = weiAmount.mul(rate);

    if (sold < _discount(25)) {
      tokens = _calculateTokens(tokens, 75, sold);
    }
    else if (sold >= _discount(25) && sold < _discount(20)) {
      tokens = _calculateTokens(tokens, 80, sold);
    }
    else if (sold >= _discount(20) && sold < _discount(15)) {
      tokens = _calculateTokens(tokens, 85, sold);
    }
    else if (sold >= _discount(15) && sold < _discount(10)) {
      tokens = _calculateTokens(tokens, 90, sold);
    }
    else if (sold >= _discount(10) && sold < _discount(5)) {
      tokens = _calculateTokens(tokens, 95, sold);
    }

    // Check limit
    require(sold.add(tokens) <= totalSupply);

    weiRaised = weiRaised.add(weiAmount);
    token.transferFrom(vault, beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  function totalSold() public view returns(uint256) {
    return totalSupply.sub(token.balanceOf(vault));
  }

  /**
    * @dev This method is allowed to transfer tokens to _to account
    * @param _to target account address
    * @param _amount amout of buying tokens
    */
  function transferTokens(address _to, uint256 _amount) public onlyOwner {
    require(!hasEnded());
    require(_to != address(0));
    require(_amount != 0);
    require(token.balanceOf(vault) >= _amount);

    token.transferFrom(vault, _to, _amount);
  }

  function transferPreSaleTokens(address _to, uint256 tokens) public onlyOwner {
    require(_to != address(0));
    require(tokens != 0);
    require(tokens < token.balanceOf(preSaleVault));

    token.transferFrom(preSaleVault, _to, tokens);
  }


  function transferOwnership(address _newOwner) public onlyOwner {
    token.transferOwnership(_newOwner);
  }

  // This method is used for definition of discountTokens borderlines
  function defineDiscountBorderLines() internal onlyOwner {
    discountTokens[25] = 57 * (100000 ether);
    discountTokens[20] = 171 * (100000 ether);
    discountTokens[15] = 342 * (100000 ether);
    discountTokens[10] = 570 * (100000 ether);
    discountTokens[5] = 855 * (100000 ether);
  }

  /**
    * @dev overriding Crowdsale#validPurchase to add extra sale limit logic
    * @return true if investors can buy at the moment
    */
  function validPurchase() internal view returns(bool) {
    return super.validPurchase() && token.balanceOf(vault) > 0;
  }

  /** 
    * @dev overriding Crowdsale#hasEnded to add sale limit logic
    * @return true if crowdsale event has ended
    */
  function hasEnded() public view returns (bool) {
    bool icoLimitReached = token.balanceOf(vault) == 0;
    return super.hasEnded() || icoLimitReached;
  }

  function burnLeftTokens() public onlyOwner {
    require(super.hasEnded());

    uint256 tokens = token.balanceOf(vault);

    require(tokens > 0);

    DateCoin dateCoin = DateCoin(token);
    dateCoin.burnFrom(vault, tokens);
  }

  function _discount(uint8 _percent) internal view returns (uint256) {
    return discountTokens[_percent];
  }

  function _calculateTokens(uint256 _weiOnRate, uint8 _percent, uint256 _totalSupplied) internal view returns (uint256) {
    uint256 firstPart = _weiOnRate.mul(100).div(_percent);
    uint256 lastPart = 0;
    if (_totalSupplied.add(firstPart) > _discount(100 - _percent)) {
      firstPart = _discount(100 - _percent).sub(_totalSupplied);
      uint256 firstPartWei = firstPart.mul(_percent).div(100);
      lastPart = (_weiOnRate.sub(firstPartWei)).mul(100).div(_percent + 5);
    }
    return firstPart.add(lastPart);
  }
}
