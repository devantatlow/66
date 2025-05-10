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
      
      // Set latitude and longitude attributes for all steps
      if (row.latitude && row.longitude) {
        step.setAttribute('data-lat', row.latitude);
        step.setAttribute('data-lng', row.longitude);
      }
      
      // Add title - use 'title' field if available, otherwise use formatted filename
      const title = document.createElement('h2');
      title.textContent = row.title || row.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      step.appendChild(title);

      // Add the image only if it's a photo (not a text box)
      if (row.filename && !row.filename.includes('text_') && row.filename.match(/\.(jpe?g|png|gif)$/i)) {
        const img = document.createElement('img');
        img.src = `assets/img/${row.filename.trim()}`;
        img.loading = 'lazy'; // Lazy load images for better performance
        step.appendChild(img);
      }

      // Add caption - use 'caption' or 'description' field if available
      if (row.caption || row.description) {
        const cap = document.createElement('div');
        cap.className = 'caption';
        cap.textContent = row.caption || row.description || '';
        step.appendChild(cap);
      }

      // Add text content if available
      if (row.text) {
        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        textContent.innerHTML = row.text; // Use innerHTML to support basic HTML formatting
        step.appendChild(textContent);
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

// Add a new text box to the data
function addTextBox() {
  const title = document.getElementById('text-title').value;
  const content = document.getElementById('text-content').value;
  const lat = document.getElementById('text-lat').value;
  const lng = document.getElementById('text-lng').value;
  
  if (!title || !content || !lat || !lng) {
    alert('Please fill out all fields');
    return;
  }
  
  const textBox = {
    filename: `text_${Date.now()}.txt`,
    latitude: lat,
    longitude: lng,
    title: title,
    caption: '',
    text: content
  };
  
  photoData.push(textBox);
  customOrder.push(photoData.length - 1);
  
  // Refresh the content
  populateSteps(document.getElementById('graphic'), customOrder);
  initScrollama();
  
  // Close the modal
  document.getElementById('text-box-modal').style.display = 'none';
  
  // Reset form
  document.getElementById('text-box-form').reset();
}
