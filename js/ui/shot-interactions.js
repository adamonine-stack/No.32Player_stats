(() => {
  const CONFIG = Object.freeze({
    longPressMs: 240,
    moveStartPx: 10,
    magnifierSizePx: 144,
    magnifierViewWidth: 27,
    magnifierViewHeight: 27,
    magnifierGapPx: 28,
    viewportMarginPx: 12
  });

  let drag = null;
  let suppressNativeClick = false;
  let allowSyntheticClick = false;

  const style = document.createElement('style');
  style.textContent = `
    #shotCourtRoot,
    #shotCourtRoot .shot-court,
    #shotCourtRoot .shot-court * {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    #shotCourtRoot .shot-court {
      touch-action: none !important;
      overscroll-behavior: contain;
    }
    #shotCourtRoot .shot-court .shot-marker.selected { cursor: grab; }
    #shotCourtRoot .shot-court.shot-point-dragging { cursor: grabbing; }
    .shot-position-magnifier {
      position: fixed;
      z-index: 100000;
      width: ${CONFIG.magnifierSizePx}px;
      height: ${CONFIG.magnifierSizePx}px;
      border: 3px solid rgba(255,255,255,.96);
      border-radius: 50%;
      background: #071126;
      box-shadow: 0 8px 24px rgba(0,0,0,.48), 0 0 0 2px rgba(255,153,0,.9);
      overflow: hidden;
      pointer-events: none;
      opacity: 0;
      transform: scale(.92);
      transition: opacity .1s ease, transform .1s ease;
      -webkit-user-select: none;
      user-select: none;
    }
    .shot-position-magnifier.visible { opacity: 1; transform: scale(1); }
    .shot-position-magnifier svg { width: 100%; height: 100%; display: block; }
    .shot-position-magnifier .court-tap-surface { display: none; }
    .shot-position-magnifier-crosshair::before,
    .shot-position-magnifier-crosshair::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      background: rgba(255,255,255,.96);
      transform: translate(-50%,-50%);
      box-shadow: 0 0 2px rgba(0,0,0,.8);
    }
    .shot-position-magnifier-crosshair::before { width: 28px; height: 1px; }
    .shot-position-magnifier-crosshair::after { width: 1px; height: 28px; }
    .shot-position-magnifier-dot {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid #fff;
      background: #ff9800;
      transform: translate(-50%,-50%);
      box-shadow: 0 0 0 2px rgba(0,0,0,.35);
    }
  `;
  document.head.appendChild(style);

  function showSavedToast() {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = '保存しました';
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function replaceUndoWithSavedMessage(root = document) {
    root.querySelectorAll?.('.shot-undo').forEach(element => {
      element.remove();
      showSavedToast();
    });
  }

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('.shot-undo')) {
          node.remove();
          showSavedToast();
        } else {
          replaceUndoWithSavedMessage(node);
        }
      }
    }
  });

  function clientToSvg(svg, clientX, clientY) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }

  function markerElementsAt(svg, marker) {
    const x = marker.getAttribute('cx');
    const y = marker.getAttribute('cy');
    return [...svg.querySelectorAll('.shot-selection-ring, .shot-foul-ring, .shot-marker')]
      .filter(element => element.getAttribute('cx') === x && element.getAttribute('cy') === y);
  }

  function createMagnifier(svg) {
    const root = document.createElement('div');
    root.className = 'shot-position-magnifier shot-position-magnifier-crosshair';
    const clone = svg.cloneNode(true);
    clone.removeAttribute('class');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('.court-tap-surface').forEach(element => element.remove());
    root.appendChild(clone);
    const dot = document.createElement('div');
    dot.className = 'shot-position-magnifier-dot';
    root.appendChild(dot);
    document.body.appendChild(root);
    return { root, svg: clone };
  }

  function positionMagnifier(magnifier, clientX, clientY) {
    const size = CONFIG.magnifierSizePx;
    const margin = CONFIG.viewportMarginPx;
    let left = clientX - size / 2;
    let top = clientY - size - CONFIG.magnifierGapPx;
    if (top < margin) top = clientY + CONFIG.magnifierGapPx;
    left = Math.max(margin, Math.min(window.innerWidth - size - margin, left));
    top = Math.max(margin, Math.min(window.innerHeight - size - margin, top));
    magnifier.root.style.left = `${left}px`;
    magnifier.root.style.top = `${top}px`;
  }

  function updateMagnifier(point, clientX, clientY) {
    if (!drag?.magnifier || !point) return;
    const sourceView = drag.svg.viewBox.baseVal;
    const width = Math.min(CONFIG.magnifierViewWidth, sourceView.width);
    const height = Math.min(CONFIG.magnifierViewHeight, sourceView.height);
    const minX = Math.max(sourceView.x, Math.min(sourceView.x + sourceView.width - width, point.x - width / 2));
    const minY = Math.max(sourceView.y, Math.min(sourceView.y + sourceView.height - height, point.y - height / 2));
    drag.magnifier.svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    positionMagnifier(drag.magnifier, clientX, clientY);
  }

  function dispatchCourtClick(svg, clientX, clientY) {
    allowSyntheticClick = true;
    svg.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY
    }));
    allowSyntheticClick = false;
  }

  function bindCurrentMarker() {
    if (!drag) return false;
    const svg = document.querySelector('#shotCourtRoot .shot-court');
    const marker = svg?.querySelector('.shot-marker.selected');
    if (!svg || !marker) return false;
    drag.svg = svg;
    drag.elements = markerElementsAt(svg, marker);
    return drag.elements.length > 0;
  }

  function finishActivation() {
    if (!drag || drag.active) return;
    if (!bindCurrentMarker()) {
      requestAnimationFrame(() => {
        if (!drag || drag.active || !bindCurrentMarker()) return;
        finishActivation();
      });
      return;
    }
    drag.active = true;
    drag.svg.classList.add('shot-point-dragging');
    drag.magnifier = createMagnifier(drag.svg);
    updatePreview(drag.lastClientX, drag.lastClientY);
    requestAnimationFrame(() => drag?.magnifier?.root.classList.add('visible'));
    navigator.vibrate?.(12);
  }

  function activateDrag() {
    if (!drag || drag.active || drag.activating) return;
    window.clearTimeout(drag.holdTimer);
    drag.activating = true;

    const selectedMarker = drag.svg.querySelector('.shot-marker.selected');
    if (!selectedMarker) {
      dispatchCourtClick(drag.svg, drag.lastClientX, drag.lastClientY);
      requestAnimationFrame(() => {
        if (!drag) return;
        drag.activating = false;
        finishActivation();
      });
      return;
    }

    drag.activating = false;
    finishActivation();
  }

  function updatePreview(clientX, clientY) {
    if (!drag?.active || !drag.svg?.isConnected) {
      if (!bindCurrentMarker() || !drag?.active) return;
    }
    const point = clientToSvg(drag.svg, clientX, clientY);
    if (!point) return;
    const viewBox = drag.svg.viewBox.baseVal;
    const x = Math.max(viewBox.x, Math.min(viewBox.x + viewBox.width, point.x));
    const y = Math.max(viewBox.y, Math.min(viewBox.y + viewBox.height, point.y));
    for (const element of drag.elements) {
      element.setAttribute('cx', x.toFixed(3));
      element.setAttribute('cy', y.toFixed(3));
    }
    drag.lastClientX = clientX;
    drag.lastClientY = clientY;
    updateMagnifier({ x, y }, clientX, clientY);
  }

  function removeMagnifier(current) {
    if (!current.magnifier) return;
    current.magnifier.root.classList.remove('visible');
    const node = current.magnifier.root;
    window.setTimeout(() => node.remove(), 120);
    current.magnifier = null;
  }

  function clearDragVisual(current) {
    window.clearTimeout(current.holdTimer);
    current.svg?.classList.remove('shot-point-dragging');
    removeMagnifier(current);
    try { document.body.releasePointerCapture?.(current.pointerId); } catch (_) {}
  }

  document.addEventListener('contextmenu', event => {
    if (!event.target.closest?.('#shotCourtRoot')) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener('selectstart', event => {
    if (!event.target.closest?.('#shotCourtRoot')) return;
    event.preventDefault();
  }, true);

  document.addEventListener('dragstart', event => {
    if (!event.target.closest?.('#shotCourtRoot')) return;
    event.preventDefault();
  }, true);

  document.addEventListener('pointerdown', event => {
    const svg = event.target.closest?.('#shotCourtRoot .shot-court');
    if (!svg) return;

    event.preventDefault();
    event.stopPropagation();
    try { document.body.setPointerCapture?.(event.pointerId); } catch (_) {}

    drag = {
      svg,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      active: false,
      activating: false,
      elements: [],
      holdTimer: null,
      magnifier: null
    };

    if (event.pointerType === 'mouse') activateDrag();
    else drag.holdTimer = window.setTimeout(activateDrag, CONFIG.longPressMs);
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();

    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;

    if (!drag.active && !drag.activating) {
      const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (distance >= CONFIG.moveStartPx) activateDrag();
    }
    if (drag.active) updatePreview(event.clientX, event.clientY);
  }, { capture: true, passive: false });

  function finishDrag(event, cancelled = false) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    drag = null;
    clearDragVisual(current);

    event.preventDefault();
    event.stopPropagation();
    suppressNativeClick = true;

    if (current.active || current.activating) {
      const svg = document.querySelector('#shotCourtRoot .shot-court') || current.svg;
      if (svg) dispatchCourtClick(svg, current.lastClientX, current.lastClientY);
      navigator.vibrate?.(18);
    } else if (!cancelled) {
      dispatchCourtClick(current.svg, event.clientX, event.clientY);
    }

    window.setTimeout(() => { suppressNativeClick = false; }, 0);
  }

  document.addEventListener('pointerup', event => finishDrag(event, false), { capture: true, passive: false });
  document.addEventListener('pointercancel', event => finishDrag(event, true), { capture: true, passive: false });

  document.addEventListener('click', event => {
    if (allowSyntheticClick) return;
    if (!event.target.closest?.('#shotCourtRoot .shot-court')) return;
    if (!suppressNativeClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    replaceUndoWithSavedMessage();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
