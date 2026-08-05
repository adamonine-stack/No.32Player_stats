(() => {
  const LONG_PRESS_MS = 300;
  const MOVE_CANCEL_PX = 8;
  const MARKER_HIT_RADIUS_SVG = 6;
  let drag = null;
  let suppressNativeClick = false;
  let allowSyntheticClick = false;

  const style = document.createElement('style');
  style.textContent = `
    #shotCourtRoot,
    #shotCourtRoot .shot-court,
    #shotCourtRoot .shot-court * {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    #shotCourtRoot .shot-court {
      touch-action: manipulation;
    }
    #shotCourtRoot .shot-court.shot-point-ready,
    #shotCourtRoot .shot-court.shot-point-dragging {
      touch-action: none;
    }
    #shotCourtRoot .shot-court.shot-point-ready .shot-marker.selected,
    #shotCourtRoot .shot-court.shot-point-dragging .shot-marker.selected {
      transform-box: fill-box;
      transform-origin: center;
      transform: scale(1.35);
      filter: drop-shadow(0 0 1.8px rgba(255,255,255,.95));
    }
    #shotCourtRoot .shot-court.shot-point-dragging { cursor: grabbing; }
    #shotCourtRoot .shot-court .shot-marker.selected { cursor: grab; }
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
          continue;
        }
        replaceUndoWithSavedMessage(node);
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

  function selectedMarker(svg) {
    return svg.querySelector('.shot-marker.selected');
  }

  function markerElementsAt(svg, marker) {
    const x = marker.getAttribute('cx');
    const y = marker.getAttribute('cy');
    return [...svg.querySelectorAll('.shot-selection-ring, .shot-foul-ring, .shot-marker')]
      .filter(element => element.getAttribute('cx') === x && element.getAttribute('cy') === y);
  }

  function isNearMarker(svg, marker, clientX, clientY) {
    const point = clientToSvg(svg, clientX, clientY);
    if (!point) return false;
    return Math.hypot(point.x - Number(marker.getAttribute('cx')), point.y - Number(marker.getAttribute('cy'))) <= MARKER_HIT_RADIUS_SVG;
  }

  function activateDrag() {
    if (!drag || drag.active) return;
    drag.active = true;
    drag.svg.classList.remove('shot-point-ready');
    drag.svg.classList.add('shot-point-dragging');
    navigator.vibrate?.(12);
  }

  function updatePreview(clientX, clientY) {
    if (!drag?.active) return;
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
  }

  function clearDragVisual(current) {
    window.clearTimeout(current.holdTimer);
    current.svg.releasePointerCapture?.(current.pointerId);
    current.svg.classList.remove('shot-point-ready', 'shot-point-dragging');
  }

  document.addEventListener('contextmenu', event => {
    const svg = event.target.closest?.('#shotCourtRoot .shot-court');
    if (!svg) return;
    const marker = selectedMarker(svg);
    if (!marker || !isNearMarker(svg, marker, event.clientX, event.clientY)) return;
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
    const svg = event.target.closest?.('.shot-court');
    if (!svg || !svg.closest('#shotCourtRoot')) return;
    const marker = selectedMarker(svg);
    if (!marker || !isNearMarker(svg, marker, event.clientX, event.clientY)) return;

    event.preventDefault();
    event.stopPropagation();
    svg.classList.add('shot-point-ready');
    svg.setPointerCapture?.(event.pointerId);

    drag = {
      svg,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      active: false,
      elements: markerElementsAt(svg, marker),
      holdTimer: null
    };

    if (event.pointerType === 'mouse') {
      activateDrag();
    } else {
      drag.holdTimer = window.setTimeout(activateDrag, LONG_PRESS_MS);
    }
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
    if (!drag.active) {
      event.preventDefault();
      event.stopPropagation();
      if (distance > MOVE_CANCEL_PX) {
        clearDragVisual(drag);
        drag = null;
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    updatePreview(event.clientX, event.clientY);
  }, { capture: true, passive: false });

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    drag = null;
    clearDragVisual(current);
    if (!current.active) return;

    event.preventDefault();
    event.stopPropagation();
    suppressNativeClick = true;
    allowSyntheticClick = true;
    current.svg.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: current.lastClientX,
      clientY: current.lastClientY
    }));
    allowSyntheticClick = false;
    navigator.vibrate?.(18);
    window.setTimeout(() => { suppressNativeClick = false; }, 0);
  }

  document.addEventListener('pointerup', finishDrag, { capture: true, passive: false });
  document.addEventListener('pointercancel', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    clearDragVisual(drag);
    drag = null;
  }, true);

  document.addEventListener('click', event => {
    if (!suppressNativeClick || allowSyntheticClick) return;
    if (!event.target.closest?.('.shot-court')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    replaceUndoWithSavedMessage();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
