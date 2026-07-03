(function(){
  const form = document.getElementById('qr-form');
  const urlInput = document.getElementById('url-input');
  const logoInput = document.getElementById('logo-input');
  const dropZone = document.getElementById('drop-zone');
  const logoPreview = document.getElementById('logo-preview');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const logoFilename = document.getElementById('logo-filename');
  const logoRemove = document.getElementById('logo-remove');
  const canvas = document.getElementById('qr-canvas');
  const ctx = canvas.getContext('2d');
  const scanline = document.getElementById('scanline');
  const metaStatus = document.getElementById('meta-status');
  const metaEc = document.getElementById('meta-ec');
  const ecNote = document.getElementById('ec-note');
  const downloadPng = document.getElementById('download-png');
  const downloadSvg = document.getElementById('download-svg');
  const resetBtn = document.getElementById('reset-btn');
  const ecRadios = document.querySelectorAll('input[name="ec"]');

  let logoImage = null;
  let lastSvg = null;
  const SIZE = 500;

  function currentEc(){
    if (logoImage) return 'H';
    return document.querySelector('input[name="ec"]:checked').value;
  }

  function updateEcLock(){
    ecRadios.forEach(r => r.disabled = !!logoImage);
    if (logoImage){
      document.getElementById('ec-h').checked = true;
      ecNote.textContent = 'ล็อกที่ H เพราะมีโลโก้ตรงกลาง';
    } else {
      ecNote.textContent = 'เลือกได้อิสระเมื่อไม่มีโลโก้';
    }
  }

  function loadLogoFile(file){
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        logoImage = img;
        logoPreviewImg.src = e.target.result;
        logoFilename.textContent = file.name.length > 20 ? file.name.slice(0,17)+'…' : file.name;
        logoPreview.classList.add('show');
        updateEcLock();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  dropZone.addEventListener('click', () => logoInput.click());
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); logoInput.click(); }
  });
  logoInput.addEventListener('change', () => loadLogoFile(logoInput.files[0]));

  ['dragover','dragenter'].forEach(evt => {
    dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('drag'); });
  });
  ['dragleave','drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('drag'); });
  });
  dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) loadLogoFile(file);
  });

  logoRemove.addEventListener('click', () => {
    logoImage = null;
    logoInput.value = '';
    logoPreview.classList.remove('show');
    updateEcLock();
  });

  function drawRoundedRect(context, x, y, w, h, r){
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function drawLogo(){
    if (!logoImage) return;
    const logoSize = SIZE * 0.30;
    const x = (SIZE - logoSize) / 2;
    const y = (SIZE - logoSize) / 2;
    const pad = 8;
    const radius = logoSize * 0.18;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, x - pad, y - pad, logoSize + pad*2, logoSize + pad*2, radius + pad);
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, x, y, logoSize, logoSize, radius);
    ctx.clip();
    ctx.drawImage(logoImage, x, y, logoSize, logoSize);
    ctx.restore();
  }

  async function generate(triggerAnim){
    const value = urlInput.value.trim();
    if (!value){
      metaStatus.textContent = 'กรุณากรอกลิงก์';
      return;
    }
    const ec = currentEc();
    metaEc.textContent = 'EC: ' + ec;

    try{
      await QRCode.toCanvas(canvas, value, {
        width: SIZE,
        margin: 2,
        errorCorrectionLevel: ec,
        color: { dark: '#1B1B1E', light: '#FFFFFFFF' }
      });
      drawLogo();

      lastSvg = await QRCode.toString(value, {
        type: 'svg',
        width: SIZE,
        margin: 2,
        errorCorrectionLevel: ec,
        color: { dark: '#1B1B1E', light: '#FFFFFFFF' }
      });

      metaStatus.textContent = 'สร้างสำเร็จ';
      downloadPng.disabled = false;
      downloadSvg.disabled = !!logoImage; // SVG export skips raster logo compositing
      if (logoImage){
        downloadSvg.title = 'ยังไม่รองรับ SVG เมื่อมีโลโก้ ใช้ PNG แทน';
      } else {
        downloadSvg.title = '';
      }

      if (triggerAnim){
        scanline.classList.remove('run');
        void scanline.offsetWidth;
        scanline.classList.add('run');
      }
    } catch(err){
      metaStatus.textContent = 'ลิงก์ยาวเกินไปสำหรับระดับนี้';
      console.error(err);
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    generate(true);
  });

  ecRadios.forEach(r => r.addEventListener('change', () => {
    if (urlInput.value.trim()) generate(false);
  }));

  resetBtn.addEventListener('click', () => {
    form.reset();
    logoImage = null;
    logoInput.value = '';
    logoPreview.classList.remove('show');
    updateEcLock();
    ctx.clearRect(0,0,SIZE,SIZE);
    metaStatus.textContent = 'รอข้อมูล…';
    downloadPng.disabled = true;
    downloadSvg.disabled = true;
  });

  downloadPng.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  downloadSvg.addEventListener('click', () => {
    if (!lastSvg) return;
    const blob = new Blob([lastSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'qrcode.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  });

  updateEcLock();
})();
