const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const uploadInput = document.getElementById("upload");
const uploadBtn = document.getElementById("uploadBtn");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const resetBtn = document.getElementById("reset");
const downloadBtn = document.getElementById("download");

const rotateEl = document.getElementById("rotate");
const brightnessEl = document.getElementById("brightness");
const contrastEl = document.getElementById("contrast");
const saturateEl = document.getElementById("saturate");

const rotateVal = document.getElementById("rotateVal");
const brightVal = document.getElementById("brightVal");
const contrastVal = document.getElementById("contrastVal");
const satVal = document.getElementById("satVal");

let state = {
  imgSrc: null,
  angle: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  x: 0,
  y: 0,
  scale: 1,
};

let img = new Image();
let imageLoaded = false;

const history = [];
let historyIndex = -1;
function pushHistory() {
  const snap = JSON.stringify(state);
  if (history[historyIndex] === snap) return;
  history.splice(historyIndex + 1);
  history.push(snap);
  historyIndex = history.length - 1;
  updateUndoRedo();
}
function restoreHistory(idx) {
  if (idx < 0 || idx >= history.length) return;
  const s = JSON.parse(history[idx]);
  Object.assign(state, s);
  if (state.imgSrc !== img.src) {
    img.src = state.imgSrc || "";
  } else {
    render();
  }
  historyIndex = idx;
  updateUndoRedo();
}
function updateUndoRedo() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
}

function fitCanvas() {
  const maxW = Math.min(window.innerWidth - 80, 1000);
  const w = Math.max(480, maxW);

  const h = Math.round(w * 0.65);
  canvas.width = w;
  canvas.height = h;
  render();
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

function computeFit() {
  if (!img.width) return { w: 0, h: 0 };
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  return {
    w: img.width * scale * state.scale,
    h: img.height * scale * state.scale,
  };
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!imageLoaded) {
    ctx.fillStyle = "#f6f7f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#bfc7cf";
    ctx.textAlign = "center";
    ctx.font = "16px Inter";
    ctx.fillText(
      "No image — upload or drag & drop",
      canvas.width / 2,
      canvas.height / 2,
    );
    return;
  }

  ctx.save();

  ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturate}%)`;

  const { w, h } = computeFit();
  const cx = canvas.width / 2 + state.x;
  const cy = canvas.height / 2 + state.y;
  ctx.translate(cx, cy);
  ctx.rotate((state.angle * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function loadImage(src, resetPosition = true) {
  img = new Image();
  img.onload = function () {
    imageLoaded = true;
    state.imgSrc = src;
    if (resetPosition) {
      state.scale = 1;
      state.x = 0;
      state.y = 0;
      state.angle = 0;
      state.brightness = 100;
      state.contrast = 100;
      state.saturate = 100;

      rotateEl.value = state.angle;
      rotateVal.textContent = state.angle + "°";
      brightnessEl.value = state.brightness;
      brightVal.textContent = state.brightness + "%";
      contrastEl.value = state.contrast;
      contrastVal.textContent = state.contrast + "%";
      saturateEl.value = state.saturate;
      satVal.textContent = state.saturate + "%";
    }
    render();
    pushHistory();
  };
  img.src = src;
}

uploadBtn.addEventListener("click", () => uploadInput.click());
uploadInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => loadImage(ev.target.result, true);
  reader.readAsDataURL(f);
});

canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  canvas.style.opacity = 0.9;
});
canvas.addEventListener("dragleave", (e) => {
  e.preventDefault();
  canvas.style.opacity = 1;
});
canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  canvas.style.opacity = 1;
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f && f.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (ev) => loadImage(ev.target.result, true);
    reader.readAsDataURL(f);
  }
});

let isPanning = false,
  panStart = { x: 0, y: 0 },
  startOffset = { x: 0, y: 0 };
canvas.addEventListener("pointerdown", (e) => {
  if (!imageLoaded) return;
  isPanning = true;
  canvas.setPointerCapture(e.pointerId);
  panStart = { x: e.clientX, y: e.clientY };
  startOffset = { x: state.x, y: state.y };
  canvas.style.cursor = "grabbing";
});
canvas.addEventListener("pointermove", (e) => {
  if (!isPanning) return;
  const dx = e.clientX - panStart.x;
  const dy = e.clientY - panStart.y;
  state.x = startOffset.x + dx;
  state.y = startOffset.y + dy;
  render();
});
canvas.addEventListener("pointerup", (e) => {
  if (!isPanning) return;
  isPanning = false;
  canvas.releasePointerCapture(e.pointerId);
  canvas.style.cursor = "grab";
  pushHistory();
});
canvas.addEventListener("pointercancel", () => {
  isPanning = false;
  canvas.style.cursor = "grab";
});

rotateEl.addEventListener("input", () => {
  state.angle = Number(rotateEl.value);
  rotateVal.textContent = state.angle + "°";
  render();
});
rotateEl.addEventListener("change", () => pushHistory());

brightnessEl.addEventListener("input", () => {
  state.brightness = Number(brightnessEl.value);
  brightVal.textContent = state.brightness + "%";
  render();
});
brightnessEl.addEventListener("change", () => pushHistory());

contrastEl.addEventListener("input", () => {
  state.contrast = Number(contrastEl.value);
  contrastVal.textContent = state.contrast + "%";
  render();
});
contrastEl.addEventListener("change", () => pushHistory());

saturateEl.addEventListener("input", () => {
  state.saturate = Number(saturateEl.value);
  satVal.textContent = state.saturate + "%";
  render();
});
saturateEl.addEventListener("change", () => pushHistory());

resetBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  state.angle = 0;
  state.brightness = 100;
  state.contrast = 100;
  state.saturate = 100;
  state.x = 0;
  state.y = 0;
  state.scale = 1;
  rotateEl.value = 0;
  rotateVal.textContent = "0°";
  brightnessEl.value = 100;
  brightVal.textContent = "100%";
  contrastEl.value = 100;
  contrastVal.textContent = "100%";
  saturateEl.value = 100;
  satVal.textContent = "100%";
  render();
  pushHistory();
});

undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) restoreHistory(historyIndex - 1);
});
redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) restoreHistory(historyIndex + 1);
});

downloadBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const outCtx = out.getContext("2d");
  outCtx.fillStyle = "#fff";
  outCtx.fillRect(0, 0, out.width, out.height);
  outCtx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturate}%)`;
  const { w, h } = computeFit();
  outCtx.translate(out.width / 2 + state.x, out.height / 2 + state.y);
  outCtx.rotate((state.angle * Math.PI) / 180);
  outCtx.drawImage(img, -w / 2, -h / 2, w, h);
  const link = document.createElement("a");
  link.download = "abdu-image.png";
  link.href = out.toDataURL();
  link.click();
});

render();
updateUndoRedo();
