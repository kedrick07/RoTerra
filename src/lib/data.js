// RoTerra data loading helpers.
// Reads the static JSON files in public/data/ and reports each file's state
// explicitly, so the UI can show loading / missing / error states instead of
// silently dropping data.
//
// Each load returns one of:
//   { status: 'ok',      data }
//   { status: 'missing', error }   // file not found (404)
//   { status: 'error',   error }   // network failure, bad JSON, or bad shape

export const DATA_FILES = ['site', 'trends', 'soil', 'crops', 'rotations', 'evidence'];

// Light shape checks for the files the scoring engine depends on.
// Each returns a list of problems (empty list = looks fine).
const VALIDATORS = {
  crops: (json) => {
    if (!Array.isArray(json?.crops)) return ['crops.json must have a "crops" array.'];
    return json.crops.flatMap((c, i) => {
      const problems = [];
      if (!c.crop_id) problems.push(`crops[${i}] is missing "crop_id".`);
      if (!c.traits || typeof c.traits !== 'object') problems.push(`crops[${i}] is missing "traits".`);
      return problems;
    });
  },
  rotations: (json) => {
    if (!Array.isArray(json?.rotations)) return ['rotations.json must have a "rotations" array.'];
    return json.rotations.flatMap((r, i) => {
      const problems = [];
      if (!r.id) problems.push(`rotations[${i}] is missing "id".`);
      if (!Array.isArray(r.sequence) || r.sequence.length === 0) {
        problems.push(`rotations[${i}] needs a non-empty "sequence".`);
      }
      return problems;
    });
  },
  trends: (json) => {
    if (!Array.isArray(json?.indicators)) return ['trends.json must have an "indicators" array.'];
    return json.indicators.flatMap((ind, i) => {
      const problems = [];
      if (!ind.id) problems.push(`indicators[${i}] is missing "id".`);
      if (!Array.isArray(ind.values)) problems.push(`indicators[${i}] is missing a "values" array.`);
      return problems;
    });
  },
};

export function validateDataFile(name, json) {
  const validator = VALIDATORS[name];
  return validator ? validator(json) : [];
}

// Vite sets BASE_URL (e.g. "/RoTerra/" on GitHub Pages). Falls back to "/".
function defaultBaseUrl() {
  return import.meta.env?.BASE_URL ?? '/';
}

export async function loadDataFile(name, { baseUrl = defaultBaseUrl(), fetchFn = globalThis.fetch } = {}) {
  const url = `${baseUrl.replace(/\/?$/, '/')}data/${name}.json`;
  let response;
  try {
    response = await fetchFn(url);
  } catch (err) {
    return { status: 'error', error: `Could not load ${name}.json: ${err.message}` };
  }
  if (response.status === 404) {
    return { status: 'missing', error: `${name}.json was not found in public/data/.` };
  }
  if (!response.ok) {
    return { status: 'error', error: `Could not load ${name}.json (HTTP ${response.status}).` };
  }

  let json;
  try {
    json = await response.json();
  } catch {
    return { status: 'error', error: `${name}.json is not valid JSON.` };
  }

  const problems = validateDataFile(name, json);
  if (problems.length > 0) {
    return { status: 'error', error: `${name}.json has problems: ${problems.join(' ')}` };
  }
  return { status: 'ok', data: json };
}

// Loads every file in parallel. Returns { site: {status, ...}, trends: {...}, ... }.
export async function loadAllData(options = {}) {
  const entries = await Promise.all(
    DATA_FILES.map(async (name) => [name, await loadDataFile(name, options)]),
  );
  return Object.fromEntries(entries);
}
