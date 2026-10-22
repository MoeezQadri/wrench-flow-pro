import { describe, expect, test } from 'bun:test';
import { stageOf, canEditItems, canEditMoney, canReopen, canDeleteStage, statusLabel } from '../../src/utils/invoice-status';
import { REVENUE_STATUSES } from '../../src/utils/invoice-calculations';

describe('work order / invoice stages', () => {
  test('stages', () => {
    expect(stageOf('estimate')).toBe('estimate');
    expect(stageOf('approved')).toBe('work_order');
    expect(stageOf('work_in_progress')).toBe('work_order');
    expect(stageOf('payment_pending')).toBe('invoice');
    expect(stageOf('partial_payment')).toBe('invoice');
    expect(stageOf('payment_completed')).toBe('invoice');
  });
  test('work order items editable, completed work items locked', () => {
    expect(canEditItems('approved')).toBe(true);
    expect(canEditItems('work_in_progress')).toBe(true);
    expect(canEditItems('payment_pending')).toBe(false);
    expect(canEditItems('partial_payment')).toBe(false);
  });
  test('payments/discount editable until payment completed', () => {
    expect(canEditMoney('partial_payment')).toBe(true);
    expect(canEditMoney('payment_completed')).toBe(false);
  });
  test('only owner/admin reopen', () => {
    expect(canReopen('owner')).toBe(true);
    expect(canReopen('admin')).toBe(true);
    expect(canReopen('manager')).toBe(false);
    expect(canReopen('mechanic')).toBe(false);
  });
  test('completed work cannot be deleted', () => {
    expect(canDeleteStage('approved')).toBe(true);
    expect(canDeleteStage('payment_pending')).toBe(false);
    expect(canDeleteStage('payment_completed')).toBe(false);
  });
  test('revenue counts only completed work', () => {
    expect([...REVENUE_STATUSES]).toEqual(['payment_pending', 'partial_payment', 'payment_completed']);
  });
  test('labels', () => {
    expect(statusLabel('work_in_progress')).toBe('Work in progress');
    expect(statusLabel('payment_completed')).toBe('Payment completed');
  });
});

describe('work completed stays a work order', () => {
  test('work_completed is editable work order', () => {
    expect(stageOf('work_completed')).toBe('work_order');
    expect(canEditItems('work_completed')).toBe(true);
    expect(canDeleteStage('work_completed')).toBe(true);
    expect(statusLabel('work_completed')).toBe('Work completed');
  });
});
