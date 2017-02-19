import { expect } from 'chai';
import { describe, it } from 'mocha';
import Store from '../src/Store';
import t from '../src/types';

describe('Getters', () => {
  it('should set continous ids for different result types', () => {
    const store = new Store();
    const id1 = store.addAthleteResult({}, [1, null, 1, 12.34, 0.0]);
    expect(id1).to.equal(1);
    const id2 = store.addTeamResult({}, [null, 1, 1, 45.67, null]);
    expect(id2).to.equal(2);
  });
});
