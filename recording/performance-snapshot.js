const DEFAULT_RASTERIZER_URL = 'https://esm.sh/html2canvas@1.4.1';
let rasterizerPromise = null;

async function loadDefaultRasterizer() {
  const module = await import(DEFAULT_RASTERIZER_URL);
  return module.default;
}

export function preloadPerformanceSnapshotRasterizer() {
  if (!rasterizerPromise) {
    rasterizerPromise = loadDefaultRasterizer().catch((error) => {
      rasterizerPromise = null;
      throw error;
    });
  }
  return rasterizerPromise;
}

export function createPerformanceMetadataSnapshot({ musicStatus = {}, rhythmStatus = {} } = {}) {
  const uppercase = (value, fallback) => {
    const text = String(value || fallback).trim();
    return text ? text.toUpperCase() : fallback;
  };
  const tempo = Number(musicStatus.tempo);
  return Object.freeze({
    scene: uppercase(musicStatus.sceneName, 'LIVE SCENE'),
    synth: uppercase(musicStatus.synthName, 'MELODY'),
    rhythm: uppercase(rhythmStatus.label, 'FREE'),
    bpm: Number.isFinite(tempo) && tempo > 0 ? Math.round(tempo) : 120,
    root: String(musicStatus.rootNote || '--'),
    fx: String(musicStatus.effectsLabel || 'LP 100% · DLY 0% · GLT 0% · RVB 0%'),
  });
}

function shouldIgnoreElement(element) {
  return element?.id === 'recording-dialog'
    || element?.id === 'guide-dialog'
    || element?.hasAttribute?.('data-photo-capture-ignore') === true;
}

export async function capturePerformanceSnapshot({ root, rasterize } = {}) {
  try {
    const render = rasterize ?? await preloadPerformanceSnapshotRasterizer();
    return await render(root, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: 1,
      width: root.clientWidth,
      height: root.clientHeight,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: shouldIgnoreElement,
      onclone: (clone) => {
        const clonedRoot = clone.querySelector?.('#renderDiv');
        if (clonedRoot?.style) clonedRoot.style.background = 'transparent';
        for (const video of clone.querySelectorAll?.('video[data-camera-feed], #inputVideo') ?? []) {
          if (video?.style) video.style.visibility = 'hidden';
        }
      },
    });
  } catch (error) {
    console.warn('Unable to capture performance snapshot; using the camera fallback.', error);
    return null;
  }
}
