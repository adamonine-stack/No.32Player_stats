(() => {
  const ROOT_SELECTOR = '#shotCourtRoot';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const COURT_WIDTH = 100;
  const COURT_HEIGHT = 108;
  const HALF_COURT_HEIGHT = 93.333;
  const STEP = 2;

  const FIBA = Object.freeze({
    basketX: 50,
    basketY: 10.5,
    paintLeft: 33.667,
    paintRight: 66.333,
    freeThrowY: 38.667,
    threeRadius: 45,
    cornerLeft: 6,
    cornerRight: 94,
    cornerJoinY: 19.934,
    noChargeRadius: 8.667
  });

  const style = document.createElement('style');
  style.textContent = `
    ${ROOT_SELECTOR} .shot-registration-area-highlight {
      fill: rgba(249, 115, 22, .30);
      stroke: none;
      pointer-events: none;
    }
    ${ROOT_SELECTOR} .shot-registration-area-highlight-outline {
      fill: none;
      stroke: rgba(251, 146, 60, .95);
      stroke-width: .75;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  function detectShotArea(xValue, yValue) {
    const x = Number(xValue);
    const y = Number(yValue);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > COURT_WIDTH || y < 0 || y > COURT_HEIGHT) return null;
    if (y > HALF_COURT_HEIGHT) return 'backcourt_3p';

    const { basketX, basketY, paintLeft, paintRight, freeThrowY, threeRadius, cornerLeft, cornerRight, cornerJoinY, noChargeRadius } = FIBA;
    if (y <= cornerJoinY && x < cornerLeft) return 'left_corner_3p';
    if (y <= cornerJoinY && x > cornerRight) return 'right_corner_3p';

    const isTwoPoint = x >= cornerLeft && x <= cornerRight && Math.hypot(x - basketX, y - basketY) <= threeRadius;
    if (!isTwoPoint) {
      if (x < paintLeft) return 'left_45_3p';
      if (x > 100 - paintLeft) return 'right_45_3p';
      return 'center_3p';
    }

    const normalizedX = (x - basketX) / noChargeRadius;
    const underCurveY = basketY + noChargeRadius * Math.sqrt(Math.max(0, 1 - normalizedX ** 2));
    if (Math.abs(normalizedX) <= 1.000001 && y <= underCurveY + 0.000001) return 'under_basket';
    if (x >= paintLeft && x <= paintRight && y <= freeThrowY) return 'inside';
    if (y <= 24) return x < paintLeft ? 'left_zero_mid' : x > paintRight ? 'right_zero_mid' : 'inside';
    if (x < paintLeft) return 'left_mid';
    if (x > paintRight) return 'right_mid';
    return 'center_mid';
  }

  function areaPath(areaId) {
    let d = '';
    for (let y = 0; y < COURT_HEIGHT; y += STEP) {
      for (let x = 0; x < COURT_WIDTH; x += STEP) {
        if (detectShotArea(x + STEP / 2, y + STEP / 2) !== areaId) continue;
        const width = Math.min(STEP, COURT_WIDTH - x);
        const height = Math.min(STEP, COURT_HEIGHT - y);
        d += `M${x} ${y}h${width}v${height}h-${width}z`;
      }
    }
    return d;
  }

  function selectedMarker(svg) {
    return svg.querySelector('.shot-marker.selected');
  }

  function applyHighlight() {
    const root = document.querySelector(ROOT_SELECTOR);
    const svg = root?.querySelector('.shot-court');
    if (!svg) return;

    const marker = selectedMarker(svg);
    const areaId = marker ? detectShotArea(marker.getAttribute('cx'), marker.getAttribute('cy')) : null;
    const existing = svg.querySelector('.shot-registration-area-highlight');

    if (!areaId) {
      existing?.remove();
      return;
    }
    if (existing?.dataset.area === areaId) return;
    existing?.remove();

    const pathData = areaPath(areaId);
    if (!pathData) return;

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'shot-registration-area-highlight');
    path.setAttribute('d', pathData);
    path.dataset.area = areaId;
    path.setAttribute('aria-hidden', 'true');

    const courtZones = svg.querySelector('.court-zones');
    if (courtZones) svg.insertBefore(path, courtZones);
    else svg.appendChild(path);
  }

  let scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyHighlight();
    });
  }

  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scheduleApply);
  document.addEventListener('click', event => {
    if (event.target.closest?.(`${ROOT_SELECTOR} .shot-court`)) scheduleApply();
  }, true);
  document.addEventListener('pointermove', event => {
    if (event.target.closest?.(`${ROOT_SELECTOR} .shot-court`)) scheduleApply();
  }, { capture: true, passive: true });
})();
