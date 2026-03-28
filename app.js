/* =====================================================
   码上传递 · app.js
   文件/文字 → 上传 → 生成二维码
   ===================================================== */

// ── State ──────────────────────────────────────────
const state = {
  activeTab: 'file',
  selectedFile: null,
  qrColor: '#6C63FF',
  qrColorText: '#6C63FF',
  qrSize: 280,
  qrSizeText: 280,
  currentQRUrl: '',
};

// ── Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initUploadZone();
  initTextCounter();
  loadGhToken();
});

// ── Background Particles ───────────────────────────
function initParticles() {
  const container = document.getElementById('bgParticles');
  const colors = ['#6C63FF', '#00D2FF', '#a78bfa', '#F857A6'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 80 + 20;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 20 + 15}s;
      animation-delay: ${Math.random() * 20}s;
      filter: blur(${size / 3}px);
    `;
    container.appendChild(p);
  }
}

// ── Tab Switching ──────────────────────────────────
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-pill').forEach(el => el.classList.remove('active'));
  document.getElementById(`panel${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
  hideQRResult();
}

// ── Upload Zone ────────────────────────────────────
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) selectFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => { if (input.files[0]) selectFile(input.files[0]); });
}

function getFileIcon(file) {
  const t = file.type;
  const n = file.name.toLowerCase();
  if (t.startsWith('image/')) return '🖼️';
  if (t.startsWith('video/')) return '🎬';
  if (t.startsWith('audio/')) return '🎵';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return '📄';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return '📝';
  if (n.endsWith('.xls') || n.endsWith('.xlsx') || n.endsWith('.csv')) return '📊';
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return '📑';
  if (n.endsWith('.zip') || n.endsWith('.rar') || n.endsWith('.7z')) return '🗜️';
  if (t.startsWith('text/') || n.endsWith('.txt')) return '📃';
  return '📦';
}

function getFileTypeName(file) {
  const t = file.type;
  const n = file.name.toLowerCase();
  if (t.startsWith('image/')) return '图片文件';
  if (t.startsWith('video/')) return '视频文件';
  if (t.startsWith('audio/')) return '音频文件';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'PDF文档';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return 'Word文档';
  if (n.endsWith('.xls') || n.endsWith('.xlsx')) return 'Excel表格';
  if (n.endsWith('.csv')) return 'CSV文件';
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return 'PowerPoint';
  return '文件';
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function selectFile(file) {
  // Size check: 100 MB
  if (file.size > 100 * 1024 * 1024) {
    showToast('❌ 文件超过 100MB 限制，请选择更小的文件');
    return;
  }
  state.selectedFile = file;
  document.getElementById('uploadZone').classList.add('hidden');
  const preview = document.getElementById('filePreview');
  preview.classList.remove('hidden');
  document.getElementById('fileTypeIcon').textContent = getFileIcon(file);
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatBytes(file.size);

  // Image preview
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('imgPreview').src = e.target.result;
      document.getElementById('imgPreviewWrap').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    document.getElementById('imgPreviewWrap').classList.add('hidden');
  }
}

function clearFile() {
  state.selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadZone').classList.remove('hidden');
  document.getElementById('filePreview').classList.add('hidden');
  document.getElementById('imgPreviewWrap').classList.add('hidden');
  hideQRResult();
}

// ── Text Counter ───────────────────────────────────
function initTextCounter() {
  const input = document.getElementById('textInput');
  input.addEventListener('input', () => {
    document.getElementById('charCount').textContent = input.value.length;
  });
}

