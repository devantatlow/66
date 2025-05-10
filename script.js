mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsb3ciLCJhIjoiY21haDJ0YmgzMDdhczJxcTB0OHc1YXJoNyJ9.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-71.1, 42.35],
  zoom: 12
});

// Create a marker element for the connection point
const connectionMarker = document.createElement('div');
connectionMarker.className = 'connection-marker';
const marker = new mapboxgl.Marker(connectionMarker);

// Store the original photo order from CSV
let photoData = [];
// Store the customized order (can be modified)
let customOrder = [];
// Store active photo element
let activeElement = null;

map.on('load', () => {
  // Add the route data source
  map.addSource('route66', {
    type: 'geojson',
    data: 'data/route66.geojson'
  });

  // Add the route line
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
  
  // Add the connection line layer
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

  // Load the image data
  loadImageData();
});

// Function to update the connection line between map point and photo
function updateConnectionLine(lngLat) {
  if (!map.getSource('connection-line') || !activeElement) return;

  // Get the bounding box of the map container
  const mapBounds = map.getContainer().getBoundingClientRect();
  
  // Get the bounding box of the active element
  const elementBounds = activeElement.getBoundingClientRect();
  
  // Calculate the element's center position relative to the viewport
  const elementCenter = {
    x: elementBounds.left + elementBounds.width / 2,
    y: elementBounds.top + elementBounds.height / 2
  };
  
  // Convert the map coordinates to pixel coordinates
  const mapPoint = map.project(lngLat);
  
  // Convert pixel distance to geographic distance (approximate)
  // This is a simplified approach - we're creating an offset that will work visually
  const pixelToGeoFactor = 0.00001; // This factor may need adjustment based on zoom level
  
  // Calculate an end point that's in the direction of the element
  const dx = elementCenter.x - (mapBounds.left + mapPoint.x);
  const dy = elementCenter.y - (mapBounds.top + mapPoint.y);
  
  // Set a maximum length for the connection line to avoid extreme stretching
  const maxLength = Math.min(Math.sqrt(dx*dx + dy*dy), 300);
  const scale = maxLength / Math.sqrt(dx*dx + dy*dy);
  
  // Calculate the end point for the line
  const endLng = lngLat.lng + dx * pixelToGeoFactor * scale;
  const endLat = lngLat.lat - dy * pixelToGeoFactor * scale; // Subtract because Y is inverted
  
  // Update the connection line
  map.getSource('connection-line').setData({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [lngLat.lng, lngLat.lat],
        [endLng, endLat]
      ]
    }
  });
  
  // Show the connection marker
  marker.setLngLat(lngLat).addTo(map);
}

function loadImageData() {
  Papa.parse('data/img_coords.csv', {
    download: true,
    header: true,
    complete: function(results) {
      photoData = results.data.filter(row => row.latitude && row.longitude); // Filter out incomplete entries
      
      // Initialize custom order
      customOrder = [...Array(photoData.length).keys()];
      
      const container = document.getElementById('graphic');
      
      // Populate the steps based on custom order
      populateSteps(container, customOrder);

      // Initialize scrollama after adding steps
      initScrollama();
    }
  });
}

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
      title.textContent = row.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " "); // Remove extension and replace underscores
      step.appendChild(title);

      // Add the image immediately (preload all images)
      const img = document.createElement('img');
      img.src = `assets/img/${row.filename.trim()}`;
      img.loading = 'lazy'; // Lazy load images for better performance
      step.appendChild(img);

      // Add caption if needed
      const cap = document.createElement('div');
      cap.className = 'caption';
      cap.textContent = row.description || row.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      step.appendChild(cap);

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
    // Store the active element
    activeElement = element;
    
    // Get location data
    const lat = +element.getAttribute('data-lat');
    const lng = +element.getAttribute('data-lng');
    
    // Add active class to the current step
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('is-active');
    });
    element.classList.add('is-active');

    // Fly to the location
    map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
    
    // Update the connection line after the map movement completes
    setTimeout(() => {
      updateConnectionLine({lng, lat});
    }, 1000);
  });
}

// Update connection line on scroll and resize
window.addEventListener('scroll', () => {
  const activeStep = document.querySelector('.step.is-active');
  if (activeStep) {
    const lat = +activeStep.getAttribute('data-lat');
    const lng = +activeStep.getAttribute('data-lng');
    updateConnectionLine({lng, lat});
  }
});

window.addEventListener('resize', () => {
  const activeStep = document.querySelector('.step.is-active');
  if (activeStep) {
    const lat = +activeStep.getAttribute('data-lat');
    const lng = +activeStep.getAttribute('data-lng');
    updateConnectionLine({lng, lat});
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
