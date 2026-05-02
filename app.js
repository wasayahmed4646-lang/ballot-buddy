const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const questionInput = document.querySelector("#question");
const roleInput = document.querySelector("#role");
const regionInput = document.querySelector("#region");
const apiKeyInput = document.querySelector("#apiKey");
const saveKeyButton = document.querySelector("#saveKey");
const plannerForm = document.querySelector("#plannerForm");
const timelineOutput = document.querySelector("#timelineOutput");
const quizResult = document.querySelector("#quizResult");

const storedKey = localStorage.getItem("ballotBuddyGeminiKey");
if (storedKey) {
  apiKeyInput.value = storedKey;
}

const knowledgeBase = [
  {
    keywords: ["eligib", "age", "citizen", "qualify"],
    title: "Eligibility",
    points: [
      "Check the minimum voting age, citizenship rules, and residence rules for your region.",
      "Confirm that your name appears on the voter list before the deadline.",
      "If you recently moved, update your address before relying on an old registration."
    ]
  },
  {
    keywords: ["register", "registration", "enrol", "enroll", "deadline", "form"],
    title: "Registration",
    points: [
      "Find the official election authority website for your country, state, or district.",
      "Submit the required form with identity, age, and residence proof where required.",
      "Save your application number or confirmation receipt and check status regularly."
    ]
  },
  {
    keywords: ["document", "id", "carry", "proof", "polling"],
    title: "Documents and Polling Station",
    points: [
      "Carry an accepted photo ID and any voter slip or official confirmation available in your area.",
      "Verify the polling station address from the official election authority close to election day.",
      "Do not rely only on forwarded messages for booth location or document rules."
    ]
  },
  {
    keywords: ["timeline", "date", "schedule", "before", "prepare"],
    title: "Timeline",
    points: [
      "Start by noting the registration deadline, candidate list publication, campaign silence period, polling day, and counting day.",
      "Set reminders two weeks before each deadline so you have time to fix missing documents.",
      "Use the planner below to generate a checklist and Google Calendar reminders."
    ]
  },
  {
    keywords: ["count", "result", "winner", "declare", "certify"],
    title: "Counting and Results",
    points: [
      "Votes are counted according to the election system used in that region.",
      "Preliminary trends can change until counting is complete and results are certified.",
      "Use official result portals for final outcomes and avoid sharing unverified claims."
    ]
  }
];

function addMessage(type, title, text) {
  const article = document.createElement("article");
  article.className = `message ${type === "user" ? "user-message" : "assistant-message"}`;

  const strong = document.createElement("strong");
  strong.textContent = title;

  const body = document.createElement("p");
  body.innerHTML = text;

  article.append(strong, body);
  chatLog.append(article);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function localAnswer(question) {
  const lowerQuestion = question.toLowerCase();
  const role = roleInput.value;
  const region = regionInput.value.trim() || "your region";
  const match = knowledgeBase.find((entry) => entry.keywords.some((keyword) => lowerQuestion.includes(keyword))) || knowledgeBase[0];
  const points = match.points.map((point) => `<li>${point}</li>`).join("");

  return `
    For a <strong>${escapeHtml(role)}</strong> in <strong>${escapeHtml(region)}</strong>, focus on <strong>${match.title}</strong> first.
    <ul>${points}</ul>
    <p>Because election rules vary by location, verify final dates and document lists with the official election authority.</p>
  `;
}

async function geminiAnswer(question) {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    return null;
  }

  const role = roleInput.value;
  const region = regionInput.value.trim() || "the user's region";
  const prompt = [
    "You are Ballot Buddy, a neutral election process education assistant.",
    "Do not support any party or candidate. Do not invent official deadlines.",
    "Explain steps clearly, ask users to verify final facts with official election authorities, and keep the answer concise.",
    `User context: ${role} in ${region}.`,
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
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Gemini request failed");
  }

  const data = await response.json();
  return escapeHtml(data.candidates?.[0]?.content?.parts?.[0]?.text || "").replace(/\n/g, "<br>");
}

async function handleQuestion(question) {
  addMessage("user", "You", escapeHtml(question));
  questionInput.value = "";
  addMessage("assistant", "Ballot Buddy", "Thinking...");

  const pending = chatLog.lastElementChild;
  try {
    const answer = await geminiAnswer(question);
    pending.querySelector("p").innerHTML = answer || localAnswer(question);
  } catch (error) {
    pending.querySelector("p").innerHTML = `${localAnswer(question)}<p class="helper">Gemini was unavailable, so I used the built-in guide.</p>`;
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (question) {
    handleQuestion(question);
  }
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    handleQuestion(button.dataset.prompt);
  });
});

saveKeyButton.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem("ballotBuddyGeminiKey", key);
    saveKeyButton.textContent = "Saved";
  } else {
    localStorage.removeItem("ballotBuddyGeminiKey");
    saveKeyButton.textContent = "Cleared";
  }
  setTimeout(() => {
    saveKeyButton.textContent = "Save Key";
  }, 1200);
});

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function calendarLink(title, date) {
  const start = date.toISOString().slice(0, 10).replaceAll("-", "");
  const text = encodeURIComponent(title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${start}`;
}

plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const electionName = document.querySelector("#electionName").value.trim() || "Election";
  const electionDateValue = document.querySelector("#electionDate").value;
  const deadlineDateValue = document.querySelector("#deadlineDate").value;

  if (!electionDateValue || !deadlineDateValue) {
    timelineOutput.innerHTML = '<p class="empty-state">Please add both the election date and registration deadline.</p>';
    return;
  }

  const electionDate = new Date(`${electionDateValue}T12:00:00`);
  const deadlineDate = new Date(`${deadlineDateValue}T12:00:00`);
  const tasks = [
    {
      date: addDays(deadlineDate, -14),
      title: "Collect documents",
      detail: "Prepare identity, age, and residence documents before the registration deadline."
    },
    {
      date: deadlineDate,
      title: "Registration deadline",
      detail: "Submit or verify voter registration through the official election authority."
    },
    {
      date: addDays(electionDate, -7),
      title: "Confirm polling details",
      detail: "Check your name on the voter list and verify the polling station address."
    },
    {
      date: electionDate,
      title: `${electionName} voting day`,
      detail: "Carry accepted ID, follow polling station rules, and cast your vote."
    }
  ];

  const items = tasks
    .sort((a, b) => a.date - b.date)
    .map((task) => `
      <li>
        <time datetime="${task.date.toISOString()}">${formatDate(task.date)}</time>
        <p><strong>${escapeHtml(task.title)}</strong><br>${escapeHtml(task.detail)}</p>
        <a class="calendar-link" href="${calendarLink(task.title, task.date)}" target="_blank" rel="noreferrer">Add to Google Calendar</a>
      </li>
    `)
    .join("");

  timelineOutput.innerHTML = `<ol class="timeline-list">${items}</ol>`;
});

document.querySelectorAll("[data-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    const correct = button.dataset.answer === "correct";
    quizResult.textContent = correct
      ? "Correct. Official election authorities are the safest source for deadlines."
      : "Try again. Election deadlines should be checked with official election authorities.";
    quizResult.style.color = correct ? "var(--green)" : "var(--red)";
  });
});