// ── Color & Size ───────────────────────────────────
function selectColor(el) {
  document.querySelectorAll('#panelFile .color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  state.qrColor = el.dataset.color;
}
function customColorChanged(input) {
  document.querySelectorAll('#panelFile .color-swatch').forEach(s => s.classList.remove('active'));
  state.qrColor = input.value;
}
function selectSize(el) {
  document.querySelectorAll('#panelFile .size-btn').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  state.qrSize = parseInt(el.dataset.size);
}

function selectColorText(el) {
  document.querySelectorAll('#textColorRow .color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  state.qrColorText = el.dataset.color;
}
function customColorTextChanged(input) {
  document.querySelectorAll('#textColorRow .color-swatch').forEach(s => s.classList.remove('active'));
  state.qrColorText = input.value;
}
function selectSizeText(el) {
  document.querySelectorAll('#textSizeRow .size-btn').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  state.qrSizeText = parseInt(el.dataset.size);
}

// ── Generate ───────────────────────────────────────
async function handleFileGenerate() {
  if (!state.selectedFile) {
    showToast('⚠️ 请先选择要转换的文件');
    return;
  }
  const btn = document.getElementById('generateFileBtn');
  btn.disabled = true;

  try {
    showProgress('正在上传文件...', '连接服务器中，请稍候');
    const { url: fileUrl, service } = await uploadFile(state.selectedFile);
    hideProgress();

    // 直接用文件 URL 生成二维码，扫码后直接下载，无中间页
    state.currentQRUrl = fileUrl;
    renderQR(fileUrl, state.qrSize, state.qrColor);
    document.getElementById('qrTypeLabel').textContent = getFileTypeName(state.selectedFile);
    document.getElementById('qrServiceLabel').textContent = service;
    showQRResult();
    showToast('✅ 二维码生成成功！');
  } catch (err) {
    hideProgress();
    console.error(err);
    if (err.message === 'NEED_TOKEN') {
      showTokenModal();
    } else {
      showToast('❌ ' + (err.message || '上传失败，请重试'));
    }
  } finally {
    btn.disabled = false;
  }
}

async function handleTextGenerate() {
  const text = document.getElementById('textInput').value.trim();
  if (!text) {
    showToast('⚠️ 请输入要转换的文字内容');
    return;
  }
  const btn = document.getElementById('generateTextBtn');
  btn.disabled = true;

  try {
    state.currentQRUrl = text;
    renderQR(text, state.qrSizeText, state.qrColorText);
    document.getElementById('qrTypeLabel').textContent = '文字内容';
    showQRResult();
    showToast('✅ 二维码生成成功！');
  } finally {
    btn.disabled = false;
  }
}

// ── File Upload ─────────────────────────────────────
/**
 * Try multiple upload services in order.
 * If GitHub token is saved, use GitHub API first (most reliable in CN).
 * Throws 'NEED_TOKEN' error when all anonymous services fail → shows token modal.
 */
async function uploadFile(file) {
  const token = localStorage.getItem('gh_token');

  // ① GitHub API — 如果配置了 Token，优先使用，失败则直接报错（不回退到国内无法访问的外网服务）
  if (token) {
    setProgress(5, '正在通过 GitHub 上传...');
    try {
      const url = await uploadGitHub(file, token);
      return { url, service: 'GitHub jsDelivr CDN' };
    } catch (e) {
      console.error('GitHub upload failed:', e.message);
      throw new Error(
        `GitHub 上传失败: ${e.message}\n\n` +
        `请检查：\n` +
        `① Token 是否有效（repo 权限）\n` +
        `② 用户名 / 仓库名是否正确\n` +
        `③ 文件是否超过 25MB`
      );
    }
  }

  // ② 未配置 Token — 尝试匿名本地化直链服务
  const services = [
    ['catbox.moe',      uploadCatbox],     // 直链 ✓ 永久
    ['litterbox',       uploadLitterbox],  // 直链 ✓ 72h
    ['uguu.se',         uploadUguu],       // 直链 ✓ 48h
    ['file.io',         uploadFileIo],     // 直链 ✓ 14d
    ['0x0.st',          upload0x0],        // 直链 ✓
    ['transfer.sh',     uploadTransferSh], // 直链 ✓
    ['gofile.io',       uploadGofile],     // 页面链接，放最后
  ];

  for (const [name, fn] of services) {
    try {
      setProgress(10, `正在上传到 ${name}...`);
      const url = await fn(file);
      return { url, service: name };
    } catch (e) {
      console.warn(name + ' failed:', e.message);
    }
  }

  // 所有匿名服务失败
  throw new Error('NEED_TOKEN');
}

// ── GitHub API Upload (推荐：国内可用) ─────────────────
async function uploadGitHub(file, token) {
  // 25MB limit for base64 GitHub API
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('文件超过 25MB，无法通过 GitHub API 上传');
  }
  const base64 = await fileToBase64(file);
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const path = `uploads/${timestamp}_${safeName}`;

  const ghUser = localStorage.getItem('gh_user') || 'BonnyBing';
  const ghRepo = localStorage.getItem('gh_repo') || 'qr-transfer';

  setProgress(30, '正在上传到 GitHub...');
  const resp = await fetchWithTimeout(
    `https://api.github.com/repos/${ghUser}/${ghRepo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Upload: ${file.name}`,
        content: base64,
      }),
    },
    90000
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API 错误 ${resp.status}`);
  }
  setProgress(95, '生成下载链接...');
  // jsDelivr 在国内可访问，用它作为下载 CDN
  return `https://cdn.jsdelivr.net/gh/${ghUser}/${ghRepo}@main/${path}`;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Gofile.io ──────────────────────────────────────
