import { expect } from 'chai';
import { describe, it } from 'mocha';
import ObjectStore from '../src/ObjectStore';

describe('ObjectStore', () => {
  it('should not return the same key twice', () => {
    const store = new ObjectStore();
    const id1 = store.add({}, 1);
    const id2 = store.add({}, 1);
    expect(id1).to.equal(id2);
  });

  it('should return a list of all entries', () => {
    const store = new ObjectStore();
    store.add({ name: 'test1' }, 1);
    store.add({ name: 'test2' }, 2);
    expect(store.getAll()).to.deep.equal([
      {
        id: 1,
        name: 'test1'
      },
      {
        id: 2,
        name: 'test2'
      }
    ]);
  });

  it('should return an entry by id', () => {
    const store = new ObjectStore();
    store.add({ name: 'test1' }, 1);
    expect(store.getById(1)).to.deep.equal({
      id: 1,
      name: 'test1'
    });
  });

  it('should return an entry by key', () => {
    const store = new ObjectStore();
    store.add({ name: 'test1' }, 'test');
    expect(store.getByKey('test')).to.deep.equal({
      id: 1,
      name: 'test1'
    });
  });

  it('should return a list of objects with a certain porperty', () => {
    const store = new ObjectStore();
    store.add({ name: 'test1' }, 'test');
    store.add({ name: 'test2' }, 'test');
    expect(store.getByProperty('name', 'test1')).to.deep.equal([
      {
        id: 1,
        name: 'test1'
      }
    ]);
  });
});
