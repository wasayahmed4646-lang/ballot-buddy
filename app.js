const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const questionInput = document.querySelector("#question");
const roleInput = document.querySelector("#role");
const regionInput = document.querySelector("#region");
const plannerForm = document.querySelector("#plannerForm");
const timelineOutput = document.querySelector("#timelineOutput");
const quizResult = document.querySelector("#quizResult");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const statusDetail = document.querySelector("#statusDetail");
const readinessForm = document.querySelector("#readinessForm");
const readinessOutput = document.querySelector("#readinessOutput");

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

function formatAssistantAnswer(answer) {
  const steps = Array.isArray(answer.steps) ? answer.steps : [];
  const list = steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const badge = answer.source === "gemini" ? "Gemini powered" : "Backend guide";
  const note = answer.note ? `<p class="helper">${escapeHtml(answer.note)}</p>` : "";

  return `
    <span class="answer-badge">${badge}</span>
    <p>${escapeHtml(answer.summary || "Here is a neutral election process guide.")}</p>
    ${list ? `<ul>${list}</ul>` : ""}
    <p><strong>Next step:</strong> ${escapeHtml(answer.nextStep || "Verify the next step with the official election authority.")}</p>
    <p class="caution">${escapeHtml(answer.caution || "Always verify final election information with official sources.")}</p>
    ${note}
  `;
}

async function backendAnswer(question) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      role: roleInput.value,
      region: regionInput.value.trim()
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Assistant request failed");
  }

  return response.json();
}

async function handleQuestion(question) {
  addMessage("user", "You", escapeHtml(question));
  questionInput.value = "";
  addMessage("assistant", "VoteSetu India", "Thinking...");

  const pending = chatLog.lastElementChild;
  try {
    const answer = await backendAnswer(question);
    pending.querySelector("p").outerHTML = `<div>${formatAssistantAnswer(answer)}</div>`;
  } catch (error) {
    pending.querySelector("p").innerHTML = `${escapeHtml(error.message)}. Start the local server with <strong>npm start</strong> or deploy the app to Vercel so the backend API is available.`;
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

readinessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const age = Number(document.querySelector("#age").value);
  const registered = document.querySelector("#registered").value;
  const hasId = document.querySelector("#hasId").value;
  const boothKnown = document.querySelector("#boothKnown").value;

  try {
    const result = VoteSetuReadiness.calculateReadiness({ age, registered, hasId, boothKnown });
    const actionItems = result.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");

    readinessOutput.innerHTML = `
      <div class="score-card">
        <span>${result.score}</span>
        <div>
          <strong>${result.level}</strong>
          <p>Readiness score based on eligibility, registration, ID, and polling-booth preparation.</p>
        </div>
      </div>
      <ol class="action-list">${actionItems}</ol>
    `;
  } catch (error) {
    readinessOutput.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
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

function mapsLink(region) {
  const query = encodeURIComponent(`election office ${region || "India"}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
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

  const region = regionInput.value.trim() || "India";
  timelineOutput.innerHTML = `
    <ol class="timeline-list">${items}</ol>
    <p class="source-helper">
      Need nearby help? <a href="${mapsLink(region)}" target="_blank" rel="noreferrer">Search election offices on Google Maps</a>.
    </p>
  `;
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

async function checkBackend() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error("Health check failed");
    }

    statusDot.classList.add("online");
    statusText.textContent = "Backend online";
    statusDetail.textContent = data.geminiConfigured
      ? "Gemini is configured on the server."
      : "Using the built-in guide until GEMINI_API_KEY is added.";
  } catch (error) {
    statusDot.classList.add("offline");
    statusText.textContent = "Backend offline";
    statusDetail.textContent = "Run npm start or deploy to Vercel to enable chat.";
  }
}

checkBackend();
