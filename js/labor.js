/**
 * labor.js — Pantalla "Registrar Labor" del Sistema Producción.
 */

const LaborForm = (() => {
  let compressedImage = null;
  let sectoresCache = [];

  function init(sectores) {
    sectoresCache = sectores || [];
    const form = document.getElementById('form-nueva-labor');
    if (!form) return;

    document.getElementById('nl-fecha').value = UI.todayIso();
    document.getElementById('nl-fecha').max = UI.todayIso();

    document.getElementById('nl-sector').addEventListener('change', autoCompletarJefe);
    document.getElementById('nl-jornales').addEventListener('input', recalcRatios);
    document.getElementById('nl-hectareas').addEventListener('input', recalcRatios);
    document.getElementById('nl-mapa').addEventListener('change', handleImageSelect);

    form.addEventListener('submit', handleSubmit);
    document.getElementById('nl-cancelar').addEventListener('click', () => {
      resetForm();
      UI.showScreen('screen-inicio');
    });
  }

  function setSectores(sectores) { sectoresCache = sectores; }

  function autoCompletarJefe() {
    const sectorId = document.getElementById('nl-sector').value;
    const sector = sectoresCache.find(s => s.sector === sectorId);
    document.getElementById('nl-jefe').value = sector ? sector.jefe : '';
    document.getElementById('nl-meta').value = sector ? `${sector.meta_ha_jr.toFixed(2)} Ha/Jr` : '';
  }

  function recalcRatios() {
    const jornales = Number(document.getElementById('nl-jornales').value) || 0;
    const hectareas = Number(document.getElementById('nl-hectareas').value) || 0;
    document.getElementById('nl-jrha').value = hectareas > 0 ? (jornales / hectareas).toFixed(2) : '';
    document.getElementById('nl-hajr').value = jornales > 0 ? (hectareas / jornales).toFixed(2) : '';
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('nl-preview');
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

  function resetForm() {
    document.getElementById('form-nueva-labor').reset();
    document.getElementById('nl-preview').innerHTML = '';
    document.getElementById('nl-fecha').value = UI.todayIso();
    document.getElementById('nl-jefe').value = '';
    document.getElementById('nl-meta').value = '';
    compressedImage = null;
  }

  function validate() {
    const fecha = document.getElementById('nl-fecha').value;
    const sector = document.getElementById('nl-sector').value;
    const labor = document.getElementById('nl-labor').value;
    const jornales = Number(document.getElementById('nl-jornales').value);
    const hectareas = Number(document.getElementById('nl-hectareas').value);

    if (!fecha) return 'Debe indicar la fecha del avance.';
    if (!sector) return 'Debe seleccionar un sector.';
    if (!labor) return 'Debe seleccionar una labor.';
    if (!jornales || jornales <= 0) return 'Los jornales deben ser mayores que 0.';
    if (!hectareas || hectareas <= 0) return 'Las hectáreas deben ser mayores que 0.';
    if (!compressedImage) return 'Debe subir el mapa de avance.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const error = validate();
    if (error) { UI.toast(error, 'error'); return; }

    const btn = document.getElementById('nl-guardar');
    UI.setLoading(btn, true, 'Guardando labor...');

    const payload = {
      fecha: UI.isoToDisplay(document.getElementById('nl-fecha').value),
      sector: document.getElementById('nl-sector').value,
      labor: document.getElementById('nl-labor').value,
      jornales: Number(document.getElementById('nl-jornales').value),
      hectareas: Number(document.getElementById('nl-hectareas').value),
      observacion: document.getElementById('nl-observacion').value.trim(),
      imagenBase64: compressedImage,
      usuario: 'web'
    };

    try {
      const result = await Api.createLabor(payload);
      UI.toast(`Labor ${result.id_labor} registrada. ${UI.semaforoBadge(result.semaforo).replace(/<[^>]+>/g, '')}`, 'success');
      resetForm();
      await App.refreshLabores();
      UI.showScreen('screen-mis-labores');
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  return { init, resetForm, setSectores };
})();
