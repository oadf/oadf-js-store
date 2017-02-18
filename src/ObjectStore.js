import { Map, fromJS } from 'immutable';
import IDGenerator from './IDGenerator';

export default class ObjectStore {
  constructor() {
    this.idMap = Map();
    this.keyMap = Map();
    this.all = [];
    this.idGen = new IDGenerator();
  }

  add(object, key) {
    key = fromJS(key);
    if (this.keyMap.has(key)) {
      return this.keyMap.get(key);
    }

    const id = this.idGen.generate(object.type);
    object.id = id;
    this.idMap = this.idMap.set(id, object);
    this.keyMap = this.keyMap.set(key, id);

    this.all.push(object);

    return id;
  }

  getAll() {
    return this.all;
  }

  getByKey(key) {
    key = fromJS(key);
    return this.getById(this.keyMap.get(key));
  }

  getById(id) {
    id = parseInt(id, 10);
    return this.idMap.get(id);
  }

  getByProperty(property, value) {
    return this.all.filter(element => element[property] === value);
  }
}
