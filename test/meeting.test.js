import { expect } from 'chai';
import { describe, it } from 'mocha';
import { graphql } from 'graphql';
import Store from '../src/Store';

function getGraphQLResult(schema, query, expected, done) {
  graphql(schema, query).then((result) => {
    if (result.errors) {
      done(new Error(result.errors));
    } else {
      expect(result.data).to.deep.equal(expected);
      done();
    }
  }).catch(err => done(err));
}

describe('Meeting', () => {
  it('should process a meeting', (done) => {
    const store = new Store();
    const venue = store.addVenue('Test Venue', 'Test City');
    const meeting = store.addMeeting('Test Meeting', venue, '2016-01-01', '2016-01-02');

    const ageGroupM = store.addAgeGroup('Men');
    const discipline100 = store.addDiscipline('100m');
    const disciplineDec = store.addDiscipline('Decathlon');
    const discipline4x1 = store.addDiscipline('4x100m');
    const disciplineLJ = store.addDiscipline('Long Jump');
    const disciplineHJ = store.addDiscipline('High Jump');
    const discipline800 = store.addDiscipline('800m');

    const club1 = store.addClub('Test Club');
    const athlete1 = store.addAthlete('John', 'Doe', 2000, 'M', 'USA', club1, 1);

    // Simple event
    const event1 = store.addEvent(meeting, ageGroupM, discipline100);
    const round11 = store.addRound(event1, 'Final', '2016-01-01', '12:00', 'Test Comment');
    const group111 = store.addGroup(round11, 1, '12:00', -1.0, 'Test Comment');
    store.addAthleteResult(athlete1, group111, 12.34, null, null, 1, null, null, 'Test Comment');

    // combined event
    const event2 = store.addEvent(meeting, ageGroupM, disciplineDec);
    const cd = store.addCombinedDiscipline(event2, discipline100, 1);
    const round21 = store.addRound(event2, 'Total', '2016-01-02');
    const group211 = store.addGroup(round21, 1);
    const round22 = store.addRound(event2, '100m', '2016-01-01', '10:00', null, cd);
    const group221 = store.addGroup(round22, 1);
    const parentResult = store.addAthleteResult(athlete1, group211, 1234);
    store.addCombinedResult(athlete1, group221, parentResult, 12.34, null, 1.5, 123, 1);

    // team event
    const event3 = store.addEvent(meeting, ageGroupM, discipline4x1);
    const round31 = store.addRound(event3, 'Final', '2016-01-01', '12:00', 'Test Comment');
    const group311 = store.addGroup(round31, 1);
    const result1 = store.addTeamResult(club1, group311, null, 'DNF');
    store.addTeamMember(result1, athlete1);

    // event with attempts
    const event4 = store.addEvent(meeting, ageGroupM, disciplineLJ);
    const round41 = store.addRound(event4, 'Final', '2016-01-01', '12:00', 'Test Comment');
    const group411 = store.addGroup(round41, 1);
    const result2 = store.addAthleteResult(athlete1, group411, 6.78, null, 2.5, 1);
    store.addAttempt(result2, 1, 6.78, null, 2.5);

    // event with heights
    const event5 = store.addEvent(meeting, ageGroupM, disciplineHJ);
    const round51 = store.addRound(event5, 'Final', '2016-01-01', '12:00', 'Test Comment');
    const group511 = store.addGroup(round51, 1);
    const height1 = store.addHeight(group511, 2.10);
    const result3 = store.addAthleteResult(athlete1, group511, 2.10, null, null, 1);
    store.addHeightResult(result3, height1, 'XO');

    // event with split times
    const event6 = store.addEvent(meeting, ageGroupM, discipline800);
    const round61 = store.addRound(event6, 'Final', '2016-01-01', '12:00', 'Test Comment');
    const group611 = store.addGroup(round61, 1);
    store.addSplitTime(group611, 400, 50.54, athlete1);
    store.addAthleteResult(athlete1, group611, 110.43, null, null, 1);

    const query = `
      query {
        meeting(id: 1) {
          name
          venue {
            name
            city
          }
          startDate
          endDate
          events {
            ageGroup {
              name
            }
            discipline {
              name
            }
            combinedDisciplines {
              order
              discipline {
                name
              }
            }
            rounds {
              name
              date
              time
              comment
              combinedDiscipline {
                discipline {
                  name
                }
              }
              groups {
                number
                time
                wind                
                comment
                heights {
                  height
                }
                splitTimes {
                  distance
                  time
                }
                results {
                  position
                  performance
                  exception
                  ...AthleteResultFields
                  ...CombinedResultFields
                  ...TeamResultFields
                }
              }
            }
          }
        }
      }
      fragment AthleteResultFields on AthleteResultInterface {
        athlete {
          bib
          firstName
          lastName
          yob
          gender
          citizenship
          club {
            name
          }
        }
        attempts {
          number
          performance
          exception
          wind
        }
        heights {
          height {
            height
          }
          performance
        }
      }
      fragment TeamResultFields on TeamResult {
        club {
          name
        }
        teamMembers {
          athlete {
            firstName
            lastName
            yob
          }
        }        
      }
      fragment CombinedResultFields on CombinedResult {
        points
      }
    `;

    const expected = {
      meeting: {
        name: 'Test Meeting',
        venue: {
          name: 'Test Venue',
          city: 'Test City',
        },
        startDate: '2016-01-01',
        endDate: '2016-01-02',
        events: [
          {
            ageGroup: {
              name: 'Men',
            },
            discipline: {
              name: '100m',
            },
            rounds: [
              {
                name: 'Final',
                date: '2016-01-01',
                time: '12:00',
                comment: 'Test Comment',
                groups: [
                  {
                    number: 1,
                    time: '12:00',
                    wind: -1.0,
                    comment: 'Test Comment',
                    results: [
                      {
                        position: 1,
                        performance: 12.34,
                        exception: null,
                        athlete: {
                          bib: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          yob: 2000,
                          gender: 'M',
                          citizenship: 'USA',
                          club: {
                            name: 'Test Club',
                          },
                        },
                        attempts: [],
                        heights: [],
                      },
                    ],
                    heights: [],
                    splitTimes: [],
                  },
                ],
                combinedDiscipline: null,
              },
            ],
            combinedDisciplines: [],
          },
          {
            ageGroup: {
              name: 'Men',
            },
            discipline: {
              name: 'Decathlon',
            },
            rounds: [
              {
                name: 'Total',
                date: '2016-01-02',
                time: null,
                comment: null,
                groups: [
                  {
                    number: 1,
                    time: null,
                    wind: null,
                    comment: null,
                    results: [
                      {
                        position: null,
                        performance: 1234,
                        exception: null,
                        athlete: {
                          bib: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          yob: 2000,
                          gender: 'M',
                          citizenship: 'USA',
                          club: {
                            name: 'Test Club',
                          },
                        },
                        attempts: [],
                        heights: [],
                      },
                    ],
                    heights: [],
                    splitTimes: [],
                  },
                ],
                combinedDiscipline: null,
              },
              {
                name: '100m',
                date: '2016-01-01',
                time: '10:00',
                comment: null,
                groups: [
                  {
                    number: 1,
                    time: null,
                    wind: null,
                    comment: null,
                    results: [
                      {
                        position: 1,
                        performance: 12.34,
                        points: 123,
                        exception: null,
                        athlete: {
                          bib: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          yob: 2000,
                          gender: 'M',
                          citizenship: 'USA',
                          club: {
                            name: 'Test Club',
                          },
                        },
                        attempts: [],
                        heights: [],
                      },
                    ],
                    heights: [],
                    splitTimes: [],
                  },
                ],
                combinedDiscipline: {
                  discipline: {
                    name: '100m',
                  },
                },
              },
            ],
            combinedDisciplines: [
              {
                order: 1,
                discipline: {
                  name: '100m',
                },
              },
            ],
          },
          {
            ageGroup: {
              name: 'Men',
            },
            discipline: {
              name: '4x100m'
            },
            rounds: [
              {
                name: 'Final',
                date: '2016-01-01',
                time: '12:00',
                comment: 'Test Comment',
                groups: [
                  {
                    number: 1,
                    results: [
                      {
                        position: null,
                        performance: null,
                        exception: 'DNF',
                        club: {
                          name: 'Test Club',
                        },
                        teamMembers: [
                          {
                            athlete: {
                              firstName: 'John',
                              lastName: 'Doe',
                              yob: 2000
                            }
                          }
                        ],
                      }
                    ],
                    time: null,
                    wind: null,
                    comment: null,
                    heights: [],
                    splitTimes: [],
                  }
                ],
                combinedDiscipline: null,
              },
            ],
            combinedDisciplines: [],
          },
          {
            ageGroup: {
              name: 'Men',
            },
            discipline: {
              name: 'Long Jump'
            },
            rounds: [
              {
                name: 'Final',
                date: '2016-01-01',
                time: '12:00',
                comment: 'Test Comment',
                groups: [
                  {
                    number: 1,
                    time: null,
                    comment: null,
                    wind: null,
                    results: [
                      {
                        position: 1,
                        athlete: {
                          bib: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          yob: 2000,
                          gender: 'M',
                          citizenship: 'USA',
                          club: {
                            name: 'Test Club',
                          },
                        },
                        performance: 6.78,
                        exception: null,
                        attempts: [
                          {
                            number: 1,
                            performance: 6.78,
                            exception: null,
                            wind: 2.5,
                          },
                        ],
                        heights: [],
                      },
                    ],
                    heights: [],
                    splitTimes: [],
                  },
                ],
                combinedDiscipline: null,
              },
            ],
            combinedDisciplines: [],
          },
          {
            ageGroup: {
              name: 'Men',
            },
            discipline: {
              name: 'High Jump'
            },
            rounds: [
              {
                name: 'Final',
                date: '2016-01-01',
                time: '12:00',
                comment: 'Test Comment',
                groups: [
                  {
                    number: 1,
                    time: null,
                    comment: null,
                    wind: null,
                    results: [
                      {
                        position: 1,
                        athlete: {
                          bib: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          yob: 2000,
                          gender: 'M',
                          citizenship: 'USA',
                          club: {
                            name: 'Test Club',
                          },
                        },
                        performance: 2.10,
                        exception: null,
                        attempts: [],
                        heights: [
                          {
                            height: {
                              height: 2.1,
                            },
                            performance: 'XO',
                          },
                        ],
                      },
                    ],
                    heights: [
                      {
                        height: 2.1,
                      },
                    ],
                    splitTimes: [],
                  },
                ],
                combinedDiscipline: null,
              },
            ],
            combinedDisciplines: [],
          },
          {
            ageGroup: {
              name: 'Men',
            },
            discipline: {
              name: '800m'
            },
            rounds: [
              {
                name: 'Final',
                date: '2016-01-01',
                time: '12:00',
                comment: 'Test Comment',
                groups: [
                  {
                    number: 1,
                    time: null,
                    comment: null,
                    wind: null,
                    results: [
                      {
                        position: 1,
                        athlete: {
                          bib: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          yob: 2000,
                          gender: 'M',
                          citizenship: 'USA',
                          club: {
                            name: 'Test Club',
                          },
                        },
                        performance: 110.43,
                        exception: null,
                        attempts: [],
                        heights: [],
                      },
                    ],
                    splitTimes: [
                      {
                        distance: 400,
                        time: 50.54
                      },
                    ],
                    heights: [],
                  },
                ],
                combinedDiscipline: null,
              },
            ],
            combinedDisciplines: [],
          },
        ],
      },
    };

    getGraphQLResult(store.getSchema(), query, expected, done);
  });
});
