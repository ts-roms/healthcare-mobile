import { describe, expect, it } from 'vitest';

import type { PortalPrescriptionItem } from '@/data/types';

import { BODY_MAX, refillRequest, SUBJECT_MAX } from './wording';

const metformin: PortalPrescriptionItem = {
  genericName: 'Metformin',
  brandName: null,
  strength: '500 mg',
  dosageForm: 'tablet',
  doseAmount: 1,
  doseUnit: 'tablet',
  route: 'oral',
  frequency: 'bid',
  frequencyText: null,
  asNeededReason: null,
  durationValue: 30,
  durationUnit: 'days',
  quantity: 60,
  quantityUnit: 'tablet',
  refills: 1,
  instructions: 'Take with meals.',
};

describe('refillRequest', () => {
  it('names the request, each medicine with its dosage, and the prescription', () => {
    const { subject, body } = refillRequest({ prescriptionNumber: 'RX-2026-000001', prescriberName: 'Dr. Ana Santos', items: [metformin] }, '7 Nov 2026');
    expect(subject).toBe('Refill request: Metformin 500 mg');
    expect(body).toContain('Request: medicine refill');
    expect(body).toContain('- Metformin 500 mg (tablet, oral)');
    expect(body).toMatch(/Dosage: 1 tablet .+ for 30 days/);
    expect(body).toContain('Last supplied: 60 tablets · refills left on the prescription: 1');
    expect(body).toContain('Prescription no. RX-2026-000001, 7 Nov 2026, prescribed by Dr. Ana Santos.');
  });

  it('keeps within the message limits', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ ...metformin, genericName: `Medicine number ${i}` }));
    const { subject, body } = refillRequest({ prescriptionNumber: 'RX-1', prescriberName: null, items: many }, '7 Nov 2026');
    expect(subject.length).toBeLessThanOrEqual(SUBJECT_MAX);
    expect(body.length).toBeLessThanOrEqual(BODY_MAX);
  });
});
