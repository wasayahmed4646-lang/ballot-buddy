const assert = require("assert");
const { answerQuestion, buildLocalAnswer, findTopic } = require("./src/assistantCore");
const { calculateReadiness } = require("./src/readinessCore");
const resourcesHandler = require("./api/resources");

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test("assistant maps polling-station questions to document guidance", () => {
  const answer = buildLocalAnswer({
    question: "What should I carry to the polling station?",
    role: "first-time voter",
    region: "India"
  });

  assert.strictEqual(answer.topic, "Documents and Polling Station");
  assert.ok(answer.steps.length >= 3);
  assert.match(answer.caution, /official election authority/i);
});

test("assistant maps counting questions to result guidance", () => {
  const topic = findTopic("How are votes counted and results declared?");
  assert.strictEqual(topic.id, "counting");
});

test("assistant rejects empty questions", async () => {
  await assert.rejects(() => answerQuestion({ question: "   " }), /Question is required/);
});

test("assistant falls back safely when Gemini fails", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  process.env.GEMINI_API_KEY = "fake-key";
  global.fetch = async () => ({
    ok: false,
    status: 403
  });

  try {
    const answer = await answerQuestion({
      question: "How do I register?",
      role: "student voter",
      region: "Maharashtra"
    });

    assert.strictEqual(answer.source, "local-fallback");
    assert.match(answer.note, /Gemini was unavailable/i);
    assert.match(answer.summary, /student voter/i);
  } finally {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    global.fetch = originalFetch;
  }
});

test("readiness gives full score to prepared voters", () => {
  const result = calculateReadiness({
    age: 22,
    registered: "yes",
    hasId: "yes",
    boothKnown: "yes"
  });

  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.level, "Ready");
});

test("readiness penalizes missing registration, ID, and booth knowledge", () => {
  const result = calculateReadiness({
    age: 30,
    registered: "no",
    hasId: "unsure",
    boothKnown: "no"
  });

  assert.strictEqual(result.score, 35);
  assert.strictEqual(result.level, "Needs attention");
  assert.strictEqual(result.actions.length, 3);
});

test("readiness handles under-age users", () => {
  const result = calculateReadiness({
    age: 16,
    registered: "no",
    hasId: "no",
    boothKnown: "no"
  });

  assert.strictEqual(result.score, 20);
  assert.match(result.actions[0], /not eligible yet/i);
});

test("readiness rejects invalid ages", () => {
  assert.throws(() => calculateReadiness({ age: 0 }), /valid age/);
  assert.throws(() => calculateReadiness({ age: 121 }), /valid age/);
  assert.throws(() => calculateReadiness({ age: 18.5 }), /valid age/);
});

test("resource helpers build Google service links", () => {
  const searchUrl = resourcesHandler.buildGoogleSearchUrl("Hyderabad");
  const mapsUrl = resourcesHandler.buildGoogleMapsUrl("Hyderabad");

  assert.match(searchUrl, /^https:\/\/www\.google\.com\/search/);
  assert.match(mapsUrl, /^https:\/\/www\.google\.com\/maps\/search/);
  assert.match(searchUrl, /Hyderabad/);
});

test("resources endpoint returns curated official links without Google keys", async () => {
  const originalKey = process.env.GOOGLE_SEARCH_API_KEY;
  const originalCx = process.env.GOOGLE_SEARCH_CX;
  delete process.env.GOOGLE_SEARCH_API_KEY;
  delete process.env.GOOGLE_SEARCH_CX;

  const payload = await callResourcesHandler({ region: "Delhi" });

  if (originalKey !== undefined) process.env.GOOGLE_SEARCH_API_KEY = originalKey;
  if (originalCx !== undefined) process.env.GOOGLE_SEARCH_CX = originalCx;

  assert.strictEqual(payload.statusCode, 200);
  assert.strictEqual(payload.body.source, "curated");
  assert.ok(payload.body.resources.some((resource) => resource.url.includes("eci.gov.in")));
  assert.match(payload.body.googleMapsUrl, /google\.com\/maps/);
});

async function callResourcesHandler(query) {
  let statusCode = 200;
  let body = null;

  await resourcesHandler(
    { query },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        body = payload;
      }
    }
  );

  return { statusCode, body };
}

async function runTests() {
  for (const entry of tests) {
    await entry.run();
    console.log(`PASS ${entry.name}`);
  }

  console.log(`${tests.length} VoteSetu India tests passed.`);
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
