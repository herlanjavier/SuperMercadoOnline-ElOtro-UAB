# Backend Tests

Run all tests:

```bash
npm test
```

Run only unit tests:

```bash
npm run test:unit
```

Run only integration tests:

```bash
npm run test:integration
```

Run coverage:

```bash
npm run test:coverage
```

Unit tests use mocks and pure helpers. Integration tests use Supertest with mocked Supabase clients, so they do not require real Supabase credentials.

Do not run automated tests against the production Supabase project. If real integration testing is needed, create a separate Supabase testing project and isolated test data.