async function uploadGofile(file) {
  // Step 1: get best server
  const serverResp = await fetchWithTimeout('https://api.gofile.io/servers', {}, 10000);
  if (!serverResp.ok) throw new Error('gofile server list failed');
  const serverJson = await serverResp.json();
  const server = serverJson?.data?.servers?.[0]?.name;
  if (!server) throw new Error('gofile no server');

  // Step 2: upload
  const form = new FormData();
  form.append('file', file);
  const resp = await fetchWithTimeout(
    `https://${server}.gofile.io/contents/uploadfile`,
    { method: 'POST', body: form },
    90000
  );
  if (!resp.ok) throw new Error(`gofile HTTP ${resp.status}`);
  const json = await resp.json();
  if (json.status !== 'ok') throw new Error('gofile: ' + json.message);
  const link = json.data?.downloadPage || json.data?.directLink;
  if (!link) throw new Error('gofile no link');
  setProgress(100, '上传完成！');
  return link;
}

// ── Catbox.moe (permanent) ─────────────────────────
async function uploadCatbox(file) {
  if (file.size > 200 * 1024 * 1024) throw new Error('catbox: file > 200MB');
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', file);
  const resp = await fetchWithTimeout('https://catbox.moe/user/api.php', { method: 'POST', body: form }, 90000);
  if (!resp.ok) throw new Error(`catbox HTTP ${resp.status}`);
  const url = (await resp.text()).trim();
  if (!url.startsWith('http')) throw new Error('catbox invalid response');
  setProgress(100, '上传完成！');
  return url;
}

// ── Litterbox (72h temp) ───────────────────────────
async function uploadLitterbox(file) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('time', '72h');
  form.append('fileToUpload', file);
  const resp = await fetchWithTimeout(
    'https://litterbox.catbox.moe/resources/internals/api.php',
    { method: 'POST', body: form },
    90000
  );
  if (!resp.ok) throw new Error(`litterbox HTTP ${resp.status}`);
  const url = (await resp.text()).trim();
  if (!url.startsWith('http')) throw new Error('litterbox invalid response');
  setProgress(100, '上传完成！');
  return url;
}

// ── Uguu.se (48h) ─────────────────────────────────
async function uploadUguu(file) {
  if (file.size > 100 * 1024 * 1024) throw new Error('uguu: file > 100MB');
  const form = new FormData();
  form.append('files[]', file);
  const resp = await fetchWithTimeout('https://uguu.se/upload', { method: 'POST', body: form }, 90000);
  if (!resp.ok) throw new Error(`uguu HTTP ${resp.status}`);
  const json = await resp.json();
  const url = json?.files?.[0]?.url;
  if (!url) throw new Error('uguu no url');
  setProgress(100, '上传完成！');
  return url;
}

