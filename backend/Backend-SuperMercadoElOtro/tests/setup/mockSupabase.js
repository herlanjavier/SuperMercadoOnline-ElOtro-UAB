export const mockState = {
  user: { id: '00000000-0000-4000-8000-000000000001', email: 'user@test.com', aud: 'authenticated', role: 'authenticated' },
  role: 'customer',
  profile: null,
  tables: {
    profiles: [],
    products: [],
    orders: [],
    order_items: [],
    sales: [],
    sale_items: [],
    business_hours: [],
    inventory_entries: [],
    categories: [],
  },
  signOutError: null,
};

export const resetMockSupabase = () => {
  mockState.role = 'customer';
  mockState.profile = null;
  mockState.tables = {
    profiles: [],
    products: [],
    orders: [],
    order_items: [],
    sales: [],
    sale_items: [],
    business_hours: [],
    inventory_entries: [],
    categories: [],
  };
  mockState.signOutError = null;
};

export const setMockRole = (role) => {
  mockState.role = role;
};

const profile = () =>
  mockState.profile || {
    id: mockState.user.id,
    role: mockState.role,
    is_active: true,
    first_name: 'Test',
    last_name: 'User',
    address: 'Zona Test',
    address_reference: 'Referencia',
  };

const tableData = (table) => {
  if (table === 'profiles') return [profile(), ...mockState.tables.profiles];
  return mockState.tables[table] || [];
};

const createBuilder = (table) => {
  const builder = {
    _data: tableData(table),
    select() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    eq(column, value) {
      this._data = this._data.filter((row) => row[column] === value);
      return this;
    },
    in(column, values) {
      this._data = this._data.filter((row) => values.includes(row[column]));
      return this;
    },
    gte(column, value) {
      this._data = this._data.filter((row) => row[column] >= value);
      return this;
    },
    lte(column, value) {
      this._data = this._data.filter((row) => row[column] <= value);
      return this;
    },
    lt(column, value) {
      this._data = this._data.filter((row) => row[column] < value);
      return this;
    },
    gt(column, value) {
      this._data = this._data.filter((row) => row[column] > value);
      return this;
    },
    or() {
      return this;
    },
    ilike() {
      return this;
    },
    like() {
      return this;
    },
    update(values) {
      this._data = this._data.map((row) => ({ ...row, ...values }));
      return this;
    },
    insert(values) {
      const rows = Array.isArray(values) ? values : [values];
      this._data = rows.map((row, index) => ({ id: row.id || `mock-${table}-${index}`, ...row }));
      return this;
    },
    upsert(values) {
      return this.insert(values);
    },
    delete() {
      this._data = [];
      return this;
    },
    single() {
      return Promise.resolve({ data: this._data[0] || null, error: this._data[0] ? null : { message: 'Not found' } });
    },
    maybeSingle() {
      return Promise.resolve({ data: this._data[0] || null, error: null });
    },
    then(resolve) {
      return resolve({ data: this._data, error: null, count: this._data.length });
    },
  };

  return builder;
};

export const supabaseAdmin = {
  from: (table) => createBuilder(table),
  auth: {
    admin: {
      createUser: async ({ email }) => ({ data: { user: { id: '00000000-0000-4000-8000-000000000002', email } }, error: null }),
      signOut: async () => ({ error: mockState.signOutError }),
    },
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      remove: async () => ({ error: null }),
      getPublicUrl: (path) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
      createSignedUrl: async (path) => ({ data: { signedUrl: `https://storage.test/signed/${path}` }, error: null }),
    }),
  },
};

export const supabasePublic = {
  auth: {
    getUser: async (token) =>
      token
        ? { data: { user: mockState.user }, error: null }
        : { data: { user: null }, error: { message: 'Invalid token' } },
    signInWithPassword: async () => ({ data: {}, error: { message: 'Invalid credentials' } }),
    signUp: async ({ email }) => ({ data: { user: { id: '00000000-0000-4000-8000-000000000003', email } }, error: null }),
  },
};
