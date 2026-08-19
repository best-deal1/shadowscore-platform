# ShadowScore Intelligence Engine v2 - email discovery slice

This slice treats an email address as the investigation identifier rather than blindly treating its mailbox domain as the subject business.

For public mailbox providers, first-party crawling of the provider domain is suppressed. Public identity discovery uses the configured Brave Search API and returns evidence-backed public profile candidates with explicit match levels and provenance.

For corporate email addresses, first-party business discovery remains available while the external identity provider searches the submitted email and related public profile candidates.

Candidates are not promoted to verified people or organizations solely from username similarity. Missing provider credentials are surfaced as provider unavailability and do not fabricate evidence.
