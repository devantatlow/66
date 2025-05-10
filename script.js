mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsb3ciLCJhIjoiY21haDJ0YmgzMDdhczJxcTB0OHc1YXJoNyJ9.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-71.1, 42.35],
  zoom: 12
});

// Create a marker element for the point
const pointMarker = document.createElement('div');
pointMarker.className = 'point-marker';
const marker = new mapboxgl.Marker(pointMarker);

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
  
  // Load the image data
  loadImageData();
});

function loadImageData() {
  Papa.parse('data/img_coords.csv', {
    download: true,
    header: true,
    complete: function(results) {
      // Include all rows with latitude and longitude
      photoData = results.data.filter(row => row.latitude && row.longitude);
      
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
      
      // Set latitude and longitude attributes for all steps
      if (row.latitude && row.longitude) {
        step.setAttribute('data-lat', row.latitude);
        step.setAttribute('data-lng', row.longitude);
      }
      
      // Determine if this is a text-only entry or a photo entry
      const isTextOnly = !row.filename || row.filename.trim() === '';
      
      if (!isTextOnly) {
        step.classList.add('photo-step');
      } else {
        step.classList.add('text-step');
      }
      
      // Add title if available
      if (row.title && row.title.trim() !== '') {
        const title = document.createElement('h2');
        title.textContent = row.title;
        step.appendChild(title);
      } else if (!isTextOnly) {
        // Use formatted filename as fallback for photos
        const title = document.createElement('h2');
        title.textContent = row.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        step.appendChild(title);
      }

      // Add the image only for photo entries
      if (!isTextOnly && row.filename.match(/\.(jpe?g|png|gif)$/i)) {
        const img = document.createElement('img');
        img.src = `assets/img/${row.filename.trim()}`;
        img.loading = 'lazy'; // Lazy load images for better performance
        step.appendChild(img);
      }

      // Add caption if available
      if (row.caption && row.caption.trim() !== '') {
        const cap = document.createElement('div');
        cap.className = 'caption';
        cap.textContent = row.caption;
        step.appendChild(cap);
      }

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
    
    // Show the point marker
    marker.setLngLat({lng, lat}).addTo(map);
  });
}

// Function to reorder photos (can be called from the console or UI)
function reorderPhotos(newOrder) {
  if (Array.isArray(newOrder) && newOrder.length === customOrder.length) {
    customOrder = newOrder;
    populateSteps(document.getElementById('graphic'), customOrder);
    initScrollama();
  }
}
