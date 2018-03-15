pragma solidity ^0.4.18;

// DateCoin 
import './DateCoin.sol';

// Zeppelin
import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract DateCoinCrowdsale is Crowdsale, Ownable {
  enum ManualState {
    WORKING, READY, NONE
  }

  uint256 public decimals;
  uint256 public emission;

  // Discount border-lines
  mapping(uint8 => uint256) discountTokens;
  mapping(address => uint256) pendingOrders;

  uint256 public totalSupply;
  address public vault;
  address public preSaleVault;
  ManualState public manualState = ManualState.NONE;
  bool public disabled = true;

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

    if (disabled) {
      pendingOrders[msg.sender] = pendingOrders[msg.sender].add(msg.value);
      forwardFunds();
      return;
    }

    uint256 weiAmount = msg.value;
    uint256 sold = totalSold();

    uint256 tokens;

    if (sold < _discount(25)) {
      tokens = _calculateTokens(weiAmount, 25, sold);
    }
    else if (sold >= _discount(25) && sold < _discount(20)) {
      tokens = _calculateTokens(weiAmount, 20, sold);
    }
    else if (sold >= _discount(20) && sold < _discount(15)) {
      tokens = _calculateTokens(weiAmount, 15, sold);
    }
    else if (sold >= _discount(15) && sold < _discount(10)) {
      tokens = _calculateTokens(weiAmount, 10, sold);
    }
    else if (sold >= _discount(10) && sold < _discount(5)) {
      tokens = _calculateTokens(weiAmount, 5, sold);
    }
    else {
      tokens = weiAmount.mul(rate);
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
    uint256 weiValue = msg.value;

    bool defaultCase = super.validPurchase();
    bool capCase = token.balanceOf(vault) > 0;
    bool extraCase = weiValue != 0 && capCase && manualState == ManualState.WORKING;
    return defaultCase && capCase || extraCase;
  }

  /** 
    * @dev overriding Crowdsale#hasEnded to add sale limit logic
    * @return true if crowdsale event has ended
    */
  function hasEnded() public view returns (bool) {
    if (manualState == ManualState.WORKING) {
      return false;
    }
    else if (manualState == ManualState.READY) {
      return true;
    }
    bool icoLimitReached = token.balanceOf(vault) == 0;
    return super.hasEnded() || icoLimitReached;
  }

  /**
    * @dev this method allows to finish crowdsale prematurely
    */
  function finishCrowdsale() public onlyOwner {
    manualState = ManualState.READY;
  }


  /**
    * @dev this method allows to start crowdsale prematurely
    */
  function startCrowdsale() public onlyOwner {
    manualState = ManualState.WORKING;
  }

  /**
    * @dev this method allows to drop manual state of contract 
    */
  function dropManualState() public onlyOwner {
    manualState = ManualState.NONE;
  }

  /**
    * @dev disable automatically seller
    */
  function disableAutoSeller() public onlyOwner {
    disabled = true;
  }

  /**
    * @dev enable automatically seller
    */
  function enableAutoSeller() public onlyOwner {
    disabled = false;
  }

  /**
    * @dev this method is used for getting information about account pending orders
    * @param _account which is checked
    * @return has or not
    */
  function hasAccountPendingOrders(address _account) public view returns(bool) {
    return pendingOrders[_account] > 0;
  }

  /**
    * @dev this method is used for getting account pending value
    * @param _account which is checked
    * @return if account doesn't have any pending orders, it will return 0
    */
  function getAccountPendingValue(address _account) public view returns(uint256) {
    return pendingOrders[_account];
  }

  function _discount(uint8 _percent) internal view returns (uint256) {
    return discountTokens[_percent];
  }

  function _calculateTokens(uint256 _value, uint8 _off, uint256 _sold) internal view returns (uint256) {
    uint256 withoutDiscounts = _value.mul(rate);
    uint256 byDiscount = withoutDiscounts.mul(100).div(100 - _off);
    if (_sold.add(byDiscount) > _discount(_off)) {
      uint256 couldBeSold = _discount(_off).sub(_sold);
      uint256 weiByDiscount = couldBeSold.div(4000).div(100).mul(100 - _off);
      uint256 weiLefts = _value.sub(weiByDiscount);
      uint256 withoutDiscountLeft = weiLefts.mul(4000);
      uint256 byNextDiscount = withoutDiscountLeft.mul(100).div(100 - _off + 5);
      return couldBeSold.add(byNextDiscount);
    }
    return byDiscount;
  }
}
