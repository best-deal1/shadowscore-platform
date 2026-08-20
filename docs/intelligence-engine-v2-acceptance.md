# Email intelligence production acceptance

Use new investigations after deployment.

## Free mailbox

Input: `nastikmastik358@gmail.com`

Expected behavior:
- target remains an email identifier;
- `gmail.com` is not crawled as the subject business;
- external identity discovery runs when `BRAVE_SEARCH_API_KEY` is configured;
- public profile candidates retain source URLs, match basis, and confidence;
- username similarity alone remains unverified;
- missing search credentials produce provider unavailability, not fabricated identity evidence.

## Corporate mailbox

Input: `moshez@s-horowitz.com`

Expected behavior:
- target remains the submitted email;
- first-party company discovery may inspect `s-horowitz.com`;
- external identity discovery runs in parallel;
- people, roles, organizations, phones, and relationships require evidence.
