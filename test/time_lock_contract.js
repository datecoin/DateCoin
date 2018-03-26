import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import {
  _sendTokens,
  _passDiaposons,
  _totalSupplied,
  _sellAllTokens,
  prices
} from './crowdsale_helpers';

var DateCoin = artifacts.require('DateCoin');
var TokenTimelock = artifacts.require('TokenTimelock');

const { BigNumber } = web3;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// Contract

contract('TokenTimelock', accounts => {
  const owner = accounts[0];
  let contract = null;
  let token = null;

  let startTime = 0;
  let endTime = 0;
  let afterEndTime = 0;
  const rate = 4000;
  // Only for testing
  const cap = web3.toBigNumber(290769231);

  // Accounts
  const team = accounts[19];
  const adviser1 = accounts[18];
  const adviser2 = accounts[17];
  const bounty = accounts[16];
  const marketing = accounts[15];
  const reserved = accounts[14];
  const preSale = accounts[13];
  const crowdsale = accounts[12];
  const wallet = accounts[11];

  // Amounts

  // 34 892 307
  const teamAmount = 34892307;
  // 11 630 769
  const adviser1Amount = 11630769;
  // 11 630 769
  const adviser2Amount = 11630769;
  // 2 907 692
  const bountyAmount = 2907692;
  // 11 630 769
  const marketingAmount = 11630769;
  // +29 076 923
  const reservedAmount = 29076924;
  // 18 000 000
  const preSaleAmount = 18000000;
  // 171 000 000
  const crowdsaleAmount = 171000000;
  // 189 000 000
  // Total: 290 769 230

  let adviser2Locker = null;
  let teamLocker = null;
  let reservedLocker = null;

  before(async () => await advanceBlock());

  beforeEach(async () => {
    startTime = latestTime() + duration.weeks(1);
    endTime = startTime + duration.weeks(1);
    afterEndTime = endTime + duration.seconds(1);

    token = await DateCoin.new(ether(cap), { from: owner });

    await token.mint(adviser1, ether(adviser1Amount));
    await token.mint(bounty, ether(bountyAmount));
    await token.mint(marketing, ether(marketingAmount));
    await token.mint(preSale, ether(preSaleAmount));
    await token.mint(crowdsale, ether(crowdsaleAmount));

    const year = latestTime() + duration.years(1);
    teamLocker = await TokenTimelock.new(token.address, team, year, {
      form: owner
    });
    await token.mint(teamLocker.address, ether(teamAmount));

    const sixMonths = latestTime() + duration.months(6);

    adviser2Locker = await TokenTimelock.new(
      token.address,
      adviser2,
      sixMonths,
      { from: owner }
    );
    await token.mint(adviser2Locker.address, ether(adviser2Amount));

    reservedLocker = await TokenTimelock.new(
      token.address,
      reserved,
      sixMonths,
      { from: owner }
    );
    await token.mint(reservedLocker.address, ether(reservedAmount));

    await token.finishMinting();
  });

  describe('Timelock of Team', () => {
    it('should be locked tokens', async () => {
      await teamLocker.release().should.be.rejectedWith(EVMRevert);
    });

    it('should be available tokens for releases', async () => {
      await increaseTimeTo(latestTime() + duration.years(1) + duration.days(1));
      await teamLocker.release();

      const balance = await token.balanceOf(team);
      balance.should.be.bignumber.equal(
        ether(teamAmount),
        'Team balance after release'
      );
    });
  });

  describe('Timelock of Adviser2', () => {
    it('should be locked tokens', async () => {
      await adviser2Locker.release().should.be.rejectedWith(EVMRevert);
    });

    it('should be available tokens for releases', async () => {
      await increaseTimeTo(
        latestTime() + duration.months(6) + duration.days(1)
      );
      await adviser2Locker.release();

      const balance = await token.balanceOf(adviser2);
      balance.should.be.bignumber.equal(
        ether(adviser2Amount),
        'Adviser2 balance after release'
      );
    });
  });

  describe('Timelock of reserved', () => {
    it('should be locked tokens', async () => {
      await reservedLocker.release().should.be.rejectedWith(EVMRevert);
    });

    it('should be available tokens for releases', async () => {
      await increaseTimeTo(
        latestTime() + duration.months(6) + duration.days(1)
      );
      await reservedLocker.release();

      const balance = await token.balanceOf(reserved);
      balance.should.be.bignumber.equal(
        ether(reservedAmount),
        'Reserved balance after release'
      );
    });
  });
});
