import ether from './helpers/ether';

const { BigNumber } = web3;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export const _totalSupplied = {
  25: 0,
  20: 5700000,
  15: 17100000,
  10: 34200000,
  5: 57000000,
  0: 85500000,
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

  isEnded.should.equal(false, "ICO hasn't finished yet");

  let totalSupplied = await contract.totalSold();

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

  await _sendTokens({
    contract,
    investor,
    saleOff: SALE_25,
    tokens: 5700000,
  });

  // Checkout total supply

  totalSupplied = await contract.totalSold();
  totalSupplied.should.be.bignumber.equal(
    ether(5700000),
    "Total supplied is 5'700'000",
  );

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

  await _sendTokens({ contract, investor, saleOff: SALE_20, tokens: 11400000 });

  // Checkout total supply

  totalSupplied = await contract.totalSold();
  totalSupplied.should.be.bignumber.equal(
    ether(17100000),
    "Total supplied is 17'100'000",
  );

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

  await _sendTokens({ contract, investor, saleOff: SALE_15, tokens: 17100000 });

  // Checkout total supply

  totalSupplied = await contract.totalSold();
  totalSupplied.should.be.bignumber.equal(
    ether(34200000),
    "Total supplied is 34'200'000",
  );

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

  await _sendTokens({ contract, investor, saleOff: SALE_10, tokens: 22800000 });

  // Checkout total supply

  totalSupplied = await contract.totalSold();
  totalSupplied.should.be.bignumber.equal(
    ether(57000000),
    "Total supplied is 57'000'000",
  );

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

  await _sendTokens({ contract, investor, saleOff: SALE_5, tokens: 28500000 });

  // Checkout total supply

  totalSupplied = await contract.totalSold();
  totalSupplied.should.be.bignumber.equal(
    ether(85500000),
    "Total supplied is 85'500'000",
  );
};

export const _sellAllTokens = async params => {
  const { contract, investor, token } = params;

  await _passDiaposons({ contract, investor, token, to: 0 });

  // Move totalSupply to border-line ICO limit
  await _sendTokens({
    contract,
    investor,
    saleOff: prices.PRICE,
    tokens: 85500000,
  });

  // Checkout of total supply
  const totalSupplied = await contract.totalSold();
  totalSupplied.should.be.bignumber.equal(
    ether(171000000),
    "Total supply is 171'000'000 DTC",
  );
};
