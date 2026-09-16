import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles/opponent-teams.css', import.meta.url), 'utf8');

assert.match(app, /OPPONENT_TEAM_TYPE_FILTERS=\['all','school','club'\]/);
assert.match(app, /function opponentTeamTypeKey\(team=\{\}\)/);
assert.match(app, /return 'unclassified'/);
assert.match(app, /function opponentTeamTypeTabsHtml\(\)/);
assert.match(app, /総合 <span>/);
assert.match(app, /中学校 <span>/);
assert.match(app, /クラブチーム <span>/);
assert.match(app, /window\.setOpponentTeamTypeFilter=type=>/);
assert.match(app, /Team Power総合順位/);
assert.match(app, /Team Power \$\{escapeHtml\(teamTypeLabel\)\}順位/);
assert.match(app, /Team Power \$\{escapeHtml\(standingLabel\)\}順位/);
assert.match(index, /app\.js\?v=20260916-firestore-load-v2/);
assert.match(index, /opponent-teams\.css\?v=20260916-team-type-tabs-v1/);
assert.match(css, /\.opponent-team-type-tabs/);
assert.match(css, /\.opponent-team-type-tab\.active/);

console.log('opponent team type filter contract: ok');
