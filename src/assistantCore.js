const knowledgeBase = [
  {
    id: "eligibility",
    keywords: ["eligible", "eligibility", "age", "citizen", "qualify", "first time", "first-time"],
    title: "Eligibility",
    focus: "Confirm whether the voter can participate before they spend time on forms.",
    points: [
      "Check the minimum voting age, citizenship rules, and residence rules for the selected region.",
      "Confirm the voter is registered in the correct constituency, ward, district, or polling area.",
      "If the voter recently moved, they should update their address instead of relying on old details."
    ],
    nextStep: "Use the official election authority website to verify eligibility and voter-list status."
  },
  {
    id: "registration",
    keywords: ["register", "registration", "enrol", "enroll", "deadline", "form", "application"],
    title: "Registration",
    focus: "Help the voter get their name on the roll before the deadline.",
    points: [
      "Find the official election authority website for the country, state, or district.",
      "Submit the required registration or correction form with identity, age, and address proof where required.",
      "Save the application number and check status regularly until the voter-list entry is confirmed."
    ],
    nextStep: "Set a reminder at least two weeks before the registration deadline."
  },
  {
    id: "documents",
    keywords: ["document", "id", "identity", "carry", "proof", "polling", "station", "booth"],
    title: "Documents and Polling Station",
    focus: "Reduce polling-day surprises by preparing documents and location details early.",
    points: [
      "Carry an accepted photo ID and any voter slip or official confirmation available in the region.",
      "Verify the polling station address from an official source close to election day.",
      "Avoid relying on forwarded messages for booth location, accepted ID lists, or schedule changes."
    ],
    nextStep: "Check polling station details again the day before voting."
  },
  {
    id: "timeline",
    keywords: ["timeline", "date", "schedule", "before", "prepare", "calendar", "plan"],
    title: "Timeline",
    focus: "Turn the election process into a sequence of manageable actions.",
    points: [
      "Track registration deadline, voter-list publication, candidate list publication, campaign silence period, polling day, and counting day.",
      "Create reminders before each deadline so missing documents or errors can be fixed.",
      "Keep a final polling-day checklist with ID, booth address, transport plan, and official helpline details."
    ],
    nextStep: "Use the timeline planner to generate reminders and Google Calendar links."
  },
  {
    id: "counting",
    keywords: ["count", "counting", "result", "winner", "declare", "certify", "elected"],
    title: "Counting and Results",
    focus: "Explain how results become official without amplifying rumors.",
    points: [
      "Votes are counted according to the election system and counting rules used in the region.",
      "Early trends can change until counting is complete and official certification is published.",
      "Users should rely on official result portals and avoid sharing unverified claims."
    ],
    nextStep: "Check certified results on the official election authority portal."
  }
];

function findTopic(question) {
  const normalizedQuestion = String(question || "").toLowerCase();
  return knowledgeBase.find((entry) => entry.keywords.some((keyword) => normalizedQuestion.includes(keyword))) || knowledgeBase[0];
}

function buildLocalAnswer({ question, role, region }) {
  const topic = findTopic(question);
  const safeRole = role || "voter";
  const safeRegion = region || "your region";

  return {
    source: "local",
    topic: topic.title,
    summary: `For a ${safeRole} in ${safeRegion}, the best starting point is ${topic.title.toLowerCase()}. ${topic.focus}`,
    steps: topic.points,
    nextStep: topic.nextStep,
    caution: "Election rules, accepted documents, deadlines, and polling locations vary by region. Verify final details with the official election authority."
  };
}

async function buildGeminiAnswer({ question, role, region, apiKey }) {
  if (!apiKey) {
    return null;
  }

  const prompt = [
    "You are Ballot Buddy, a neutral election process education assistant.",
    "Return valid JSON only with keys: topic, summary, steps, nextStep, caution.",
    "steps must be an array of 3 to 5 short strings.",
    "Do not support or oppose parties, candidates, or policies.",
    "Do not invent official dates, legal requirements, polling places, or document lists.",
    "Tell the user to verify final details with the official election authority.",
    `User role: ${role || "voter"}`,
    `User region: ${region || "not specified"}`,
    `Question: ${question}`
  ].join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no content");
  }

  const parsed = JSON.parse(text);
  return {
    source: "gemini",
    topic: parsed.topic || "Election process",
    summary: parsed.summary || "Here is a neutral election process guide.",
    steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 5) : [],
    nextStep: parsed.nextStep || "Verify the next step with the official election authority.",
    caution: parsed.caution || "Always verify final election information with official sources."
  };
}

async function answerQuestion(input) {
  const question = String(input?.question || "").trim();
  if (!question) {
    const error = new Error("Question is required");
    error.statusCode = 400;
    throw error;
  }

  try {
    const geminiAnswer = await buildGeminiAnswer({
      question,
      role: input.role,
      region: input.region,
      apiKey: process.env.GEMINI_API_KEY
    });

    if (geminiAnswer) {
      return geminiAnswer;
    }
  } catch (error) {
    const fallback = buildLocalAnswer(input);
    return {
      ...fallback,
      source: "local-fallback",
      note: "Gemini was unavailable, so the backend used the built-in election guide."
    };
  }

  return buildLocalAnswer(input);
}

module.exports = {
  answerQuestion,
  buildLocalAnswer,
  findTopic
};
