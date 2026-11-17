# R32 project instructions

## Project identity

- Application: R32 Player Stats / chatGPT_R32.
- Canonical repository: https://github.com/adamonine-stack/No.32Player_stats
- Default branch: main.
- Existing production hosting: GitHub Pages. Successful `pages build and deployment` runs were verified on 2026-11-17.
- Use this existing repository and hosting for future ChatGPT Work tasks. Do not create a replacement site or migrate hosting unless the user requests it.

## User decisions

- Retain past agreed requirements and apply them to later changes.
- Preserve the existing application design, data, and behavior outside the requested scope.
- The user has authorized completing requested application changes through testing and production publication without asking again for routine publication confirmation. Platform permissions still apply.
- On 2026-11-17 the user stated the tournament registration change had already been published in Chat. Do not reimplement that change based only on an older request; inspect the latest main first.

## Work workflow

1. Open this repository and inspect the latest main and any existing changes before editing. An empty Work workspace is not evidence that the GitHub repository is unavailable.
2. Use the connected GitHub integration to read repository metadata and files and to verify access. If local Git is unavailable, supported GitHub file and commit tools can be used. Do not ask the user to resend the repository URL when this identity is available.
3. Read applicable nested instructions and relevant source and tests before making focused changes. Preserve concurrent user changes.
4. Run checks appropriate to the change. The repository's full test command is `npm test` after installing locked dependencies where needed. For tournament/game registration, the existing CI uses `node --check js/app.js` and `node --test tests/game-registration.test.mjs tests/tournament-registration.test.mjs`. Do not assume an old test failure count remains current.
5. Publish requested application changes using the repository's existing main/GitHub Pages process. Inspect current deployment configuration and recent successful runs rather than inventing a new workflow. The tournament registration checks workflow is validation, not the Pages deployment workflow.
6. Verify the Pages deployment for the exact changed commit succeeds; a successful source commit alone does not verify publication. Report the production URL from verified repository/deployment information, along with any material verification limit.
7. If permissions or available tools block an operation, explain the specific failed operation and continue safe, useful work. Do not claim a connection, publication, persistent Work UI setting, or permission change that was not actually performed.

## Data handling

- App source publication and live Firestore data updates are separate operations. Repository access does not establish Firestore access.
- Keep credentials and personal data out of this public repository.
