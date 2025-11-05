// --- Инициализация карты ---
const map = L.map('map').setView([55.751244, 37.618423], 10);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
osm.addTo(map);

let userLayer; // слой для пользовательских GeoJSON

// Утилиты сообщений
function clearMsg(){ document.getElementById('msg').textContent=''; }
function showMsg(t){ document.getElementById('msg').textContent=t; }

// Простейшая проверка GeoJSON
function isGeoJSON(obj){
  if(!obj) return false;
  const t = obj.type;
  return t === 'FeatureCollection' || t === 'Feature' || (
    t === 'Point' || t === 'MultiPoint' || t === 'LineString' ||
    t === 'MultiLineString' || t === 'Polygon' ||
    t === 'MultiPolygon' || t === 'GeometryCollection'
  );
}

// Отрисовка GeoJSON
function drawGeoJSON(data){
  try {
    if(userLayer) map.removeLayer(userLayer);
    userLayer = L.geoJSON(data, {
      style: { color: '#1976d2', weight: 2 },
      pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 5 })
    }).addTo(map);
    const b = userLayer.getBounds();
    if(b.isValid()) map.fitBounds(b, { padding: [20,20] });
    clearMsg();
  } catch (e) {
    showMsg('Не удалось отрисовать: ' + e.message);
  }
}

// Обработчики UI
document.getElementById('btn-text').addEventListener('click', () => {
  try {
    const raw = document.getElementById('gj-text').value.trim();
    const obj = JSON.parse(raw);
    if(!isGeoJSON(obj)) return showMsg('Это не похоже на GeoJSON.');
    drawGeoJSON(obj);
  } catch(e) { showMsg('Ошибка парсинга JSON: ' + e.message); }
});

document.getElementById('gj-file').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if(!f) return;
  try {
    const text = await f.text();
    const obj = JSON.parse(text);
    if(!isGeoJSON(obj)) return showMsg('Файл не GeoJSON.');
    drawGeoJSON(obj);
  } catch(e){ showMsg('Ошибка чтения файла: ' + e.message); }
});

document.getElementById('btn-url').addEventListener('click', async () => {
  const url = document.getElementById('gj-url').value.trim();
  if(!url) return;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/geo+json, application/json' } });
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const obj = await res.json();
    if(!isGeoJSON(obj)) return showMsg('Ответ по URL не GeoJSON.');
    drawGeoJSON(obj);
  } catch(e){ showMsg('Ошибка загрузки по URL: ' + e.message + '\nВозможна проблема CORS на стороне хоста.'); }
});

// Drag&Drop файла прямо на карту
map.getContainer().addEventListener('dragover', (e)=>{ e.preventDefault(); });
map.getContainer().addEventListener('drop', async (e)=>{
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if(!f) return;
  try {
    const text = await f.text();
    const obj = JSON.parse(text);
    if(!isGeoJSON(obj)) return showMsg('Файл не GeoJSON.');
    drawGeoJSON(obj);
  } catch(e){ showMsg('Ошибка чтения файла: ' + e.message); }
});



// --- Кнопка сворачивания панели под +/− ---
const panelEl = document.querySelector('.control-panel');

// Кастомный контрол Leaflet
const TogglePanelControl = L.Control.extend({
  options: {
    position: 'topleft' // 'topleft' чтобы кнопка стала сразу под +/−; используй 'topright', если панель справа
  },
  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-control toggle-panel');

    const btn = L.DomUtil.create('a', '', container);
    btn.href = '#';
    btn.title = 'Свернуть/развернуть панель';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Toggle panel');

    // Иконка/текст кнопки
 
    function setIcon() {
      btn.textContent = panelEl?.classList.contains('collapsed') ? '☰' : '×';
      // ☰ — панель скрыта (гамбургер), × — панель видна
      btn.setAttribute('aria-expanded', panelEl?.classList.contains('collapsed') ? 'false' : 'true');
    }

    function togglePanel(e) {
      if (e) e.preventDefault();
      if (!panelEl) return;
      panelEl.classList.toggle('collapsed');
      setIcon();
    }

    // Блокируем прокрутку/зум карты при клике/скролле по контролу
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    // События
    btn.addEventListener('click', togglePanel);
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'h' || ev.key === ' ') {
        togglePanel(ev);
      }
    });

    // Инициализируем иконку
    setIcon();

    // (опционально) восстановление состояния из localStorage
    try {
      const saved = localStorage.getItem('panelCollapsed');
      if (saved === '1') panelEl.classList.add('collapsed');
      setIcon();
    } catch {}

    // (опционально) сохраняем состояние при изменении
    const observer = new MutationObserver(() => {
      try {
        localStorage.setItem('panelCollapsed', panelEl.classList.contains('collapsed') ? '1' : '0');
      } catch {}
    });
    observer.observe(panelEl, { attributes: true, attributeFilter: ['class'] });

    return container;
  }
});

// Добавляем контрол на карту
map.addControl(new TogglePanelControl());
