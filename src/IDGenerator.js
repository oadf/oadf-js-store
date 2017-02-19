export default class IDGenerator {
  constructor() {
    this.nextId = 1;
  }
  generate() {
    const nextId = this.nextId;
    this.nextId += 1;
    return nextId;
  }
}
