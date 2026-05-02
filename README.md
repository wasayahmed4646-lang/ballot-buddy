# Ballot Buddy

Ballot Buddy is an election process education assistant built for PromptWars Virtual. It helps users understand eligibility, registration, election timelines, polling day preparation, vote counting, and result verification in a neutral and easy-to-follow way.

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

- Optional Gemini API integration through a user-provided API key for richer assistant responses.
- Google Calendar reminder links for election preparation tasks.
- The app is ready to be developed in Google Antigravity and hosted as a lightweight static project.

If no Gemini API key is provided, the app still works through a built-in rule-based education guide.

## How the Solution Works

Open `index.html` in a browser. No build step is required.

Main features:

- Interactive question-and-answer assistant
- Context controls for voter type and region
- Quick prompts for common election topics
- Personalized election checklist
- Google Calendar links for reminders
- Learning cards for key election concepts
- Simple quiz for safe information habits

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
- `app.js` - assistant, planner, Gemini integration, and quiz behavior
