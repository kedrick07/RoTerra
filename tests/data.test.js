// Run with: node --test
// Tests the data loader with a fake fetch, so no server or network is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadAllData, loadDataFile } from '../src/lib/data.js';

const fakeResponse = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
});

test('ok: valid file loads with status "ok"', async () => {
  const fetchFn = async () => fakeResponse(200, { crops: [{ crop_id: 'rice', traits: {} }] });
  const result = await loadDataFile('crops', { baseUrl: '/', fetchFn });
  assert.equal(result.status, 'ok');
  assert.equal(result.data.crops[0].crop_id, 'rice');
});

test('missing: 404 gives status "missing"', async () => {
  const fetchFn = async () => fakeResponse(404, {});
  const result = await loadDataFile('soil', { baseUrl: '/', fetchFn });
  assert.equal(result.status, 'missing');
  assert.match(result.error, /soil\.json was not found/);
});

test('error: network failure gives status "error"', async () => {
  const fetchFn = async () => { throw new Error('offline'); };
  const result = await loadDataFile('site', { baseUrl: '/', fetchFn });
  assert.equal(result.status, 'error');
  assert.match(result.error, /offline/);
});

test('error: bad JSON gives status "error"', async () => {
  const fetchFn = async () => fakeResponse(200, '{not json');
  const result = await loadDataFile('trends', { baseUrl: '/', fetchFn });
  assert.equal(result.status, 'error');
  assert.match(result.error, /not valid JSON/);
});

test('error: wrong shape is caught before the engine sees it', async () => {
  const fetchFn = async () => fakeResponse(200, { rotations: [{ id: 'baseline', sequence: [] }] });
  const result = await loadDataFile('rotations', { baseUrl: '/', fetchFn });
  assert.equal(result.status, 'error');
  assert.match(result.error, /non-empty "sequence"/);
});

test('base URL is respected (GitHub Pages sub-path)', async () => {
  const seen = [];
  const fetchFn = async (url) => { seen.push(url); return fakeResponse(200, {}); };
  await loadDataFile('site', { baseUrl: '/RoTerra/', fetchFn });
  await loadDataFile('site', { baseUrl: '/RoTerra', fetchFn });
  assert.deepEqual(seen, ['/RoTerra/data/site.json', '/RoTerra/data/site.json']);
});

test('loadAllData reports each file separately', async () => {
  const fetchFn = async (url) => (url.endsWith('soil.json') ? fakeResponse(404, {}) : fakeResponse(200, {
    crops: [], rotations: [], indicators: [],
  }));
  const all = await loadAllData({ baseUrl: '/', fetchFn });
  assert.deepEqual(Object.keys(all), ['site', 'trends', 'soil', 'crops', 'rotations', 'evidence']);
  assert.equal(all.soil.status, 'missing');
  assert.equal(all.crops.status, 'ok');
});
