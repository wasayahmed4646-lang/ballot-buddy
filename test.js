const assert = require("assert");
const { buildLocalAnswer } = require("./src/assistantCore");
const { calculateReadiness } = require("./src/readinessCore");

function testLocalAssistantAnswer() {
  const answer = buildLocalAnswer({
    question: "What should I carry to the polling station?",
    role: "first-time voter",
    region: "India"
  });

  assert.strictEqual(answer.topic, "Documents and Polling Station");
  assert.ok(answer.steps.length >= 3);
  assert.match(answer.caution, /official election authority/i);
}

function testReadyVoterScore() {
  const result = calculateReadiness({
    age: 22,
    registered: "yes",
    hasId: "yes",
    boothKnown: "yes"
  });

  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.level, "Ready");
}

function testIncompleteVoterScore() {
  const result = calculateReadiness({
    age: 30,
    registered: "no",
    hasId: "unsure",
    boothKnown: "no"
  });

  assert.strictEqual(result.score, 35);
  assert.strictEqual(result.level, "Needs attention");
  assert.strictEqual(result.actions.length, 3);
}

function testUnderAgeVoterScore() {
  const result = calculateReadiness({
    age: 16,
    registered: "no",
    hasId: "no",
    boothKnown: "no"
  });

  assert.strictEqual(result.score, 20);
  assert.match(result.actions[0], /not eligible yet/i);
}

function testInvalidAge() {
  assert.throws(() => calculateReadiness({ age: 0 }), /valid age/);
}

testLocalAssistantAnswer();
testReadyVoterScore();
testIncompleteVoterScore();
testUnderAgeVoterScore();
testInvalidAge();

console.log("All VoteSetu India tests passed.");
