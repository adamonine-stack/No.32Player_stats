(() => {
  const DRAG_THRESHOLD_PX = 5;
  const MARKER_HIT_RADIUS_SVG = 5;
  let drag = null;
  let suppressNativeClick = false;
  let allowSyntheticClick = false;

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
    if (!matrix) return null;
    return point.matrixTransform(matrix.inverse());
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
    const x = Number(marker.getAttribute('cx'));
    const y = Number(marker.getAttribute('cy'));
    return Math.hypot(point.x - x, point.y - y) <= MARKER_HIT_RADIUS_SVG;
  }

  function updatePreview(clientX, clientY) {
    if (!drag) return;
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

  document.addEventListener('pointerdown', event => {
    const svg = event.target.closest?.('.shot-court');
    if (!svg || !svg.closest('#shotCourtRoot')) return;
    const marker = selectedMarker(svg);
    if (!marker || !isNearMarker(svg, marker, event.clientX, event.clientY)) return;

    drag = {
      svg,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      moved: false,
      previousTouchAction: svg.style.touchAction,
      elements: markerElementsAt(svg, marker)
    };
    svg.setPointerCapture?.(event.pointerId);
  }, true);

  document.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
    if (!drag.moved && distance < DRAG_THRESHOLD_PX) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.svg.style.touchAction = 'none';
      drag.svg.classList.add('shot-point-dragging');
    }
    event.preventDefault();
    event.stopPropagation();
    updatePreview(event.clientX, event.clientY);
  }, { capture: true, passive: false });

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    drag = null;
    current.svg.releasePointerCapture?.(event.pointerId);
    current.svg.style.touchAction = current.previousTouchAction;
    current.svg.classList.remove('shot-point-dragging');

    if (!current.moved) return;
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
    window.setTimeout(() => {
      suppressNativeClick = false;
    }, 0);
  }

  document.addEventListener('pointerup', finishDrag, { capture: true, passive: false });
  document.addEventListener('pointercancel', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.svg.style.touchAction = drag.previousTouchAction;
    drag.svg.classList.remove('shot-point-dragging');
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
