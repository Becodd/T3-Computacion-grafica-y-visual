// Interfaz (HTML): municion del arma seleccionada, objetivo, mensajes, marcador de impacto y pantallas finales
export function createHud() {
  const $ = (id) => document.getElementById(id);
  let toastT = 0;
  const api = {
    updateWeapons(states, index) {                                  // RF02: muestra la municion del arma SELECCIONADA
      const w = states[index];
      $('weaponName').textContent = w.nombre; $('ammoNow').textContent = w.ammo; $('ammoNow').classList.toggle('zero', w.ammo === 0);
      $('weaponList').innerHTML = states.map((s, i) => `<span class="${i === index ? 'sel' : ''}">[${i + 1}] ${s.nombre}: ${s.ammo}</span>`).join('');
    },
    setObjective(dist, kills, total, active) { $('objective').textContent = `Extracción: ${Math.round(dist)} m · Zombis abatidos: ${kills}/${total} · Persiguiéndote: ${active}`; },
    toast(text, bad = false) { const t = $('toast'); t.textContent = text; t.className = 'show' + (bad ? ' bad' : ''); toastT = performance.now() + 2200; setTimeout(() => { if (performance.now() >= toastT) t.className = ''; }, 2300); },
    hitMarker(killed) { const h = $('hitmarker'); h.className = 'on' + (killed ? ' kill' : ''); setTimeout(() => { h.className = ''; }, 140); },
    emptyFlash() { const a = $('ammoBox'); a.classList.add('flash'); setTimeout(() => a.classList.remove('flash'), 200); api.toast('SIN MUNICIÓN: busca cajas de munición', true); },
    overlay(title, text, hint, cls = '') { const o = $('overlay'); o.className = 'show ' + cls; $('ovTitle').textContent = title; $('ovText').textContent = text; $('ovHint').textContent = hint; },
    hideOverlay() { $('overlay').className = ''; },
  };
  return api;
}