// ── file.io ────────────────────────────────────────
async function uploadFileIo(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('expiry', '14d');
  const resp = await fetchWithTimeout('https://file.io', { method: 'POST', body: form }, 60000);
  if (!resp.ok) throw new Error(`file.io HTTP ${resp.status}`);
  const json = await resp.json();
  if (!json.success || !json.link) throw new Error('file.io: ' + (json.message || 'failed'));
  setProgress(100, '上传完成！');
  return json.link;
}

// ── 0x0.st ────────────────────────────────────────
async function upload0x0(file) {
  const form = new FormData();
  form.append('file', file);
  const resp = await fetchWithTimeout('https://0x0.st', { method: 'POST', body: form }, 60000);
  if (!resp.ok) throw new Error(`0x0.st HTTP ${resp.status}`);
  const url = (await resp.text()).trim();
  if (!url.startsWith('http')) throw new Error('0x0.st invalid response');
  setProgress(100, '上传完成！');
  return url;
}

// ── transfer.sh ────────────────────────────────────
async function uploadTransferSh(file) {
  const safeFilename = encodeURIComponent(file.name.replace(/\s+/g, '_'));
  const resp = await fetchWithTimeout(
    `https://transfer.sh/${safeFilename}`,
    { method: 'PUT', body: file, headers: { 'Max-Days': '14' } },
    60000
  );
  if (!resp.ok) throw new Error(`transfer.sh HTTP ${resp.status}`);
  const url = (await resp.text()).trim();
  if (!url.startsWith('http')) throw new Error('transfer.sh invalid response');
  setProgress(100, '上传完成！');
  return url;
}

function fetchWithTimeout(url, options, timeout) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('请求超时'));
    }, timeout);
    fetch(url, { ...options, signal: controller.signal })
      .then(r => { clearTimeout(timer); resolve(r); })
      .catch(e => { clearTimeout(timer); reject(e); });
  });
}

// ── GitHub Token Modal ─────────────────────────────
function showTokenModal() {
  hideProgress();
  document.getElementById('tokenModal').classList.remove('hidden');
  // pre-fill saved values
  const saved = localStorage.getItem('gh_token');
  if (saved) document.getElementById('ghTokenInput').value = saved;
  document.getElementById('ghUserInput').value = localStorage.getItem('gh_user') || 'BonnyBing';
  document.getElementById('ghRepoInput').value = localStorage.getItem('gh_repo') || 'qr-transfer';
}

function closeTokenModal() {
  document.getElementById('tokenModal').classList.add('hidden');
}

function loadGhToken() {
  const token = localStorage.getItem('gh_token');
  const indicator = document.getElementById('tokenStatusDot');
  if (indicator) indicator.style.display = token ? 'inline-block' : 'none';
}

async function saveTokenAndUpload() {
  const token = document.getElementById('ghTokenInput').value.trim();
  const user  = document.getElementById('ghUserInput').value.trim();
  const repo  = document.getElementById('ghRepoInput').value.trim();

  if (!token) { showToast('⚠️ 请输入 GitHub Token'); return; }
  if (!user || !repo) { showToast('⚠️ 请填写用户名和仓库名'); return; }

  localStorage.setItem('gh_token', token);
  localStorage.setItem('gh_user', user);
  localStorage.setItem('gh_repo', repo);
  loadGhToken();
  closeTokenModal();

  // Retry upload with the new token
  if (state.selectedFile) {
    const btn = document.getElementById('generateFileBtn');
    btn.disabled = true;
    try {
      showProgress('正在通过 GitHub 上传...', '使用您的 GitHub 仓库存储文件');
      const { url: fileUrl, service } = await uploadFile(state.selectedFile);
      hideProgress();
      state.currentQRUrl = fileUrl;
      renderQR(fileUrl, state.qrSize, state.qrColor);
      document.getElementById('qrTypeLabel').textContent = getFileTypeName(state.selectedFile);
      document.getElementById('qrServiceLabel').textContent = service;
      showQRResult();
      showToast('✅ 二维码生成成功！');
    } catch (err) {
      hideProgress();
      showToast('❌ ' + (err.message || '上传失败'));
    } finally {
      btn.disabled = false;
    }
  }
}

