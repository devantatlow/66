mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsb3ciLCJhIjoiY21haDJ0YmgzMDdhczJxcTB0OHc1YXJoNyJ9.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-71.12, 42.35], // Adjusted center to show the entire route
  zoom: 12
});

// Create a marker element for the point
const pointMarker = document.createElement('div');
pointMarker.className = 'point-marker';
const marker = new mapboxgl.Marker(pointMarker);

// Store the photo data
let photoData = [];
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
      
      const container = document.getElementById('graphic');
      
      // Populate steps directly from CSV order
      populateSteps(container, photoData);

      // Initialize scrollama after adding steps
      initScrollama();
    }
  });
}

// Function to populate steps based on data
function populateSteps(container, data) {
  // Clear existing steps
  container.innerHTML = '';
  
  // Add steps in the order they appear in the CSV
  data.forEach(row => {
    if (row) {
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
      
      // Add title only if explicitly available and not empty
      if (row.title && row.title.trim() !== '') {
        const title = document.createElement('h2');
        title.textContent = row.title;
        step.appendChild(title);
      }
      // No else clause - if no title is specified, don't show any title

      // Add the image only for photo entries
      if (!isTextOnly && row.filename.match(/\.(jpe?g|png|gif)$/i)) {
        const img = document.createElement('img');
        img.src = `assets/img/${row.filename.trim()}`;
        img.loading = 'lazy'; // Lazy load images for better performance
        step.appendChild(img);
      }

      // Add caption if available with superscript formatting for citation references
      if (row.caption && row.caption.trim() !== '') {
        const cap = document.createElement('div');
        cap.className = 'caption';
        
        // Format text with citation numbers as superscripts
        // Look for patterns like [1], [2], etc. and replace with superscript tags
        const formattedText = row.caption.replace(/\[(\d+)\]/g, '<sup>[$1]</sup>');
        
        // Use innerHTML instead of textContent to interpret the HTML tags
        cap.innerHTML = formattedText;
  
        step.appendChild(cap);
      }  

      container.appendChild(step);
    }
  });
}

function initScrollama() {
  // Common function for zoom out behavior
  function zoomOutToFullRoute() {
    map.flyTo({ 
      center: [-71.12, 42.335], 
      zoom: 12, 
      duration: 2000,
      essential: true
    });
    
    // Remove the point marker from the map
    marker.remove();
    
    // Remove active class from all steps
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('is-active');
    });
  }

  // Add observer for the intro section
  const introObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        zoomOutToFullRoute();
      }
    });
  }, { threshold: 0.5 });
  
  // Add observer for the references section
  const referencesObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        zoomOutToFullRoute();
      }
    });
  }, { threshold: 0.3 });
  
  // Observe both sections
  introObserver.observe(document.getElementById('intro'));
  referencesObserver.observe(document.getElementById('references'));
  
  // Modified scrollama setup for less sensitivity
  const scroller = scrollama();
  
  scroller.setup({
    step: '.step',
    offset: 0.3,       // Changed from 0.6 to 0.4 to require more scrolling before triggering
    threshold: 1,      // Added threshold to require more of the element to be visible
    progress: false,   // Disable progress tracking for smoother transitions
    debug: false
  }).onStepEnter(({ element, direction }) => {
    // Prevent rapid firing of events by adding a small debounce
    if (activeElement === element) return;
    
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

    // Slow down the map transition
    map.flyTo({ 
      center: [lng, lat], 
      zoom: 14, 
      duration: 2000,  // Increased from 1000ms to 2000ms for slower transitions
      essential: true  // Makes the animation smoother
    });
    
    // Show the point marker
    marker.setLngLat({lng, lat}).addTo(map);
  });
}
