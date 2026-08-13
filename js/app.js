/**
 * app.js — Orquestador principal del Sistema Producción.
 */

const App = (() => {

  async function init() {
    wireNav();
    Avances.init();

    if (!CONFIG.API_URL || CONFIG.API_URL.includes('PEGA_AQUI')) {
      UI.toast('Configure la URL de la API en js/api.js (CONFIG.API_URL).', 'error');
      return;
    }

    UI.showOverlayLoader('Cargando sistema...');
    try {
      await cargarListasMaestras();
      await refreshLabores();
    } catch (err) {
      UI.toast('No se pudo conectar con el servidor: ' + err.message, 'error');
    } finally {
      UI.hideOverlayLoader();
    }
  }

  function wireNav() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => UI.showScreen(el.dataset.nav));
    });
    document.getElementById('btn-ir-registrar').addEventListener('click', () => {
      LaborForm.resetForm();
      UI.showScreen('screen-registrar-labor');
    });
    document.getElementById('btn-ir-mis-labores').addEventListener('click', async () => {
      UI.showScreen('screen-mis-labores');
      await refreshLabores();
    });
  }

  async function cargarListasMaestras() {
    const [sectores, tiposLabor] = await Promise.all([
      Api.getSectores(),
      Api.getTiposLabor()
    ]);

    LaborForm.init(sectores);

    UI.fillSelect(document.getElementById('nl-sector'), sectores,
      { valueKey: 'sector', labelKey: 'sector', placeholder: 'Seleccione un sector' });
    UI.fillSelect(document.getElementById('nl-labor'), tiposLabor,
      { valueKey: 'labor', labelKey: 'labor', placeholder: 'Seleccione una labor' });
  }

  async function refreshLabores() {
    try {
      const labores = await Api.getLabores({});
      Avances.setLabores(labores);
    } catch (err) {
      UI.toast('No se pudieron cargar las labores: ' + err.message, 'error');
    }
  }

  return { init, refreshLabores };
})();

document.addEventListener('DOMContentLoaded', App.init);
