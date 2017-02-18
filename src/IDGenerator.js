export default class IDGenerator {
  constructor() {
    this.nextIds = {};
  }
  generate(type) {
    if (!this.nextIds[type]) {
      this.nextIds[type] = 2;
      return 1;
    }
    const nextId = this.nextIds[type];
    this.nextIds[type] += 1;
    return nextId;
  }
}