function clearGhToken() {
  localStorage.removeItem('gh_token');
  localStorage.removeItem('gh_user');
  localStorage.removeItem('gh_repo');
  loadGhToken();
  showToast('🗑️ GitHub Token 已清除');
  closeTokenModal();
}

// ── Download Page URL ──────────────────────────────
/**
 * Build a self-hosted download page URL via hash params.
 * The QR code links to this page with the file URL encoded.
 */
function buildDownloadPageUrl(fileUrl, fileName, mimeType) {
  const base = window.location.href.replace(/\/[^/]*$/, '/download.html');
  const params = new URLSearchParams({
    url: fileUrl,
    name: fileName,
    type: mimeType || '',
  });
  return `${base}#${params.toString()}`;
}

// ── QR Rendering ───────────────────────────────────
let qrInstance = null;

function renderQR(data, size, color) {
  const box = document.getElementById('qrBox');
  box.innerHTML = '';
  qrInstance = new QRCode(box, {
    text: data,
    width: size,
    height: size,
    colorDark: color,
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.L,  // Level L = 最小码点密度，清晰易扫
  });
}

// ── QR Actions ─────────────────────────────────────
function downloadQR() {
  const box = document.getElementById('qrBox');
  const canvas = box.querySelector('canvas');
  const img = box.querySelector('img');
  if (canvas) {
    const link = document.createElement('a');
    link.download = '二维码_码上传递.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } else if (img) {
    const link = document.createElement('a');
    link.download = '二维码_码上传递.png';
    link.href = img.src;
    link.click();
  }
  showToast('✅ 二维码已下载');
}

async function copyQRImage() {
  const box = document.getElementById('qrBox');
  const canvas = box.querySelector('canvas');
  if (!canvas) { showToast('⚠️ 暂不支持复制'); return; }
  try {
    canvas.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('✅ 图片已复制到剪贴板');
      } catch {
        showToast('⚠️ 浏览器不支持直接复制图片，请截图保存');
      }
    });
  } catch {
    showToast('⚠️ 复制失败，请截图保存');
  }
}

function resetAll() {
  clearFile();
  document.getElementById('textInput').value = '';
  document.getElementById('charCount').textContent = '0';
  hideQRResult();
  showToast('🔄 已重置，可重新生成');
}

// ── Show / Hide QR ─────────────────────────────────
function showQRResult() {
  document.getElementById('qrResult').classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('qrResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}
function hideQRResult() {
  document.getElementById('qrResult').classList.add('hidden');
}

// ── Progress ───────────────────────────────────────
function showProgress(title, sub) {
  document.getElementById('progressTitle').textContent = title;
  document.getElementById('progressSub').textContent = sub;
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressOverlay').classList.remove('hidden');
  animateProgressBar();
}
let progressTimer = null;
function animateProgressBar() {
  let val = 0;
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    val += Math.random() * 3;
    if (val > 90) { clearInterval(progressTimer); val = 90; }
    document.getElementById('progressBar').style.width = val + '%';
  }, 300);
}
function setProgress(pct, sub) {
  if (progressTimer) clearInterval(progressTimer);
  document.getElementById('progressBar').style.width = pct + '%';
  if (sub) document.getElementById('progressSub').textContent = sub;
}
function hideProgress() {
  if (progressTimer) clearInterval(progressTimer);
  document.getElementById('progressBar').style.width = '100%';
  setTimeout(() => { document.getElementById('progressOverlay').classList.add('hidden'); }, 400);
}

// ── Toast ──────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.classList.remove('hidden');
  t.textContent = msg;
  void t.offsetWidth; // reflow
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 350);
  }, 3000);
}

// ── Text Modal ─────────────────────────────────────
function closeTextModal() {
  document.getElementById('textQrModal').classList.add('hidden');
}
