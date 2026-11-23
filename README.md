# Skwela Ta

## Run the application

1. Run `npm install`.
2. Run `npm run dev`.
3. Open the local URL printed by Vite.

The app runs entirely in the browser; it does not need SQL Server or a backend.
Accounts and tasks are stored in this browser’s local storage. Account passwords
are stored as salted PBKDF2 hashes. Clearing browser data removes local accounts
and tasks. This local-only authentication is suitable for a demo, not production.
