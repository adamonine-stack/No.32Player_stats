import { SHOT_COURT_SIZE, SHOT_TYPES, SHOT_AREAS, shotAreaForRecord } from '../calculations/shot-calculations.js?v=20260822-foul-stats-v2';

const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function hasShotPoint(shot) {
    return shot.shotX != null && shot.shotY != null && shot.shotX !== '' && shot.shotY !== ''
      && Number.isFinite(Number(shot.shotX)) && Number.isFinite(Number(shot.shotY))
      && Number(shot.shotX) >= 0 && Number(shot.shotX) <= SHOT_COURT_SIZE.width
      && Number(shot.shotY) >= 0 && Number(shot.shotY) <= SHOT_COURT_SIZE.height;
  }

export function shotDescription(shot, players = []) {
    const player = players.find(player => player.id === shot.playerId);
    const name = player ? `${player.number != null && player.number !== '' ? `#${player.number} ` : ''}${player.name || '選手名未登録'}` : '選手未登録';
    const playerLabel = `${name} ${shot.quarter ? `${shot.quarter}Q` : 'Q不明'}`;
    const type = SHOT_TYPES[shot.shotType] || shot.shotTypeLabel || '種類未登録';
    const result = shot.result === 'made' ? '成功' : '失敗';
    const area = SHOT_AREAS[shotAreaForRecord(shot)]?.label || shot.shotAreaLabel || 'エリア未登録';
    return {playerLabel, area, type, result};
  }

export function courtShotListHtml(shots, players, selectedKey = '', attribute = 'data-team-shot') {
  return shots.map(shot => {
    const info = shotDescription(shot, players);
    return `<button type="button" class="team-analysis-shot-entry" ${attribute}="${shot.teamAnalysisKey}" aria-pressed="${shot.teamAnalysisKey === selectedKey}"><span>${escapeText(info.playerLabel)}</span><span>${escapeText(info.area)}</span><span>${escapeText(info.type)}${!hasShotPoint(shot) ? '<small>位置未登録</small>' : ''}</span><span class="${shot.result === 'made' ? 'made' : 'missed'}">${info.result}${shot.wasFouled ? '<small>被ファウル</small>' : ''}</span></button>`;
  }).join('') || '<p class="sub">該当するシュートはありません</p>';
}

export function shotHighlightSvg(shot) {
  if (!shot || !hasShotPoint(shot)) return '';
  const x = Number(shot.shotX), y = Number(shot.shotY), result = shot.result === 'made' ? 'made' : 'missed';
  return `<g class="team-shot-selected" aria-label="選択したシュート位置"><circle class="team-shot-selected-halo" cx="${x}" cy="${y}" r="4.2"/><path class="team-shot-selected-cross" d="M${x-6} ${y}h2M${x+4} ${y}h2M${x} ${y-6}v2M${x} ${y+4}v2"/><circle class="shot-marker ${result} team-shot-selected-core" cx="${x}" cy="${y}" r="2.2"/></g>`;
}
