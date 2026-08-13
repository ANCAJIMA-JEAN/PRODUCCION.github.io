/**
 * ui.js — Navegación entre pantallas, toasts, loaders, helpers de formato.
 */

const UI = (() => {

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('screen--active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('screen--active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.navbar__link').forEach(l => l.classList.remove('navbar__link--active'));
    const navLink = document.querySelector(`.navbar__link[data-screen="${id}"]`);
    if (navLink) navLink.classList.add('navbar__link--active');
  }

  let toastTimeout;
  function toast(message, type = 'info') {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.className = `toast toast--${type} toast--visible`;
    el.textContent = message;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('toast--visible'), 4200);
  }

  function setLoading(button, isLoading, loadingText = 'Guardando...') {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
    }
  }

  function showOverlayLoader(message = 'Cargando...') {
    let overlay = document.getElementById('overlay-loader');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'overlay-loader';
      overlay.className = 'overlay-loader';
      overlay.innerHTML = `<div class="overlay-loader__box"><span class="spinner spinner--lg"></span><p></p></div>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector('p').textContent = message;
    overlay.classList.add('overlay-loader--visible');
  }

  function hideOverlayLoader() {
    const overlay = document.getElementById('overlay-loader');
    if (overlay) overlay.classList.remove('overlay-loader--visible');
  }

  function isoToDisplay(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  function todayIso() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function fillSelect(selectEl, items, { valueKey, labelKey, placeholder }) {
    selectEl.innerHTML = '';
    if (placeholder) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = placeholder;
      selectEl.appendChild(opt);
    }
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      selectEl.appendChild(opt);
    });
  }

  function formatNumber(n, decimals = 2) {
    const num = Number(n) || 0;
    return num.toLocaleString('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  const SEMAFORO_INFO = {
    verde: { icon: '🟢', label: 'Cumple meta', className: 'badge--verde' },
    amarillo: { icon: '🟡', label: 'Cerca de la meta', className: 'badge--amarillo' },
    rojo: { icon: '🔴', label: 'Bajo rendimiento', className: 'badge--rojo' },
    gris: { icon: '⚪', label: 'Sin meta definida', className: 'badge--gris' }
  };

  function semaforoBadge(semaforo) {
    const info = SEMAFORO_INFO[semaforo] || SEMAFORO_INFO.gris;
    return `<span class="badge-semaforo ${info.className}">${info.icon} ${info.label}</span>`;
  }

  /**
   * Comprime/redimensiona una imagen en el navegador antes de enviarla
   * al backend, para evitar registros pesados y lentitud del sistema.
   */
  function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = {}) {
    return new Promise((resolve, reject) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        reject(new Error('Formato no permitido. Use JPG, JPEG, PNG o WEBP.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
      reader.readAsDataURL(file);
    });
  }

  return {
    showScreen, toast, setLoading, showOverlayLoader, hideOverlayLoader,
    isoToDisplay, todayIso, fillSelect, formatNumber, semaforoBadge, compressImage
  };
})();
