/**
 * avances.js — "Mis Labores" (filtros), "Continuar Avance" y "Ver Resumen"
 * del Sistema Producción.
 */

const Avances = (() => {
  let todasLasLabores = [];
  let laborSeleccionada = null;
  let compressedImage = null;
  let searchDebounce;

  function init() {
    document.getElementById('buscar-labor').addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(aplicarFiltros, 250);
    });
    document.getElementById('filtro-labor').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-jefe').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-sector').addEventListener('change', aplicarFiltros);
    document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);

    document.getElementById('ca-jornales').addEventListener('input', recalcRatiosAvance);
    document.getElementById('ca-hectareas').addEventListener('input', recalcRatiosAvance);
    document.getElementById('ca-mapa').addEventListener('change', handleImageSelect);
    document.getElementById('form-continuar-avance').addEventListener('submit', handleSubmitAvance);
    document.getElementById('ca-cancelar').addEventListener('click', () => UI.showScreen('screen-mis-labores'));

    document.getElementById('btn-volver-resumen').addEventListener('click', () => UI.showScreen('screen-mis-labores'));
    document.getElementById('btn-capturar-resumen').addEventListener('click', capturarResumen);
    document.getElementById('btn-ampliar-ultimo').addEventListener('click', () => {
      const url = document.getElementById('rs-ultimo-mapa-img').src;
      if (url) openLightbox(url);
    });

    document.getElementById('lightbox').addEventListener('click', closeLightbox);
  }

  // ---------------------------------------------------------------------
  // MIS LABORES
  // ---------------------------------------------------------------------

  function setLabores(labores) {
    todasLasLabores = labores;
    renderFiltrosDropdowns();
    renderTarjetas(labores);
  }

  function renderFiltrosDropdowns() {
    const labores = [...new Set(todasLasLabores.map(l => l.labor))].sort();
    const jefes = [...new Set(todasLasLabores.map(l => l.jefe))].sort();
    const sectores = [...new Set(todasLasLabores.map(l => l.sector))].sort();

    const selLabor = document.getElementById('filtro-labor');
    const selJefe = document.getElementById('filtro-jefe');
    const selSector = document.getElementById('filtro-sector');
    const prevLabor = selLabor.value, prevJefe = selJefe.value, prevSector = selSector.value;

    UI.fillSelect(selLabor, labores.map(l => ({ v: l, l })), { valueKey: 'v', labelKey: 'l', placeholder: 'Todas las labores' });
    UI.fillSelect(selJefe, jefes.map(j => ({ v: j, l: j })), { valueKey: 'v', labelKey: 'l', placeholder: 'Todos los jefes' });
    UI.fillSelect(selSector, sectores.map(s => ({ v: s, l: s })), { valueKey: 'v', labelKey: 'l', placeholder: 'Todos los sectores' });

    selLabor.value = prevLabor; selJefe.value = prevJefe; selSector.value = prevSector;
  }

  function aplicarFiltros() {
    const q = document.getElementById('buscar-labor').value.trim().toLowerCase();
    const labor = document.getElementById('filtro-labor').value;
    const jefe = document.getElementById('filtro-jefe').value;
    const sector = document.getElementById('filtro-sector').value;

    const filtradas = todasLasLabores.filter(l => {
      const matchQ = !q ||
        l.labor.toLowerCase().includes(q) ||
        l.sector.toLowerCase().includes(q) ||
        (l.jefe || '').toLowerCase().includes(q);
      const matchLabor = !labor || l.labor === labor;
      const matchJefe = !jefe || l.jefe === jefe;
      const matchSector = !sector || l.sector === sector;
      return matchQ && matchLabor && matchJefe && matchSector;
    });
    renderTarjetas(filtradas);
  }

  function limpiarFiltros() {
    document.getElementById('buscar-labor').value = '';
    document.getElementById('filtro-labor').value = '';
    document.getElementById('filtro-jefe').value = '';
    document.getElementById('filtro-sector').value = '';
    renderTarjetas(todasLasLabores);
  }

  function renderTarjetas(labores) {
    const cont = document.getElementById('lista-labores');
    const vacio = document.getElementById('mis-labores-vacio');

    if (!labores.length) { cont.innerHTML = ''; vacio.classList.remove('hidden'); return; }
    vacio.classList.add('hidden');

    cont.innerHTML = labores.map(l => `
      <article class="card-labor">
        <span class="card-labor__sector-tag">${escapeHtml(l.sector)}</span>
        <div class="card-labor__header">
          <h3>${escapeHtml(l.labor)}</h3>
          <span class="badge badge--${estadoClass(l.estado)}">${escapeHtml(l.estado)}</span>
        </div>
        <p class="card-labor__meta">Jefe: ${escapeHtml(l.jefe)} · Sector: ${escapeHtml(l.sector)}</p>
        <p class="card-labor__meta">Inicio: ${escapeHtml(l.fecha_inicio)}</p>
        <div class="card-labor__stats">
          <div><strong>${l.cantidad_avances}</strong><span>avances</span></div>
          <div><strong>${UI.formatNumber(l.jornales_totales, 0)}</strong><span>Jornales</span></div>
          <div><strong>${UI.formatNumber(l.hectareas_totales)}</strong><span>Ha</span></div>
          <div><strong>${UI.formatNumber(l.jr_ha_consolidado)}</strong><span>Jr/Ha</span></div>
          <div><strong>${UI.formatNumber(l.ha_jr_consolidado)}</strong><span>Ha/Jr</span></div>
        </div>
        <div class="card-labor__semaforo">${UI.semaforoBadge(l.semaforo_consolidado)} <small>meta: ${UI.formatNumber(l.meta_ha_jr)} Ha/Jr</small></div>
        <div class="card-labor__actions">
          <button class="btn btn--secondary" data-action="resumen" data-id="${l.id_labor}">Ver resumen</button>
          <button class="btn btn--primary" data-action="continuar" data-id="${l.id_labor}">Continuar avance</button>
        </div>
      </article>
    `).join('');

    cont.querySelectorAll('button[data-action="resumen"]').forEach(btn =>
      btn.addEventListener('click', () => abrirResumen(btn.dataset.id)));
    cont.querySelectorAll('button[data-action="continuar"]').forEach(btn =>
      btn.addEventListener('click', () => abrirContinuarAvance(btn.dataset.id)));
  }

  function estadoClass(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('proceso')) return 'progress';
    if (e.includes('final') || e.includes('complet')) return 'done';
    return 'default';
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // ---------------------------------------------------------------------
  // CONTINUAR AVANCE
  // ---------------------------------------------------------------------

  async function abrirContinuarAvance(idLabor) {
    UI.showOverlayLoader('Cargando labor...');
    try {
      const data = await Api.getLaborById(idLabor);
      laborSeleccionada = data;
      compressedImage = null;

      document.getElementById('ca-labor-nombre').textContent = data.labor;
      document.getElementById('ca-sector').textContent = data.sector;
      document.getElementById('ca-jefe').textContent = data.jefe;
      document.getElementById('ca-id-labor').textContent = data.id_labor;

      document.getElementById('form-continuar-avance').reset();
      document.getElementById('ca-fecha').value = UI.todayIso();
      document.getElementById('ca-fecha').max = UI.todayIso();
      document.getElementById('ca-preview').innerHTML = '';
      document.getElementById('ca-jrha').value = '';
      document.getElementById('ca-hajr').value = '';

      UI.showScreen('screen-continuar-avance');
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      UI.hideOverlayLoader();
    }
  }

  function recalcRatiosAvance() {
    const jornales = Number(document.getElementById('ca-jornales').value) || 0;
    const hectareas = Number(document.getElementById('ca-hectareas').value) || 0;
    document.getElementById('ca-jrha').value = hectareas > 0 ? (jornales / hectareas).toFixed(2) : '';
    document.getElementById('ca-hajr').value = jornales > 0 ? (hectareas / jornales).toFixed(2) : '';
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('ca-preview');
    if (!file) { preview.innerHTML = ''; compressedImage = null; return; }
    try {
      preview.innerHTML = '<p class="hint">Procesando imagen...</p>';
      compressedImage = await UI.compressImage(file);
      preview.innerHTML = `<img src="${compressedImage}" alt="Vista previa del mapa" class="preview-img">`;
    } catch (err) {
      UI.toast(err.message, 'error');
      e.target.value = '';
      preview.innerHTML = '';
      compressedImage = null;
    }
  }

  async function handleSubmitAvance(e) {
    e.preventDefault();
    const fecha = document.getElementById('ca-fecha').value;
    const jornales = Number(document.getElementById('ca-jornales').value);
    const hectareas = Number(document.getElementById('ca-hectareas').value);

    if (!fecha) return UI.toast('Debe indicar la fecha del nuevo avance.', 'error');
    if (!jornales || jornales <= 0) return UI.toast('Los jornales deben ser mayores que 0.', 'error');
    if (!hectareas || hectareas <= 0) return UI.toast('Las hectáreas deben ser mayores que 0.', 'error');
    if (!compressedImage) return UI.toast('Debe subir el nuevo mapa de avance.', 'error');
    if (!laborSeleccionada) return UI.toast('No se ha seleccionado una labor válida.', 'error');

    const btn = document.getElementById('ca-guardar');
    UI.setLoading(btn, true, 'Guardando avance...');

    try {
      const result = await Api.createAdvance({
        id_labor: laborSeleccionada.id_labor,
        fecha: UI.isoToDisplay(fecha),
        jornales, hectareas,
        observacion: document.getElementById('ca-observacion').value.trim(),
        imagenBase64: compressedImage
      });
      UI.toast(`Avance ${result.id_avance} registrado. Los avances anteriores se mantienen intactos.`, 'success');
      await App.refreshLabores();
      await abrirResumen(laborSeleccionada.id_labor);
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  // ---------------------------------------------------------------------
  // VER RESUMEN
  // ---------------------------------------------------------------------

  async function abrirResumen(idLabor) {
    UI.showOverlayLoader('Cargando resumen...');
    try {
      const data = await Api.getLaborById(idLabor);
      renderResumen(data);
      UI.showScreen('screen-resumen');
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      UI.hideOverlayLoader();
    }
  }

  function renderResumen(data) {
    document.getElementById('rs-labor').textContent = data.labor;
    document.getElementById('rs-sector').textContent = data.sector;
    document.getElementById('rs-jefe').textContent = data.jefe;
    document.getElementById('rs-fecha-inicio').textContent = data.fecha_inicio;
    document.getElementById('rs-estado').textContent = data.estado;
    document.getElementById('rs-id-labor').textContent = data.id_labor;

    const tbody = document.getElementById('rs-tabla-avances');
    tbody.innerHTML = data.avances.map(a => `
      <tr>
        <td>${String(a.numero).padStart(2, '0')}</td>
        <td>${escapeHtml(a.fecha)}</td>
        <td>${UI.formatNumber(a.jornales, 0)}</td>
        <td>${UI.formatNumber(a.hectareas)}</td>
        <td>${UI.formatNumber(a.jr_ha)}</td>
        <td>${UI.formatNumber(a.ha_jr)}</td>
        <td>${UI.semaforoBadge(a.semaforo)}</td>
        <td>${escapeHtml(a.observacion) || '—'}</td>
        <td><a href="${a.url_mapa}" target="_blank" rel="noopener" class="link-mapa">Ver mapa</a></td>
      </tr>
    `).join('');

    const mapas = document.getElementById('rs-mapas');
    mapas.innerHTML = data.avances.map(a => `
      <figure class="mapa-card">
        <img src="${a.url_mapa}" alt="Mapa del avance ${a.numero} — ${escapeHtml(a.fecha)}" loading="lazy" class="mapa-card__img">
        <figcaption>
          <span>${escapeHtml(a.fecha)}</span>
          <button class="btn btn--ghost btn--sm" data-ampliar="${a.url_mapa}">Ampliar</button>
        </figcaption>
      </figure>
    `).join('');
    mapas.querySelectorAll('[data-ampliar]').forEach(btn =>
      btn.addEventListener('click', () => openLightbox(btn.dataset.ampliar)));

    // --- Vista rápida: último mapa subido + consolidado compacto ---
    const ultimo = data.avances[data.avances.length - 1];
    if (ultimo) {
      document.getElementById('rs-ultimo-mapa-img').src = ultimo.url_mapa;
      document.getElementById('rs-ultimo-mapa-fecha').textContent = `Último mapa subido — ${ultimo.fecha}`;
    }

    const c = data.consolidado;
    document.getElementById('rs-cons-jornales').textContent = UI.formatNumber(c.jornales_totales, 0);
    document.getElementById('rs-cons-hectareas').textContent = UI.formatNumber(c.hectareas_totales);
    document.getElementById('rs-cons-jrha').textContent = UI.formatNumber(c.jr_ha_consolidado);
    document.getElementById('rs-cons-hajr').textContent = UI.formatNumber(c.ha_jr_consolidado);
    document.getElementById('rs-cons-avances').textContent = c.cantidad_avances;
    document.getElementById('rs-cons-semaforo').innerHTML = UI.semaforoBadge(c.semaforo);
    document.getElementById('rs-cons-meta').textContent = `Meta del sector: ${UI.formatNumber(c.meta_ha_jr)} Ha/Jr`;

    // Copia compacta en la vista rápida
    document.getElementById('rs-cons-jornales-vr').textContent = UI.formatNumber(c.jornales_totales, 0);
    document.getElementById('rs-cons-hectareas-vr').textContent = UI.formatNumber(c.hectareas_totales);
    document.getElementById('rs-cons-jrha-vr').textContent = UI.formatNumber(c.jr_ha_consolidado);
    document.getElementById('rs-cons-hajr-vr').textContent = UI.formatNumber(c.ha_jr_consolidado);
    document.getElementById('rs-cons-avances-vr').textContent = c.cantidad_avances;
    document.getElementById('rs-cons-semaforo-vr').innerHTML = UI.semaforoBadge(c.semaforo);
    document.getElementById('rs-cons-meta-vr').textContent = `Meta del sector: ${UI.formatNumber(c.meta_ha_jr)} Ha/Jr`;
  }

  /** Genera una imagen PNG del resumen completo y la descarga al dispositivo. */
  async function capturarResumen() {
    const btn = document.getElementById('btn-capturar-resumen');
    if (typeof html2canvas === 'undefined') {
      UI.toast('No se pudo cargar el generador de imágenes. Revise su conexión.', 'error');
      return;
    }
    UI.setLoading(btn, true, 'Generando imagen...');
    try {
      const el = document.getElementById('resumen-capturable');
      const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const link = document.createElement('a');
      const idLabor = document.getElementById('rs-id-labor').textContent || 'labor';
      link.download = `resumen_${idLabor}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      UI.toast('Imagen del resumen descargada.', 'success');
    } catch (err) {
      UI.toast('No se pudo generar la imagen: ' + err.message, 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  function openLightbox(url) {
    const lb = document.getElementById('lightbox');
    lb.querySelector('img').src = url;
    lb.classList.add('lightbox--visible');
  }
  function closeLightbox() { document.getElementById('lightbox').classList.remove('lightbox--visible'); }

  return { init, setLabores, abrirResumen, abrirContinuarAvance };
})();
