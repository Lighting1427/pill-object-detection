document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileInfoBar = document.getElementById('fileInfoBar');
  const fileNameText = document.getElementById('fileNameText');
  const fileSizeText = document.getElementById('fileSizeText');
  const btnClearFile = document.getElementById('btnClearFile');
  const btnDetect = document.getElementById('btnDetect');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = btnDetect.querySelector('.btn-text');

  const pillCountValue = document.getElementById('pillCountValue');
  const statusBadge = document.getElementById('statusBadge');
  const viewControls = document.getElementById('viewControls');
  const toggleButtons = document.querySelectorAll('.btn-opt');

  const viewerPlaceholder = document.getElementById('viewerPlaceholder');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const resultCanvas = document.getElementById('resultCanvas');
  const detailsSection = document.getElementById('detailsSection');
  const detailsCount = document.getElementById('detailsCount');
  const detectionTableBody = document.getElementById('detectionTableBody');

  let selectedFile = null;
  let loadedImage = null;
  let currentDetections = [];
  let displayMode = 'dot'; // 'dot', 'box-only', 'full'

  // Display mode toggle buttons
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      displayMode = btn.dataset.mode;
      if (loadedImage && currentDetections.length > 0) {
        drawDetections(loadedImage, currentDetections);
      }
    });
  });

  // File selection via Input
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Drag & drop handlers
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  btnClearFile.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadState();
  });

  function handleFileSelected(file) {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)');
      return;
    }

    selectedFile = file;
    currentDetections = [];
    fileNameText.textContent = file.name;
    if (fileSizeText) {
      fileSizeText.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    }
    fileInfoBar.style.display = 'flex';
    btnDetect.disabled = false;
    viewControls.style.display = 'none';

    // Preview image on canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        loadedImage = img;
        renderImageOnly(img);
        updateStatus('พร้อมตรวจนับ', 'neutral');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetUploadState() {
    selectedFile = null;
    loadedImage = null;
    currentDetections = [];
    fileInput.value = '';
    fileInfoBar.style.display = 'none';
    btnDetect.disabled = true;
    pillCountValue.textContent = '-';
    viewControls.style.display = 'none';
    updateStatus('รอภาพถ่าย', 'neutral');
    
    // Reset canvas to placeholder
    viewerPlaceholder.style.display = 'flex';
    canvasWrapper.style.display = 'none';
    detailsSection.style.display = 'none';
    if (detectionTableBody) detectionTableBody.innerHTML = '';
  }

  function renderImageOnly(img) {
    viewerPlaceholder.style.display = 'none';
    canvasWrapper.style.display = 'flex';

    resultCanvas.width = img.naturalWidth || img.width;
    resultCanvas.height = img.naturalHeight || img.height;

    const ctx = resultCanvas.getContext('2d');
    ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    ctx.drawImage(img, 0, 0);
  }

  function drawDetections(img, detections) {
    renderImageOnly(img);
    const ctx = resultCanvas.getContext('2d');

    const maxDim = Math.max(resultCanvas.width, resultCanvas.height);
    const scale = Math.max(1, maxDim / 1000);
    const boxLineWidth = Math.max(1.8, 2.2 * scale);

    detections.forEach((det, idx) => {
      const { x1, y1, x2, y2 } = det.bbox;
      const w = x2 - x1;
      const h = y2 - y1;

      // กรอบสีแดงสดใส มองเห็นง่าย ชัดเจนทุกพื้นผิว
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = boxLineWidth;
      ctx.strokeRect(x1, y1, w, h);

      // โหมด 1: "dot" (จุดมาร์กเกอร์ตรงมุม ไม่บังเม็ดยา)
      if (displayMode === 'dot') {
        const radius = Math.max(8, Math.min(16, 10 * scale));
        const cx = Math.max(radius, x1);
        const cy = Math.max(radius, y1);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        const numFontSize = Math.round(radius * 1.15);
        ctx.font = `700 ${numFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${idx + 1}`, cx, cy);
      } 
      // โหมด 2: "box-only" (เฉพาะกรอบเส้นเดี่ยว มองเม็ดยาแบบโล่ง 100%)
      else if (displayMode === 'box-only') {
        // วาดแค่กรอบรอบเม็ดยา
      } 
      // โหมด 3: "full" (กรอบพร้อมเปอร์เซ็นต์ อยู่นอกตัวยา)
      else if (displayMode === 'full') {
        const fontSize = Math.max(10, Math.min(18, Math.round(11 * scale)));
        const labelText = `#${idx + 1} ${(det.confidence * 100).toFixed(0)}%`;
        ctx.font = `600 ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(labelText);
        const textPadX = Math.round(3 * scale);
        const textPadY = Math.round(2 * scale);
        const badgeW = textMetrics.width + textPadX * 2;
        const badgeH = fontSize + textPadY * 2;

        const badgeY = y1 - badgeH >= 0 ? y1 - badgeH : y1;
        
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x1, badgeY, badgeW, badgeH);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x1 + textPadX, badgeY + textPadY);
      }
    });
  }

  function updateStatus(text, type) {
    statusBadge.textContent = text;
    statusBadge.className = 'badge-status';
    if (type === 'processing') statusBadge.classList.add('processing');
    if (type === 'success') statusBadge.classList.add('success');
    if (type === 'error') statusBadge.classList.add('error');
  }

  // Detect button trigger
  btnDetect.addEventListener('click', async () => {
    if (!selectedFile) return;

    btnDetect.disabled = true;
    btnSpinner.style.display = 'inline-block';
    btnText.textContent = 'กำลังประมวลผล...';
    updateStatus('กำลังตรวจนับ...', 'processing');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      currentDetections = data.detections || [];
      
      // Update UI with detection results
      pillCountValue.textContent = data.pill_count;
      updateStatus(`ตรวจนับสำเร็จ (${data.pill_count} เม็ด)`, 'success');
      viewControls.style.display = 'flex';

      if (loadedImage) {
        drawDetections(loadedImage, currentDetections);
      }

      // Populate detailed table
      renderDetailsTable(currentDetections);
    } catch (err) {
      console.error('Detection error:', err);
      updateStatus('เกิดข้อผิดพลาด', 'error');
      alert(`ตรวจนับไม่สำเร็จ: ${err.message}`);
    } finally {
      btnDetect.disabled = false;
      btnSpinner.style.display = 'none';
      btnText.textContent = 'ตรวจนับเม็ดยา';
    }
  });

  function renderDetailsTable(detections) {
    if (!detections || detections.length === 0) {
      detailsSection.style.display = 'none';
      return;
    }

    detailsCount.textContent = `${detections.length} เม็ด`;
    detectionTableBody.innerHTML = '';

    detections.forEach((det, idx) => {
      const { x1, y1, x2, y2 } = det.bbox;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-idx">#${idx + 1}</td>
        <td class="table-coords">(${Math.round(x1)}, ${Math.round(y1)}) - (${Math.round(x2)}, ${Math.round(y2)})</td>
        <td class="table-conf">${(det.confidence * 100).toFixed(1)}%</td>
      `;
      detectionTableBody.appendChild(tr);
    });

    detailsSection.style.display = 'block';
  }
});
