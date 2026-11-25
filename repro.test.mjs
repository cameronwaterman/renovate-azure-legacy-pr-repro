import assert from 'node:assert/strict';
import test from 'node:test';

const source = 'refs/heads/renovate/example-update';
const target = 'refs/heads/main';
const previous = { id: 1, source, target, active: true, author: 'old-bot' };

function fakeAzure() {
  const queries = [];
  return {
    queries,
    list(criteria, limit = Infinity) {
      queries.push({ criteria, limit });
      return [previous]
        .filter((pr) => Object.entries(criteria).every(([key, value]) => pr[key] === value))
        .slice(0, limit);
    },
    create(pair, author) {
      if (previous.active && pair.source === previous.source && pair.target === previous.target) {
        throw new Error('TF401179: An active pull request already exists for this branch pair.');
      }
      return { id: 2, ...pair, active: true, author };
    },
  };
}

function ensureUpdate(azure, pair, legacyAuthors = []) {
  const author = 'new-bot';
  const exact = { ...pair, active: true };
  const own = azure.list({ author }).find(
    (pr) => pr.active && pr.source === pair.source && pr.target === pair.target,
  );
  if (own) {
    return own;
  }
  if (legacyAuthors.length) {
    const [existing] = azure.list(exact, 1);
    if (existing && legacyAuthors.includes(existing.author)) {
      return existing;
    }
  }
  return azure.create(pair, author);
}

test('default discovery misses the previous account and Azure rejects the duplicate', () => {
  const azure = fakeAzure();
  assert.throws(() => ensureUpdate(azure, { source, target }), /TF401179/);
  assert.equal(azure.queries.length, 1);
});

test('a bounded exact-pair query reuses the allowlisted active PR', () => {
  const azure = fakeAzure();
  assert.equal(ensureUpdate(azure, { source, target }, ['old-bot']).id, 1);
  assert.deepEqual(azure.queries[1], { criteria: { source, target, active: true }, limit: 1 });
});

test('an unlisted author is not adopted, and a different target is not a match', () => {
  const azure = fakeAzure();
  assert.throws(() => ensureUpdate(azure, { source, target }, ['other-bot']), /TF401179/);
  assert.equal(ensureUpdate(azure, { source, target: 'refs/heads/other' }, ['old-bot']).id, 2);
});
