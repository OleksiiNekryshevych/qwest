// Minimal local 'gema3n' module - no network, local image comparison
// Provides init(referenceUrl) and query(imageData, question) functions.

const gema3n = (() => {
  let refHistogram = null;

  // utility: create canvas, draw image, resize, get grayscale histogram
  async function loadImageToHistogram(url, size = 128) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const hist = new Uint32Array(256);
        for (let i = 0; i < data.length; i += 4) {
          // simple grayscale by luminance
          const r = data[i], g = data[i+1], b = data[i+2];
          const lum = Math.round(0.2126*r + 0.7152*g + 0.0722*b);
          hist[lum]++;
        }
        resolve(hist);
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  function histogramSimilarity(a, b) {
    // normalized intersection
    let minSum = 0, sumA = 0, sumB = 0;
    for (let i = 0; i < 256; i++) {
      minSum += Math.min(a[i] || 0, b[i] || 0);
      sumA += a[i] || 0;
      sumB += b[i] || 0;
    }
    const denom = Math.min(sumA, sumB) || 1;
    return minSum / denom; // in [0,1]
  }

  async function init(referenceUrl) {
    refHistogram = await loadImageToHistogram(referenceUrl, 128);
    return true;
  }

  async function imageDataToHistogram(imageData, size = 128) {
    // imageData can be HTMLCanvasElement or ImageData
    let canvas;
    if (imageData instanceof HTMLCanvasElement) {
      canvas = imageData;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageData, 0, 0, size, size);
    }
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hist = new Uint32Array(256);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const lum = Math.round(0.2126*r + 0.7152*g + 0.0722*b);
      hist[lum]++;
    }
    return hist;
  }

  async function query(canvasElement, question) {
    if (!refHistogram) {
      throw new Error('gema3n not initialized with reference image');
    }
    // Accept either HTMLCanvasElement or HTMLVideoElement
    let canvas;
    if (canvasElement instanceof HTMLVideoElement) {
      canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
    } else if (canvasElement instanceof HTMLCanvasElement) {
      canvas = canvasElement;
    } else {
      // assume image element
      canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
    }

    const hist = await imageDataToHistogram(canvas, 128);
    const sim = histogramSimilarity(refHistogram, hist);

    // Heuristic: if similarity above threshold => yes
    const threshold = 0.28; // tuned conservatively
    const contains = sim >= threshold;

    // mimic a small-model response object
    return {
      question,
      similarity: sim,
      contains,
      answer: contains ? 'object has been detected' : 'object not detected',
    };
  }

  return { init, query };
})();

export default gema3n;
