# VoteSetu India

VoteSetu India is an election process education assistant built for PromptWars Virtual. It helps users understand eligibility, registration, election timelines, polling day preparation, vote counting, and result verification in a neutral and easy-to-follow way.

## Chosen Vertical

Election Process Education

## Approach and Logic

The app uses a user-context-first flow:

- The user selects their voter situation, such as first-time voter, student voter, or voter who moved recently.
- The user enters a country or state so answers can be framed around their region.
- The assistant maps common election questions to structured guidance.
- The planner converts election dates and registration deadlines into a checklist.
- The app reminds users to verify all official rules, dates, polling locations, and document requirements with the relevant election authority.

The assistant is intentionally non-partisan. It explains processes, not political choices.

## Google Services Used

- Optional Google Gemini API integration through `GEMINI_API_KEY` for richer assistant responses.
- Google Calendar reminder links for election preparation tasks.
- Google Maps links for nearby election-office discovery.
- Optional Google Custom Search integration through `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_CX` for official-source discovery.
- Google/Vercel-ready serverless API endpoints for lightweight deployment.
- The app is ready to be developed in Google Antigravity and hosted as a lightweight full-stack project.

If no Gemini API key is provided, the app still works through a built-in rule-based education guide.

## How the Solution Works

Run the local backend:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

Main features:

- Interactive question-and-answer assistant
- Context controls for voter type and region
- Civic readiness score with personalized next actions
- Quick prompts for common election topics
- Personalized election checklist
- Google Calendar links for reminders
- Official verification links for ECI resources
- Learning cards for key election concepts
- Simple quiz for safe information habits
- Backend API at `/api/assistant`
- Health endpoint at `/api/health`
- Google resource endpoint at `/api/resources`

## Testing

Run syntax checks:

```bash
npm run check
```

Run automated tests:

```bash
npm test
```

The test suite validates assistant topic matching, official-source caution, readiness scoring, edge cases, and invalid input handling.

The repository also includes [TESTING.md](./TESTING.md) and a GitHub Actions workflow at `.github/workflows/test.yml`.

## Environment Variables

The backend works without secrets by using a built-in guide. To enable Gemini responses, set:

```text
GEMINI_API_KEY=your_key_here
```

To enable Google Custom Search for official-source discovery, set:

```text
GOOGLE_SEARCH_API_KEY=your_key_here
GOOGLE_SEARCH_CX=your_search_engine_id
```

On Vercel, add these in the project environment variables. The app still works without them using curated official links plus Google Search and Google Maps links.

## Assumptions

- Election laws and dates vary by country, state, and local authority.
- The app should not invent official dates or legal requirements.
- Users should always verify final information with official election authorities.
- A static app is preferred so the repository remains small and easy to evaluate.

## Competition Notes

This project is designed to stay within PromptWars repository constraints:

- No external dependencies
- No build output
- Small static file size
- Public-repository friendly structure
- Single-branch friendly workflow

## Files

- `index.html` - app structure
- `styles.css` - responsive styling
- `app.js` - frontend assistant, planner, and quiz behavior
- `server.js` - local Node backend and static server
- `api/assistant.js` - Vercel serverless assistant endpoint
- `api/resources.js` - Google Custom Search and curated official-resource endpoint
- `src/assistantCore.js` - shared assistant logic
- `src/readinessCore.js` - shared readiness scoring logic
- `test.js` - automated test suite
- `TESTING.md` - testing strategy
