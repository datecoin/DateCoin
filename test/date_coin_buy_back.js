import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';

var DateCoinBuyBack = artifacts.require('DateCoinBuyBackTestable');
var DateCoin = artifacts.require('DateCoin');

const { BigNumber } = web3;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// Contract

contract('DateCoin BuyBack', accounts => {
  const owner = accounts[0];
  let contract = null;
  let token = null;

  let startTime = 0;
  let endTime = 0;
  let afterEndTime = 0;

  before(async () => await advanceBlock());

  beforeEach(async () => {
    startTime = latestTime() + duration.weeks(1);
    endTime = startTime + duration.weeks(1);
    afterEndTime = endTime + duration.seconds(1);
    token = await DateCoin.new({ from: owner });
    contract = await DateCoinBuyBack.new(token.address, { from: owner });
    await token.transferOwnership(contract.address);
  });

  describe('Check params', () => {
    it('check ownership', async () => {
      const _tokenOwner = await token.owner.call();

      _tokenOwner.should.equal(
        contract.address,
        'Token owner is buy back contract',
      );

      const _contractOwner = await contract.owner.call();

      _contractOwner.should.equal(owner, 'Owner buy back contract is creator');
    });

    it('check run buy back', async () => {
      let _startBuyBack = await contract.getBuyBackStart.call();

      _startBuyBack.should.be.bignumber.equal(
        web3.toBigNumber(0),
        "Start of buy back isn't defined",
      );

      // Update buy back start date
      await contract.runBuyBackAt(startTime);

      _startBuyBack = await contract.getBuyBackStart.call();

      _startBuyBack.should.be.bignumber.equal(
        startTime,
        `Start of buy back is ${_startBuyBack}`,
      );
    });
  });

  describe('Check calculation logic', () => {
    const investor = accounts[6];
    beforeEach(async () => {
      startTime = latestTime() + duration.weeks(1);
      endTime = startTime + duration.weeks(1);
      afterEndTime = endTime + duration.seconds(1);
      token = await DateCoin.new({ from: owner });
      await token.mint(investor, 1150e18);
      contract = await DateCoinBuyBack.new(token.address, { from: owner });
      await token.transferOwnership(contract.address);
    });

    it('total wei amount', async () => {
      const totalWeiAmount = await contract.totalWeiAmountTestable.call();
      const expected = web3.toBigNumber('287500000000000000000000000000000000');
      totalWeiAmount.should.be.bignumber.equal(
        expected,
        'Total wei amount is 2875 * 1e32',
      );
    });

    it('cost before buying', async () => {
      const costDefult = await contract.calcCostTestable.call();
      costDefult.should.be.bignumber.equal(
        ether(0.00025),
        'Default cost is 0.00025 ETH',
      );
    });

    it('calculation reward', async () => {
      const tokens = ether(150);
      const cost = await contract.calcCostTestable.call();

      const reward = await contract.calcWeiRewardTestable.call(tokens, cost);

      reward.should.be.bignumber.equal(ether(0.0375), 'Reward is 0.0375 ETH');
    });

    it('calculation reward', async () => {
      const tokens = ether(150);
      const cost = await contract.calcCostTestable.call();

      const reward = await contract.calcWeiRewardTestable.call(tokens, cost);
      reward.should.be.bignumber.equal(ether(0.0375), 'Reward is 0.0375 ETH');
    });
  });

  describe('Buy back cases', () => {
    const investor = accounts[5];
    const anotherInvestor = accounts[6];

    beforeEach(async () => {
      startTime = latestTime() + duration.weeks(1);
      endTime = startTime + duration.weeks(1);
      afterEndTime = endTime + duration.seconds(1);
      token = await DateCoin.new({ from: owner });
      await token.mint(investor, ether(235));
      await token.mint(anotherInvestor, ether(1150 - 235));

      contract = await DateCoinBuyBack.new(token.address, { from: owner });
      await token.transferOwnership(contract.address);
    });

    it('check run buy back', async () => {
      await increaseTimeTo(startTime);

      await contract.runBuyBackAt(startTime + duration.days(1));

      await increaseTimeTo(startTime + duration.days(3));

      let totalSupplied = await token.totalSupply.call();
      let balance = await token.balanceOf.call(investor);

      const ethBalance = await web3.eth.getBalance(investor);

      totalSupplied.should.be.bignumber.equal(
        ether(1150),
        'Total supply is 1150',
      );
      balance.should.be.bignumber.equal(
        ether(235),
        'Balance of investor is 235 tokens',
      );

      let contractBalance = await web3.eth.getBalance(contract.address);
      contractBalance.should.be.bignumber.equal(
        web3.toBigNumber(0),
        'Balance of contract is 0 ETH',
      );

      await contract.sendTransaction({
        from: accounts[7],
        value: ether(10),
      });

      contractBalance = await web3.eth.getBalance(contract.address);
      contractBalance.should.be.bignumber.equal(
        ether(10),
        'Balance of contract is 10 ETH',
      );

      // buy back investor tokens and burn them
      const reward = await contract.buyBack(ether(150), { from: investor });

      balance = await token.balanceOf.call(investor);
      balance.should.be.bignumber.equal(
        ether(85),
        'Balance of investor is 85 tokens',
      );

      totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(1000),
        'Total supply is 1000',
      );

      const afterEthBalance = await web3.eth.getBalance(investor);
      assert.equal(
        afterEthBalance > ethBalance,
        true,
        'Inverstor got back 0.0375 ETH - (~5) finne',
      );
    });
  });
});
