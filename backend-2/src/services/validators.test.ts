import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge, validateGroupCompliance } from './validators.js';

describe('Validators Service', () => {
  describe('calculateAge', () => {
    it('calculates age correctly when birthday has passed in current year', () => {
      const dob = new Date('2000-01-15');
      const refDate = new Date('2026-10-15');
      assert.equal(calculateAge(dob, refDate), 26);
    });

    it('calculates age correctly when birthday has not yet occurred in current year', () => {
      const dob = new Date('2000-12-25');
      const refDate = new Date('2026-10-15');
      assert.equal(calculateAge(dob, refDate), 25);
    });

    it('handles exact birthday anniversary', () => {
      const dob = new Date('2005-05-10');
      const refDate = new Date('2026-05-10');
      assert.equal(calculateAge(dob, refDate), 21);
    });
  });

  describe('validateGroupCompliance', () => {
    it('allows any occupants for BED type units (dormitory)', () => {
      const occupants = [
        { age: 22, gender: 'MALE' as const, lastName: 'Sharma' },
        { age: 21, gender: 'FEMALE' as const, lastName: 'Verma' },
        { age: 23, gender: 'MALE' as const, lastName: 'Singh' },
      ];
      const result = validateGroupCompliance('BED', occupants);
      assert.equal(result.valid, true);
    });

    it('blocks mixed-gender groups of exactly 3 for private ROOM units', () => {
      const mixedTriple = [
        { age: 22, gender: 'MALE' as const, lastName: 'Sharma' },
        { age: 21, gender: 'FEMALE' as const, lastName: 'Verma' },
        { age: 23, gender: 'MALE' as const, lastName: 'Singh' },
      ];
      const result = validateGroupCompliance('ROOM', mixedTriple);
      assert.equal(result.valid, false);
      assert.equal(result.code, 'TRIPLE_ROOM_GENDER_LOCK');
    });

    it('allows same-gender groups of 3 in private ROOM units', () => {
      const allMale = [
        { age: 22, gender: 'MALE' as const, lastName: 'Sharma' },
        { age: 21, gender: 'MALE' as const, lastName: 'Verma' },
        { age: 23, gender: 'MALE' as const, lastName: 'Singh' },
      ];
      const result = validateGroupCompliance('ROOM', allMale);
      assert.equal(result.valid, true);
    });

    it('allows couples (groups of 2) of any gender in private ROOM units', () => {
      const couple = [
        { age: 28, gender: 'MALE' as const, lastName: 'Kapoor' },
        { age: 27, gender: 'FEMALE' as const, lastName: 'Kapoor' },
      ];
      const result = validateGroupCompliance('ROOM', couple);
      assert.equal(result.valid, true);
    });
  });
});
