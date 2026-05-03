# Testing Strategy

VoteSetu India includes a lightweight automated test suite designed for the PromptWars evaluation categories.

## What Is Tested

- Assistant topic matching for polling-station and result-counting questions
- Empty-question validation
- Safe Gemini fallback when the Google Gemini API is unavailable
- Readiness scoring for ready voters, incomplete voters, under-age users, and invalid ages
- Google-service resource link generation
- `/api/resources` curated fallback behavior when Google Custom Search keys are not configured

## Commands

```bash
npm run check
npm test
```

## Continuous Integration

The repository includes `.github/workflows/test.yml`, which runs syntax checks and unit tests on every push to `main` and every pull request.

## Why This Matters

The first evaluation showed testing as a weak area. These tests cover the highest-risk decision logic and API fallback paths without adding dependencies or increasing repository size significantly.
