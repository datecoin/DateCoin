import ether from './helpers/ether';

const { BigNumber } = web3;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export const _totalSupplied = {
  25: 0,
  20: 12,
  15: 42,
  10: 92,
  5: 162,
  0: 252,
};

export const prices = {
  SALE_25: 0.0001875,
  SALE_20: 0.0002,
  SALE_15: 0.0002125,
  SALE_10: 0.000225,
  SALE_5: 0.0002375,
  PRICE: 0.00025,
};

export const _sendTokens = async params => {
  const { contract, investor, saleOff, tokens } = params;
  const value = ether(saleOff) * web3.toBigNumber(tokens);
  return await contract.sendTransaction({
    from: investor,
    value,
  });
};

export const _passDiaposons = async params => {
  const { contract, token, investor, to, plus } = params;
  const { SALE_25, SALE_20, SALE_15, SALE_10, SALE_5, PRICE } = prices;

  const isEnded = await contract.hasEnded.call();

  isEnded.should.equal(false, `ICO hasn't finished yet`);

  let totalSupplied = await token.totalSupply.call();

  if (to == 25) {
    // Plus extra for checkout border-line
    plus &&
      (await _sendTokens({
        contract,
        investor,
        saleOff: SALE_25,
        tokens: plus,
      }));
    return;
  }

  // Checkout total supply

  totalSupplied.should.be.bignumber.equal(ether(0), 'Total supplied is empty');

  // Buy for 25% sale off

  await _sendTokens({ contract, investor, saleOff: SALE_25, tokens: 12 });

  // Checkout total supply

  totalSupplied = await token.totalSupply.call();
  totalSupplied.should.be.bignumber.equal(ether(12), 'Total supplied is 12');

  if (to == 20) {
    // Plus extra for checkout border-line
    plus &&
      (await _sendTokens({
        contract,
        investor,
        saleOff: SALE_20,
        tokens: plus,
      }));
    return;
  }

  // Buy for 20% sale off

  await _sendTokens({ contract, investor, saleOff: SALE_20, tokens: 30 });

  // Checkout total supply

  totalSupplied = await token.totalSupply.call();
  totalSupplied.should.be.bignumber.equal(ether(42), 'Total supplied is 42');

  if (to == 15) {
    // Plus extra for checkout border-line
    plus &&
      (await _sendTokens({
        contract,
        investor,
        saleOff: SALE_15,
        tokens: plus,
      }));
    return;
  }

  // Buy for 15% sale off

  await _sendTokens({ contract, investor, saleOff: SALE_15, tokens: 50 });

  // Checkout total supply

  totalSupplied = await token.totalSupply.call();
  totalSupplied.should.be.bignumber.equal(ether(92), 'Total supplied is 92');

  if (to == 10) {
    // Plus extra for checkout border-line
    plus &&
      (await _sendTokens({
        contract,
        investor,
        saleOff: SALE_10,
        tokens: plus,
      }));
    return;
  }

  // Buy for 10% sale off

  await _sendTokens({ contract, investor, saleOff: SALE_10, tokens: 70 });

  // Checkout total supply

  totalSupplied = await token.totalSupply.call();
  totalSupplied.should.be.bignumber.equal(ether(162), 'Total supplied is 162');

  if (to == 5) {
    // Plus extra for checkout border-line
    plus &&
      (await _sendTokens({
        contract,
        investor,
        saleOff: SALE_5,
        tokens: plus,
      }));
    return;
  }

  // Buy for 5% sale off

  await _sendTokens({ contract, investor, saleOff: SALE_5, tokens: 90 });

  // Checkout total supply

  totalSupplied = await token.totalSupply.call();
  totalSupplied.should.be.bignumber.equal(ether(252), 'Total supplied is 252');
};

export const _sellAllTokens = async params => {
  const { contract, investor, token } = params;

  await _passDiaposons({ contract, investor, token, to: 0 });

  // Move totalSupply to border-line ICO limit
  await _sendTokens({
    contract,
    investor,
    saleOff: prices.PRICE,
    tokens: 500,
  });

  // Checkout of total supply
  const totalSupplied = await token.totalSupply.call();
  totalSupplied.should.be.bignumber.equal(
    ether(752),
    'Total supply is 752 DTC',
  );
};
