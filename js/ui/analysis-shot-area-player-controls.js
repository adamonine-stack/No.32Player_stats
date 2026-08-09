import { state } from '../core/state.js';
import { setLastPlayerId } from '../core/storage.js';
import { detectShotArea, SHOT_COURT_SIZE, SHOT_AREAS } from '../calculations/shot-calculations.js?v=20260804-shot-types-v19';

(() => {
  const MODAL_SELECTOR = '#modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal)';
  const selectedAreas = new Set();
  let suppressClickUntil = 0