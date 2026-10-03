import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTotals,
  formatMinor,
  lineTotalMinor,
  parseAmountToMinor,
  parsePercentToBps,
  parseQuantityToMilli,
  sumMinor,
  taxMinor,
} from './currency';

test('parseAmountToMinor parses plain decimals into integer cents', () => {
  assert.equal(parseAmountToMinor('12'), 1200);
  assert.equal(parseAmountToMinor('12.5'), 1250);
  assert.equal(parseAmountToMinor('0.07'), 7);
  assert.equal(parseAmountToMinor('1,234.56'), 123456);
  assert.equal(parseAmountToMinor(' 19.99 '), 1999);
  assert.equal(parseAmountToMinor('1', 'JPY'), 1);
});

test('parseAmountToMinor rejects junk, negatives and excess precision', () => {
  for (const bad of ['', 'abc', '-5', '1.234', '1e3', '12.3.4', '$5', '.5']) {
    assert.equal(parseAmountToMinor(bad), null, bad);
  }
  assert.equal(parseAmountToMinor('1.5', 'JPY'), null);
});

test('parseAmountToMinor avoids float drift (0.1 + 0.2 style cases)', () => {
  assert.equal(parseAmountToMinor('0.10')! + parseAmountToMinor('0.20')!, 30);
  assert.equal(parseAmountToMinor('1.15'), 115);
  assert.equal(parseAmountToMinor('8.20'), 820);
});

test('quantity and percent parsing', () => {
  assert.equal(parseQuantityToMilli('1.5'), 1500);
  assert.equal(parseQuantityToMilli('0.001'), 1);
  assert.equal(parseQuantityToMilli('1.2345'), null);
  assert.equal(parsePercentToBps('8.25'), 825);
  assert.equal(parsePercentToBps('20'), 2000);
});

test('formatMinor', () => {
  assert.equal(formatMinor(0), '$0.00');
  assert.equal(formatMinor(5), '$0.05');
  assert.equal(formatMinor(123456), '$1,234.56');
  assert.equal(formatMinor(-250), '-$2.50');
  assert.equal(formatMinor(1500, 'JPY'), '¥1,500');
  assert.equal(formatMinor(100, 'XYZ'), 'XYZ 1.00');
});

test('formatMinor rejects non-integers', () => {
  assert.throws(() => formatMinor(1.5), RangeError);
  assert.throws(() => formatMinor(NaN), RangeError);
});

test('lineTotalMinor rounds half away from zero', () => {
  assert.equal(lineTotalMinor(1000, 1999), 1999);
  assert.equal(lineTotalMinor(2000, 1999), 3998);
  assert.equal(lineTotalMinor(1500, 333), 500); // 499.5 -> 500
  assert.equal(lineTotalMinor(1500, -333), -500);
  assert.equal(lineTotalMinor(1, 1), 0); // 0.001 -> 0
  assert.equal(lineTotalMinor(500, 1), 1); // 0.5 -> 1
});

test('taxMinor rounds half away from zero', () => {
  assert.equal(taxMinor(10000, 825), 825);
  assert.equal(taxMinor(1999, 825), 165); // 164.9175
  assert.equal(taxMinor(10, 500), 1); // 0.5 -> 1
  assert.equal(taxMinor(10000, 0), 0);
});

test('sumMinor', () => {
  assert.equal(sumMinor([]), 0);
  assert.equal(sumMinor([10, 20, 30]), 60);
  assert.throws(() => sumMinor([1, 0.5]), RangeError);
});

test('computeTotals', () => {
  const t = computeTotals(
    [
      { qtyMilli: 2000, rateMinor: 5000 }, // 100.00
      { qtyMilli: 1500, rateMinor: 3333 }, // 49.995 -> 50.00
    ],
    825,
  );
  assert.deepEqual(t, { subtotalMinor: 15000, taxMinor: 1238, totalMinor: 16238 });
  assert.deepEqual(computeTotals([]), { subtotalMinor: 0, taxMinor: 0, totalMinor: 0 });
});

test('computeTotals refuses unsafe integers', () => {
  assert.throws(() => computeTotals([{ qtyMilli: 1000, rateMinor: Number.MAX_SAFE_INTEGER }, { qtyMilli: 1000, rateMinor: 1 }]), RangeError);
});
