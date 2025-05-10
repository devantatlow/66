mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsbG93IiwiYSI6ImNtYWgydGJoMzA3YXMycXEwdDh3NWFyaDcifQ.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-71.1, 42.35],
  zoom: 12
});

// Create a simple blue-dot marker
const connectionMarker = document.createElement('div');
connectionMarker.className = 'connection-marker';
const marker = new mapboxgl.Marker(connectionMarker);

// Data stores
let photoData = [];
let customOrder = [];
let censusData = [];
let activeElement = null;
let activeTractId = null;

map.on('load', () => {
  // 1) Bus route
  map.addSource('route66', {
    type: 'geojson',
    data: 'data/route66.geojson'
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route66',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint:  { 'line-color': '#ff5733', 'line-width': 4 }
  });

  // 2) Census tracts (unchanged)
  map.addSource('census-tracts', {
    type: 'geojson',
    data: 'data/census_tracts.geojson'
  });
  map.addLayer({ /* fill layer */ });
  map.addLayer({ /* outline layer */ });

  // 3) Load CSV data
  loadImageData();
  loadCensusData();
});

function loadImageData() {
  Papa.parse('data/img_coords.csv', {
    download: true,
    header: true,
    complete: ({ data }) => {
      photoData = data.filter(r => r.latitude && r.longitude);
      customOrder = photoData.map((_, i) => i);
      populateSteps(document.getElementById('graphic'), customOrder);
      initScrollama();
    }
  });
}

function loadCensusData() {
  Papa.parse('data/census_data.csv', {
    download: true,
    header: true,
    complete: ({ data }) => {
      censusData = data.filter(r => r.tract_id);
      // (you can splice census steps into customOrder here)
    }
  });
}

function populateSteps(container, orderArray) {
  container.innerHTML = '';
  orderArray.forEach(idx => {
    if (idx < 0) {
      // census-step logic (unchanged)…
    } else {
      const row = photoData[idx];
      const step = document.createElement('div');
      step.className = 'step photo-step';
      step.setAttribute('data-lat', row.latitude);
      step.setAttribute('data-lng', row.longitude);
      step.innerHTML = `
        <h2>${row.title || row.filename.replace(/\.[^/.]+$/, '')}</h2>
        <img src="assets/img/${row.filename.trim()}" loading="lazy"/>
        <div class="caption">${row.caption || ''}</div>
      `;
      container.appendChild(step);
    }
  });
}

function initScrollama() {
  scrollama().setup({
    step: '.step',
    offset: 0.6,
    debug: false
  }).onStepEnter(({ element }) => {
    // mark active element
    activeElement = element;
    document.querySelectorAll('.step').forEach(el => el.classList.remove('is-active'));
    element.classList.add('is-active');

    if (element.classList.contains('census-step')) {
      // existing census-step flyTo/highlight logic…
    } else {
      // photo-step → fly & show blue dot
      const lat = +element.getAttribute('data-lat');
      const lng = +element.getAttribute('data-lng');
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
      marker.setLngLat([lng, lat]).addTo(map);
    }
  });
}

// No more updateConnectionLine(), no moveend or scroll listeners  
// The marker itself is your single blue dot.  
