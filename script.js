mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsb3ciLCJhIjoiY21haDJ0YmgzMDdhczJxcTB0OHc1YXJoNyJ9.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-71.1, 42.35],
  zoom: 12
});

// Variable to store the current connection line
let currentConnectionLine = null;

map.on('load', () => {
  map.addSource('route66', {
    type: 'geojson',
    data: 'data/route66.geojson'
  });

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route66',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#ff5733',
      'line-width': 4
    }
  });
  
  // Add a source for the connection line
  map.addSource('connection-line', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[-71.1, 42.35], [-71.1, 42.35]]
      }
    }
  });
  
  // Add a layer for the connection line
  map.addLayer({
    id: 'connection',
    type: 'line',
    source: 'connection-line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#4287f5',
      'line-width': 2,
      'line-dasharray': [2, 1]
    }
  });
});

// Function to update the connection line
function updateConnectionLine(lngLat, elementPosition) {
  if (!map.getSource('connection-line')) return;
  
  // Calculate screen coordinates for the map point
  const mapPoint = map.project([lngLat.lng, lngLat.lat]);
  
  // Update the connection line data
  map.getSource('connection-line').setData({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [lngLat.lng, lngLat.lat],
        [lngLat.lng + (elementPosition.x - mapPoint.x) / 50000, lngLat.lat + (elementPosition.y - mapPoint.y) / 50000]
      ]
    }
  });
}

// Store the original photo order from CSV
let photoData = [];
// Store the customized order (can be modified)
let customOrder = [];

Papa.parse('data/img_coords.csv', {
  download: true,
  header: true,
  complete: function(results) {
    photoData = results.data;
    
    // Initialize custom order (can be modified to change scroll order)
    customOrder = [...Array(photoData.length).keys()];
    
    const container = document.getElementById('graphic');
    
    // Populate the steps based on custom order
    populateSteps(container, customOrder);

    // Initialize scrollama after adding steps
    initScrollama();
  }
});

// Function to populate steps based on custom order
function populateSteps(container, orderArray) {
  // Clear existing steps
  container.innerHTML = '';
  
  // Add steps in the specified order
  orderArray.forEach(index => {
    if (photoData[index]) {
      const row = photoData[index];
      
      const step = document.createElement('div');
      step.className = 'step';
      step.setAttribute('data-lat', row.latitude);
      step.setAttribute('data-lng', row.longitude);
      step.setAttribute('data-img', `assets/img/${row.filename.trim()}`);

      const title = document.createElement('h2');
      title.textContent = row.filename;
      step.appendChild(title);

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
    const lat = +element.getAttribute('data-lat');
    const lng = +element.getAttribute('data-lng');
    const imgSrc = element.getAttribute('data-img');

    map.flyTo({ center: [lng, lat], zoom: 14 });

    if (!element.querySelector('img')) {
      const img = document.createElement('img');
      img.src = imgSrc;
      element.appendChild(img);

      const cap = document.createElement('div');
      cap.className = 'caption';
      cap.textContent = imgSrc.split('/').pop().replace(/\.jpg|\.JPG/, '');
      element.appendChild(cap);
    }
    
    // Calculate the position of the element for the connection line
    const rect = element.getBoundingClientRect();
    const elementCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    // Update the connection line
    updateConnectionLine({lng, lat}, elementCenter);
  });
}

// Add an event listener to update connection line on scroll
window.addEventListener('scroll', () => {
  const activeStep = document.querySelector('.step.is-active');
  if (activeStep) {
    const lat = +activeStep.getAttribute('data-lat');
    const lng = +activeStep.getAttribute('data-lng');
    const rect = activeStep.getBoundingClientRect();
    const elementCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    updateConnectionLine({lng, lat}, elementCenter);
  }
});

// Function to reorder photos (can be called from the console or UI)
function reorderPhotos(newOrder) {
  if (Array.isArray(newOrder) && newOrder.length === customOrder.length) {
    customOrder = newOrder;
    populateSteps(document.getElementById('graphic'), customOrder);
    initScrollama();
  }
}
