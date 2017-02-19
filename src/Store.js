/* eslint no-use-before-define: 0 */
import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLInt,
  GraphQLFloat,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';
import t from './types';
import Store from './ObjectStore';

export default class OADFStore {
  constructor() {
    this.meetingStore = new Store();
    this.ageGroupStore = new Store();
    this.associationStore = new Store();
    this.athleteStore = new Store();
    this.clubStore = new Store();
    this.clubMemberStore = new Store();
    this.disciplineStore = new Store();
    this.eventStore = new Store();
    this.groupStore = new Store();
    this.resultStore = new Store();
    this.roundStore = new Store();
    this.splitTimeStore = new Store();
    this.teamMemberStore = new Store();
    this.venueStore = new Store();
    this.attemptStore = new Store();
    this.combinedDisciplineStore = new Store();
    this.heightStore = new Store();
    this.heightResultStore = new Store();

    const resultInterface = new GraphQLInterfaceType({
      name: t.I_RESULT,
      description: 'Interface for different types of results. This can be an athlete, a combined or team result.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        group: {
          type: new GraphQLNonNull(groupType),
          resolve: result => this.groupStore.getById(result.group),
        },
        position: {
          type: GraphQLInt,
          description: 'The position within the group.',
        },
        performance: {
          type: GraphQLFloat,
          description: 'The performance as a number. Minutes will also be converted to seconds.',
        },
        exception: {
          type: GraphQLString,
          description: 'Exception type if attempt was not completed successfully.',
        },
        qualified: {
          type: GraphQLString,
          description: 'If the starter qualified for the next round or waived his right to go to the next round',
        },
        comment: {
          type: GraphQLString,
        },
        automaticTiming: {
          type: GraphQLBoolean,
        },
      }),
      resolveType(result) {
        if (result.type === t.ATHLETE_RESULT) {
          return athleteResultType;
        }
        if (result.type === t.TEAM_RESULT) {
          return teamResultType;
        }

        if (result.type === t.COMBINED_RESULT) {
          return combinedResultType;
        }
        return null;
      },
    });

    const athleteResultInterface = new GraphQLInterfaceType({
      name: t.I_ATHLETE_RESULT,
      description: 'Additional field for single athlete results used in standard and combined results',
      fields: () => ({
        athlete: {
          type: new GraphQLNonNull(athleteType),
        },
        wind: {
          type: GraphQLFloat,
          description: `
            If the wind only refers to this single result it is displayed here.
            Else it can be found at a higher level.
          `,
        },
        attempts: {
          type: new GraphQLList(attemptType),
          description: 'The attempts for this result',
        },
        heights: {
          type: new GraphQLList(heightResultType),
        },
      }),
      resolveType(result) {
        if (result.type === t.ATHLETE_RESULT) {
          return athleteResultType;
        }
        if (result.type === t.COMBINED_RESULT) {
          return combinedResultType;
        }
        return null;
      },
    });

    const ageGroupType = new GraphQLObjectType({
      name: t.AGE_GROUP,
      description: 'A definition of a group of people starting together.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      }),
    });

    const associationType = new GraphQLObjectType({
      name: t.ASSOCIATION,
      description: 'An organization in which multiple clubs or associations are grouped together.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      }),
    });

    const athleteType = new GraphQLObjectType({
      name: t.ATHLETE,
      description: 'A person participating in the meeting or member of a club',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        firstName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        lastName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        yob: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        bib: {
          type: GraphQLID,
          description: `
            If the context of the query is a meeting the bib of the athlete 
            in this meeting is displayed.
          `,
        },
        gender: {
          type: new GraphQLNonNull(GraphQLString),
        },
        citizenship: {
          type: GraphQLString,
          description: 'The IOC 3-letter code of the country.',
        },
        club: {
          type: clubType,
          description: `
            The current club of an athlete. Depending on the context this is either
            the club for a meeting which is queried or the club the athlete starts for at the 
            time of the query.
          `,
          resolve: athlete => this.clubStore.getById(athlete.club),
        },
        memberships: {
          type: clubMemberType,
          description: 'A list of all club memberships of an athlete during his career.',
          resolve: athlete => this.clubMemberStore.getByProperty('athlete', athlete.id),
        },
      }),
    });

    const athleteResultType = new GraphQLObjectType({
      name: t.ATHLETE_RESULT,
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        group: {
          type: new GraphQLNonNull(groupType),
          resolve: result => this.groupStore.getById(result.group),
        },
        athlete: {
          type: new GraphQLNonNull(athleteType),
          resolve: athleteResult => this.athleteStore.getById(athleteResult.athlete),
        },
        position: {
          type: GraphQLInt,
        },
        performance: {
          type: GraphQLFloat,
        },
        wind: {
          type: GraphQLFloat,
        },
        exception: {
          type: GraphQLString,
        },
        qualified: {
          type: GraphQLString,
        },
        attempts: {
          type: new GraphQLList(attemptType),
          resolve: athleteResult => this.attemptStore.getByProperty('result', athleteResult.id),
        },
        heights: {
          type: new GraphQLList(heightResultType),
          resolve: athleteResult => this.heightResultStore.getByProperty('result', athleteResult.id),
        },
        combinedResults: {
          type: new GraphQLList(combinedResultType),
          description: `
            If this result is a result of a combined event a list of
            all single results who make up the total result can be received from here.
          `,
          resolve: athleteResult => this.resultStore.getByProperty('parentResult', athleteResult.id),
        },
        weight: {
          type: GraphQLInt,
          description: `
            If multiple athletes start together in a group and use different
            weights specify the weight that was used by the athlete here.
          `,
        },
        comment: {
          type: GraphQLString,
        },
        automaticTiming: {
          type: GraphQLBoolean,
        },
      }),
      interfaces: [resultInterface, athleteResultInterface],
    });

    const attemptType = new GraphQLObjectType({
      name: t.ATTEMPT,
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        result: {
          type: new GraphQLNonNull(athleteResultType),
        },
        number: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        performance: {
          type: GraphQLFloat,
        },
        wind: {
          type: GraphQLFloat,
        },
        exception: {
          type: GraphQLString,
        },
      }),
    });

    const clubType = new GraphQLObjectType({
      name: t.CLUB,
      description: 'A club for which athletes participate in competitions',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
        number: {
          type: GraphQLID,
        },
        association: {
          type: associationType,
          resolve: club => this.associationStore.getById(club.association),
        },
      }),
    });

    const clubMemberType = new GraphQLObjectType({
      name: t.CLUB_MEMBER,
      description: 'Describes a time span in which an athlete started for a certain club.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        athlete: {
          type: new GraphQLNonNull(athleteType),
          resolve: clubMember => this.athleteStore.getById(clubMember.athlete),
        },
        club: {
          type: new GraphQLNonNull(clubType),
          resolve: clubMember => this.clubStore.getById(clubMember.club),
        },
        startDate: {
          type: GraphQLString,
        },
        endDate: {
          type: GraphQLString,
        },
        licenseNumber: {
          type: GraphQLID,
        },
      }),
    });

    const combinedDisciplineType = new GraphQLObjectType({
      name: t.COMBINED_DISCIPLINE,
      description: 'A discipline which was part of an combined event.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        event: {
          type: new GraphQLNonNull(eventType),
          resolve: combinedDiscipline => this.eventStore.getById(combinedDiscipline.event),
        },
        discipline: {
          type: new GraphQLNonNull(disciplineType),
          resolve: combinedDiscipline => this.disciplineStore.getById(combinedDiscipline.discipline),
        },
        order: {
          type: GraphQLInt,
        },
      }),
    });

    const combinedResultType = new GraphQLObjectType({
      name: t.COMBINED_RESULT,
      description: 'A subresult which was part of a combined event.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        group: {
          type: new GraphQLNonNull(groupType),
          resolve: result => this.groupStore.getById(result.group),
        },
        athlete: {
          type: new GraphQLNonNull(athleteType),
          resolve: result => this.athleteStore.getById(result.athlete),
        },
        parentResult: {
          type: new GraphQLNonNull(athleteResultType),
          description: 'Reference to the result this result is part of.',
          resolve: result => this.resultStore.getById(result.parentResult),
        },
        position: {
          type: GraphQLInt,
        },
        performance: {
          type: GraphQLFloat,
        },
        exception: {
          type: GraphQLString,
        },
        wind: {
          type: GraphQLFloat,
        },
        qualified: {
          type: GraphQLString,
        },
        points: {
          type: GraphQLInt,
          description: 'The points received for the performance.',
        },
        attempts: {
          type: new GraphQLList(attemptType),
          resolve: athleteResult => this.attemptStore.getByProperty('result', athleteResult.id),
        },
        heights: {
          type: new GraphQLList(heightResultType),
          resolve: athleteResult => this.heightResultStore.getByProperty('result', athleteResult.id),
        },
        comment: {
          type: GraphQLString,
        },
        automaticTiming: {
          type: GraphQLBoolean,
        },
      }),
      interfaces: [resultInterface, athleteResultInterface],
    });

    const disciplineType = new GraphQLObjectType({
      name: t.DISCIPLINE,
      description: 'A discipline in which athletes or teams compete.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'The name of the discipline',
        },
      }),
    });

    const eventType = new GraphQLObjectType({
      name: t.EVENT,
      description: 'An event in a meeting is defined by a combination of age group and discipline',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        ageGroup: {
          type: new GraphQLNonNull(ageGroupType),
          resolve: event => this.ageGroupStore.getById(event.ageGroup),
        },
        discipline: {
          type: new GraphQLNonNull(disciplineType),
          resolve: event => this.disciplineStore.getById(event.discipline),
        },
        rounds: {
          type: new GraphQLList(roundType),
          description: 'A list of rounds in the competition',
          resolve: event => this.roundStore.getByProperty('event', event.id),
        },
        height: {
          type: GraphQLInt,
          description: 'The height of hurdles or others in mm',
        },
        weight: {
          type: GraphQLInt,
          description: 'The weight of javelin or others in grams',
        },
        combinedDisciplines: {
          type: new GraphQLList(combinedDisciplineType),
          description: `
            If a combined event, a list of disciplines that
            were part of the combined competition.
          `,
          resolve: event => this.combinedDisciplineStore.getByProperty('event', event.id),
        },
      }),
    });

    const groupType = new GraphQLObjectType({
      name: t.GROUP,
      description: 'A group of athletes starting together in a round (examples Group A, Heat 1)',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        number: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        round: {
          type: new GraphQLNonNull(roundType),
          resolve: group => this.roundStore.getById(group.round),
        },
        time: {
          type: GraphQLString,
          description: 'The time if there is a more exact time then the round time',
        },
        wind: {
          type: GraphQLFloat,
          description: 'Wind for all results in the group',
        },
        results: {
          type: new GraphQLList(resultInterface),
          resolve: group => this.resultStore.getByProperty('group', group.id),
        },
        heights: {
          type: new GraphQLList(heightType),
          description: 'A list of all heights that where put up in the group.',
          resolve: group => this.heightStore.getByProperty('group', group.id),
        },
        splitTimes: {
          type: new GraphQLList(splitTimeType),
          description: 'A list of split time from the race of this group',
          resolve: group => this.splitTimeStore.getByProperty('group', group.id),
        },
        comment: {
          type: GraphQLString,
        },
      }),
    });

    const heightType = new GraphQLObjectType({
      name: t.HEIGHT,
      description: 'A height which was put up in an group.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        group: {
          type: new GraphQLNonNull(groupType),
        },
        height: {
          type: GraphQLFloat,
        },
      }),
    });

    const heightResultType = new GraphQLObjectType({
      name: t.HEIGHT_RESULT,
      description: 'The performance for an athlete at a specific height.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        result: {
          type: new GraphQLNonNull(athleteResultInterface),
          resolve: heightResult => this.resultStore.getById(heightResult.result),
        },
        height: {
          type: new GraphQLNonNull(heightType),
          resolve: heightResult => this.heightStore.getById(heightResult.height),
        },
        performance: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Performance as a string of X, O and -',
        },
      }),
    });

    const meetingType = new GraphQLObjectType({
      name: t.MEETING,
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
        venue: {
          type: venueType,
          resolve: meeting => this.venueStore.getById(meeting.venue),
        },
        events: {
          type: new GraphQLList(eventType),
          resolve: meeting => this.eventStore.getByProperty('meeting', meeting.id),
        },
        startDate: {
          type: new GraphQLNonNull(GraphQLString),
        },
        endDate: {
          type: GraphQLString,
        },
      }),
    });

    const roundType = new GraphQLObjectType({
      name: t.ROUND,
      description: 'A round for an event (examples: Qualification, Heats, Final).',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
        date: {
          type: GraphQLString,
        },
        time: {
          type: GraphQLString,
        },
        event: {
          type: eventType,
          resolve: round => this.eventStore.getById(round.event),
        },
        groups: {
          type: new GraphQLList(groupType),
          resolve: round => this.groupStore.getByProperty('round', round.id),
        },
        comment: {
          type: GraphQLString,
        },
        combinedDiscipline: {
          type: combinedDisciplineType,
          description: `
             If this is a round within a combined event the discipline
              of the round is referenced here.
          `,
          resolve: round => this.combinedDisciplineStore.getById(round.combinedDiscipline),
        },
      }),
    });

    const splitTimeType = new GraphQLObjectType({
      name: t.SPLIT_TIME,
      description: 'Split times taken during a race of a group.',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        group: {
          type: new GraphQLNonNull(groupType),
          resolve: splitTime => this.groupStore.getById(splitTime.group),
        },
        distance: {
          type: new GraphQLNonNull(GraphQLInt),
          description: 'The distance that was run as this split time was taken in meters',
        },
        time: {
          type: new GraphQLNonNull(GraphQLFloat),
          description: 'The split time that was taken in seconds',
        },
        athlete: {
          type: athleteType,
          description: 'The athlete that was first at the split time',
          resolve: splitTime => this.athleteStore.getById(splitTime.athlete),
        },
      }),
    });

    const teamMemberType = new GraphQLObjectType({
      name: t.TEAM_MEMBER,
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        athlete: {
          type: new GraphQLNonNull(athleteType),
          resolve: teamMember => this.athleteStore.getById(teamMember.athlete),
        },
        performance: {
          type: GraphQLFloat,
        },
      }),
    });

    const teamResultType = new GraphQLObjectType({
      name: t.TEAM_RESULT,
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        group: {
          type: new GraphQLNonNull(groupType),
          resolve: result => this.groupStore.getById(result.group),
        },
        club: {
          type: new GraphQLNonNull(clubType),
          resolve: teamResult => this.clubStore.getById(teamResult.club),
        },
        position: {
          type: GraphQLInt,
        },
        performance: {
          type: GraphQLFloat,
        },
        exception: {
          type: GraphQLString,
        },
        qualified: {
          type: GraphQLString,
        },
        teamMembers: {
          type: new GraphQLList(teamMemberType),
          resolve: teamResult => this.teamMemberStore.getByProperty('result', teamResult.id),
        },
        comment: {
          type: GraphQLString,
        },
        automaticTiming: {
          type: GraphQLBoolean,
        },
      }),
      interfaces: [resultInterface],
    });

    const venueType = new GraphQLObjectType({
      name: t.VENUE,
      description: 'A venue where an event or the whole meeting takes place',
      fields: () => ({
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'The name of the venue',
        },
        city: {
          type: GraphQLString,
          description: 'The city of the venue',
        },
      }),
    });

    const queryType = new GraphQLObjectType({
      name: 'Query',
      fields: () => ({
        meeting: {
          type: meetingType,
          args: {
            id: {
              description: 'id of the meeting',
              type: new GraphQLNonNull(GraphQLID),
            },
          },
          resolve: (root, { id }) => this.meetingStore.getById(id),
        },
      }),
    });

    this.schema = new GraphQLSchema({
      query: queryType,
      types: [
        ageGroupType,
        associationType,
        athleteType,
        athleteResultType,
        attemptType,
        clubType,
        clubMemberType,
        combinedDisciplineType,
        combinedResultType,
        disciplineType,
        eventType,
        groupType,
        heightType,
        heightResultType,
        meetingType,
        roundType,
        splitTimeType,
        teamMemberType,
        teamResultType,
        venueType,
      ],
    });
  }

  addAthlete(firstName, lastName, yob, gender, citizenship, club, bib) {
    const athlete = {
      type: t.ATHLETE,
      firstName,
      lastName,
      yob,
      gender,
      citizenship,
      club,
      bib,
    };
    return this.athleteStore.add(athlete, [firstName, lastName, yob, club]);
  }

  getAthletesByBib(bib) {
    return this.athleteStore.getByProperty('bib', bib);
  }

  addAthleteResult(athlete, group, performance, exception, wind, position, qualified, weight, comment, automaticTiming = true) {
    const result = {
      type: t.ATHLETE_RESULT,
      athlete,
      group,
      performance,
      exception,
      wind,
      position,
      qualified,
      weight,
      comment,
      automaticTiming,
    };
    return this.resultStore.add(result, [athlete, null, group, performance, wind]);
  }

  addAgeGroup(name) {
    const ageGroup = {
      type: t.AGE_GROUP,
      name,
    };
    return this.ageGroupStore.add(ageGroup, name);
  }

  addClub(name) {
    const club = {
      type: t.CLUB,
      name,
    };
    return this.clubStore.add(club, name);
  }

  addDiscipline(name) {
    const discipline = {
      type: t.DISCIPLINE,
      name,
    };
    return this.disciplineStore.add(discipline, name);
  }

  addEvent(meeting, ageGroup, discipline, height, weight) {
    const event = {
      type: t.EVENT,
      meeting,
      ageGroup,
      discipline,
      height,
      weight,
    };
    return this.eventStore.add(event, [meeting, ageGroup, discipline]);
  }

  addGroup(round, number, time, wind, comment) {
    const group = {
      type: t.GROUP,
      round,
      number,
      time,
      wind,
      comment,
    };
    return this.groupStore.add(group, [round, number]);
  }

  getGroupByRoundAndNumber(round, number) {
    return this.groupStore.getByKey([round, number]);
  }

  addMeeting(name, venue, startDate, endDate) {
    const meeting = {
      type: t.MEETING,
      name,
      venue,
      startDate,
      endDate,
    };
    return this.meetingStore.add(meeting, name);
  }

  getMeetingById(id) {
    return this.meetingStore.getById(id);
  }

  addRound(event, name, date, time, comment, combinedDiscipline) {
    const round = {
      type: t.ROUND,
      event,
      name,
      date,
      time,
      comment,
      combinedDiscipline,
    };
    return this.roundStore.add(round, [event, name]);
  }

  addVenue(name, city) {
    const venue = {
      type: t.VENUE,
      name,
      city,
    };
    return this.venueStore.add(venue, [name, city]);
  }

  addTeamMember(result, athlete, performance) {
    const teamMember = {
      type: t.TEAM_MEMBER,
      result,
      athlete,
      performance,
    };
    this.teamMemberStore.add(teamMember, [result, athlete]);
  }

  addTeamResult(club, group, performance, exception, position, qualified, comment, automaticTiming = true) {
    const result = {
      type: t.TEAM_RESULT,
      club,
      group,
      performance,
      exception,
      position,
      qualified,
      comment,
      automaticTiming,
    };
    return this.resultStore.add(result, [null, club, group, performance, null]);
  }

  getResultById(id) {
    return this.resultStore.getById(id);
  }

  addSplitTime(group, distance, time, athlete) {
    const splitTime = {
      type: t.SPLIT_TIME,
      group,
      distance,
      time,
      athlete,
    };
    return this.splitTimeStore.add(splitTime, [group, distance]);
  }

  addAttempt(result, number, performance, exception, wind) {
    const attempt = {
      type: t.ATTEMPT,
      result,
      number,
      performance,
      wind,
      exception,
    };
    return this.attemptStore.add(attempt, [result, number]);
  }

  getAttemptByResultAndNumber(result, number) {
    return this.attemptStore.getByKey([result, number]);
  }

  addCombinedDiscipline(event, discipline, order) {
    const combinedDiscipline = {
      type: t.COMBINED_DISCIPLINE,
      event,
      discipline,
      order,
    };
    return this.combinedDisciplineStore.add(combinedDiscipline, [event, discipline]);
  }

  getCombinedDisciplineByEventAndDiscipline(event, discipline) {
    return this.combinedDisciplineStore.getByKey([event, discipline]);
  }

  addCombinedResult(athlete, group, parentResult, performance, exception, wind, points, position, qualified, weight, comment, automaticTiming = true) {
    const result = {
      type: t.COMBINED_RESULT,
      athlete,
      group,
      performance,
      exception,
      wind,
      points,
      position,
      qualified,
      weight,
      comment,
      automaticTiming,
      parentResult,
    };
    return this.resultStore.add(result, [athlete, null, group, performance, wind]);
  }

  addHeight(group, value) {
    const height = {
      type: t.HEIGHT,
      group,
      height: value,
    };
    return this.heightStore.add(height, [group, value]);
  }

  addHeightResult(result, height, performance) {
    const heightResult = {
      type: t.HEIGHT_RESULT,
      result,
      height,
      performance,
    };
    return this.heightResultStore.add(heightResult, [result, height]);
  }

  getSchema() {
    return this.schema;
  }
}

