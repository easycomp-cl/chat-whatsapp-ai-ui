export type WhatsAppFormatMarker = "*" | "_" | "~";

const MARKERS: WhatsAppFormatMarker[] = ["*", "_", "~"];

type SelectionAnalysis = {
  core: string;
  layers: WhatsAppFormatMarker[];
  regionStart: number;
  regionEnd: number;
  coreStart: number;
  coreEnd: number;
};

function peelOutward(
  text: string,
  start: number,
  end: number
): { layers: WhatsAppFormatMarker[]; regionStart: number; regionEnd: number } {
  let regionStart = start;
  let regionEnd = end;
  const layers: WhatsAppFormatMarker[] = [];

  while (true) {
    let found = false;

    for (const marker of MARKERS) {
      if (
        regionStart > 0 &&
        regionEnd < text.length &&
        text[regionStart - 1] === marker &&
        text[regionEnd] === marker
      ) {
        regionStart -= 1;
        regionEnd += 1;
        layers.push(marker);
        found = true;
        break;
      }
    }

    if (!found) break;
  }

  return { layers, regionStart, regionEnd };
}

function stripMarkersFromEdges(
  text: string,
  start: number,
  end: number
): { start: number; end: number } {
  let coreStart = start;
  let coreEnd = end;

  while (coreEnd - coreStart >= 2) {
    let stripped = false;

    for (const marker of MARKERS) {
      if (text[coreStart] === marker && text[coreEnd - 1] === marker) {
        coreStart += 1;
        coreEnd -= 1;
        stripped = true;
        break;
      }
    }

    if (!stripped) break;
  }

  return { start: coreStart, end: coreEnd };
}

function analyzeSelection(
  text: string,
  start: number,
  end: number
): SelectionAnalysis {
  const trimmed = stripMarkersFromEdges(text, start, end);
  const peeled = peelOutward(text, trimmed.start, trimmed.end);

  return {
    core: text.slice(trimmed.start, trimmed.end),
    layers: peeled.layers,
    regionStart: peeled.regionStart,
    regionEnd: peeled.regionEnd,
    coreStart: trimmed.start,
    coreEnd: trimmed.end,
  };
}

function buildFormattedText(
  core: string,
  layers: WhatsAppFormatMarker[]
): string {
  let result = core;
  for (const marker of layers) {
    result = `${marker}${result}${marker}`;
  }
  return result;
}

export function toggleFormatOnRange(
  text: string,
  start: number,
  end: number,
  marker: WhatsAppFormatMarker
): { text: string; selectionStart: number; selectionEnd: number } {
  if (start === end) {
    return { text, selectionStart: start, selectionEnd: end };
  }

  const { core, layers, regionStart, regionEnd } = analyzeSelection(
    text,
    start,
    end
  );

  if (!core) {
    return { text, selectionStart: start, selectionEnd: end };
  }

  const hasMarker = layers.includes(marker);
  const nextLayers = hasMarker
    ? layers.filter((layer) => layer !== marker)
    : [marker, ...layers];

  const formatted = buildFormattedText(core, nextLayers);
  const newText = text.slice(0, regionStart) + formatted + text.slice(regionEnd);
  const markerPadding = nextLayers.length;

  return {
    text: newText,
    selectionStart: regionStart + markerPadding,
    selectionEnd: regionStart + formatted.length - markerPadding,
  };
}

export function isRangeFormatted(
  text: string,
  start: number,
  end: number,
  marker: WhatsAppFormatMarker
): boolean {
  if (start === end) return false;
  return analyzeSelection(text, start, end).layers.includes(marker);
}
