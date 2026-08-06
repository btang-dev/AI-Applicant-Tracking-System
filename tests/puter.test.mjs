import test from 'node:test';
import assert from 'node:assert/strict';
import { isPuterAuthApiReady } from '../app/lib/puter.ts';

test('treats Puter auth methods as ready only when the full auth API exists', () => {
  assert.equal(isPuterAuthApiReady(null), false);
  assert.equal(isPuterAuthApiReady({ auth: {} }), false);
  assert.equal(
    isPuterAuthApiReady({
      auth: {
        signIn() {},
        signOut() {},
        isSignedIn() { return false; },
        getUser() { return null; },
      },
    }),
    true,
  );
});
