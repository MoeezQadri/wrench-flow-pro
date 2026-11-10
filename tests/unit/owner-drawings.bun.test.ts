import { describe, expect, test } from 'bun:test';
import { totalDrawings, retainedInBusiness } from '../../src/utils/owner-drawings';

describe('owner drawings', () => {
  test('drawings are totalled', () => {
    expect(totalDrawings([{ amount: 20000 }, { amount: 5000 }])).toBe(25000);
  });
  test('drawings reduce retained amount, not net profit', () => {
    const netProfit = 100000;
    expect(retainedInBusiness(netProfit, 30000)).toBe(70000);
    expect(netProfit).toBe(100000);
  });
});
