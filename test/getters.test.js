import { expect } from 'chai';
import { describe, it } from 'mocha';
import Store from '../src/Store';
import t from '../src/types';

describe('Getters', () => {
  it('should get an athletes by bib', () => {
    const store = new Store();
    store.addAthlete('John', 'Doe', 2000, 'M', 'USA', null, 1);
    expect(store.getAthletesByBib(1)).to.deep.equal([
      {
        id: 1,
        bib: 1,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
        yob: 2000,
        citizenship: 'USA',
        club: null,
        type: t.ATHLETE,
      }
    ]);
  });

  it('should get a group by round and number', () => {
    const store = new Store();
    store.addGroup(1, 1, '12:00', null, 'Test');
    expect(store.getGroupByRoundAndNumber(1, 1)).to.deep.equal({
      id: 1,
      round: 1,
      number: 1,
      time: '12:00',
      wind: null,
      comment: 'Test',
      type: t.GROUP,
    });
  });

  it('should get a meeting by id', () => {
    const store = new Store();
    store.addMeeting('Test', 1, '2016-01-01', null);
    expect(store.getMeetingById(1)).to.deep.equal({
      id: 1,
      name: 'Test',
      venue: 1,
      startDate: '2016-01-01',
      endDate: null,
      type: t.MEETING,
    });
  });
});
