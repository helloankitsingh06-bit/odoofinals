class MockDocRef {
  constructor(collection, id, data) {
    this.collection = collection;
    this.id = id;
    this.dataVal = data;
  }

  async get() {
    return {
      exists: !!this.dataVal,
      id: this.id,
      data: () => this.dataVal
    };
  }

  async update(updates) {
    if (!this.dataVal) throw new Error('Document does not exist');
    Object.assign(this.dataVal, updates);
    this.collection.store[this.id] = this.dataVal;
  }

  async set(data) {
    this.dataVal = data;
    this.collection.store[this.id] = data;
  }

  async delete() {
    delete this.collection.store[this.id];
    this.dataVal = null;
  }
}

class MockQuery {
  constructor(collection, filters = [], limitVal = null, orderBys = []) {
    this.collection = collection;
    this.filters = filters;
    this.limitVal = limitVal;
    this.orderBys = orderBys;
  }

  where(field, op, value) {
    return new MockQuery(this.collection, [...this.filters, { field, op, value }], this.limitVal, this.orderBys);
  }

  limit(n) {
    return new MockQuery(this.collection, this.filters, n, this.orderBys);
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(this.collection, this.filters, this.limitVal, [...this.orderBys, { field, direction }]);
  }

  async get() {
    let docs = Object.entries(this.collection.store).map(([id, data]) => {
      return {
        id,
        ref: new MockDocRef(this.collection, id, data),
        data: () => ({ ...data })
      };
    });

    for (const filter of this.filters) {
      docs = docs.filter(doc => {
        const val = doc.data()[filter.field];
        if (filter.op === '==') return val === filter.value;
        if (filter.op === '<') return val < filter.value;
        if (filter.op === '>') return val > filter.value;
        if (filter.op === 'in') return filter.value.includes(val);
        return true;
      });
    }

    for (const ob of this.orderBys) {
      docs.sort((a, b) => {
        const valA = a.data()[ob.field];
        const valB = b.data()[ob.field];
        if (valA < valB) return ob.direction === 'desc' ? 1 : -1;
        if (valA > valB) return ob.direction === 'desc' ? -1 : 1;
        return 0;
      });
    }

    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    return {
      empty: docs.length === 0,
      docs,
      forEach: (cb) => docs.forEach(cb)
    };
  }
}

class MockCollection {
  constructor() {
    this.store = {};
  }

  doc(id) {
    const finalId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocRef(this, finalId, this.store[finalId] || null);
  }

  where(field, op, value) {
    return new MockQuery(this).where(field, op, value);
  }

  limit(n) {
    return new MockQuery(this).limit(n);
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(this).orderBy(field, direction);
  }

  async add(data) {
    const id = Math.random().toString(36).substring(2, 15);
    this.store[id] = { ...data };
    return { id, ref: new MockDocRef(this, id, this.store[id]) };
  }

  async get() {
    return new MockQuery(this).get();
  }
}

class MockFirestore {
  constructor() {
    this.collections = {};
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new MockCollection();
    }
    return this.collections[name];
  }
}

module.exports = MockFirestore;
