export interface ViewTransform {
  xZoom: number;
  xOffset: number;
  yZoom: number;
  yOffset: number;
}

export const defaultTransform: ViewTransform = {
  xZoom: 1,
  xOffset: 0,
  yZoom: 1,
  yOffset: 0,
};

export function registerInteractions(
  el: HTMLElement,
  transform: ViewTransform,
  onTransform: (t: ViewTransform) => void
) {
  const handleDbl = () => {
    onTransform({ ...defaultTransform });
  };
  el.addEventListener('dblclick', handleDbl);
  return () => {
    el.removeEventListener('dblclick', handleDbl);
  };
}

export function hoverAt(x: number, y: number) {
  return { x, y };
}
