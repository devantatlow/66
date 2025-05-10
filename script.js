mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsb3ciLCJhIjoiY21haDJ0YmgzMDdhczJxcTB0OHc1YXJoNyJ9.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  // Use a minimal style with less street detail
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-71.1, 42.35],
  zoom: 12
});

// Create a marker element for the connection point
const connectionMarker = document.createElement('div');
connectionMarker.className = 'connection-marker';
const marker = new mapboxgl.Marker(connectionMarker);

// Store the original photo data from CSV
let photoData = [];
// Store the customized order (can be modified)
let customOrder = [];
// Store census tract data
let censusData = [];
// Store active photo element
let activeElement = null;
// Track if map is currently moving
let isMapMoving = false;

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

  // Add census tracts source
  map.addSource('census-tracts', {
    type: 'geojson',
    data: 'data/census_tracts.geojson' // You'll need to provide this file
  });

  // Add census tracts layer
  map.addLayer({
    id: 'census-fill',
    type: 'fill',
    source: 'census-tracts',
    layout: {},
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'active'], false],
        ['get', 'color'], // Use the color property from the feature
        'rgba(0, 0, 0, 0)' // Transparent by default
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'active'], false],
        0.6,
        0
      ]
    }
  });

  // Add outline for census tracts
  map.addLayer({
    id: 'census-outline',
    type: 'line',
    source: 'census-tracts',
    layout: {},
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'active'], false],
        ['get', 'color'], // Use the color property from the feature
        'rgba(0, 0, 0, 0)' // Transparent by default
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'active'], false],
        2,
        0
      ]
    }
  });

  // Load the image data
  loadImageData();
  
  // Load census data
  loadCensusData();
});

// Track when map is moving and when it stops
map.on('movestart', () => {
  isMapMoving = true;
});

map.on('moveend', () => {
  isMapMoving = false;
  // Update connection line after map movement completes
  const activeStep = document.querySelector('.step.is-active');
  if (activeStep) {
    const lat = +activeStep.getAttribute('data-lat');
    const lng = +activeStep.getAttribute('data-lng');
    updateConnectionLine({lng, lat});
  }
});

// Function to update the connection line between map point and photo
function updateConnectionLine(lngLat) {
  if (!map.getSource('connection-line') || !activeElement || isMapMoving) return;

  // Get the bounding box of the map container
  const mapBounds = map.getContainer().getBoundingClientRect();
  
  // Get the bounding box of the active element
  const elementBounds = activeElement.getBoundingClientRect();
  
  // Check if element is actually visible in viewport
  if (elementBounds.bottom < 0 || elementBounds.top > window.innerHeight) {
    // Element is offscreen, hide the connection
    map.getSource('connection-line').setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[lngLat.lng, lngLat.lat], [lngLat.lng, lngLat.lat]]
      }
    });
    marker.remove();
    return;
  }
  
  // Calculate the element's center position relative to the viewport
  const elementCenter = {
    x: elementBounds.left + elementBounds.width / 2,
    y: elementBounds.top + elementBounds.height / 2
  };
  
  // Convert the map coordinates to pixel coordinates
  const mapPoint = map.project(lngLat);
  
  // Calculate the offset direction from map point to element
  const dx = elementCenter.x - (mapBounds.left + mapPoint.x);
  const dy = elementCenter.y - (mapBounds.top + mapPoint.y);
  
  // Normalize the direction and set a fixed length
  const length = Math.sqrt(dx*dx + dy*dy);
  if (length <= 10) {
    // If points are very close, don't show the line
    marker.remove();
    return;
  }
  
  const normalizedDx = dx / length;
  const normalizedDy = dy / length;
  const fixedLength = Math.min(length, 100); // Limit the line length
  
  // Convert the end point back to geographic coordinates
  const mapPointEnd = {
    x: mapPoint.x + normalizedDx * fixedLength,
    y: mapPoint.y + normalizedDy * fixedLength
  };
  const endLngLat = map.unproject(mapPointEnd);
  
  // Update the connection line
  map.getSource('connection-line').setData({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [lngLat.lng, lngLat.lat],
        [endLngLat.lng, endLngLat.lat]
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

function loadCensusData() {
  // You'll need to create this CSV file with census tract data
  Papa.parse('data/census_data.csv', {
    download: true,
    header: true,
    complete: function(results) {
      censusData = results.data.filter(row => row.tract_id); // Filter out incomplete entries
      
      // Add census data steps to the sequence after loading photos
      if (photoData.length > 0) {
        // You can insert census data points at specific positions in the sequence
        // This will happen automatically when you edit the custom order
      }
    }
  });
}

// Function to populate steps based on custom order
function populateSteps(container, orderArray) {
  // Clear existing steps
  container.innerHTML = '';
  
  // Add steps in the specified order
  orderArray.forEach(index => {
    if (index < 0) {
      // Negative indices represent census tract data
      const censusIndex = Math.abs(index) - 1;
      if (censusData[censusIndex]) {
        const tract = censusData[censusIndex];
        
        const step = document.createElement('div');
        step.className = 'step census-step';
        step.setAttribute('data-tract-id', tract.tract_id);
        
        const title = document.createElement('h2');
        title.textContent = tract.title || `Census Tract ${tract.tract_id}`;
        step.appendChild(title);

        // Add data visualization or content
        const content = document.createElement('div');
        content.className = 'census-content';
        
        const dataPoint = document.createElement('div');
        dataPoint.className = 'data-point';
        dataPoint.innerHTML = `
          <div class="data-value">${tract.life_expectancy || 'N/A'}</div>
          <div class="data-label">Life Expectancy (years)</div>
        `;
        content.appendChild(dataPoint);
        
        const dataPoint2 = document.createElement('div');
        dataPoint2.className = 'data-point';
        dataPoint2.innerHTML = `
          <div class="data-value">$${tract.median_income || 'N/A'}</div>
          <div class="data-label">Median Income</div>
        `;
        content.appendChild(dataPoint2);
        
        step.appendChild(content);

        // Add description
        if (tract.description) {
          const desc = document.createElement('p');
          desc.textContent = tract.description;
          step.appendChild(desc);
        }

        container.appendChild(step);
      }
    } else if (photoData[index]) {
      // Regular photo step
      const row = photoData[index];
      
      const step = document.createElement('div');
      step.className = 'step photo-step';
      step.setAttribute('data-lat', row.latitude);
      step.setAttribute('data-lng', row.longitude);
      step.setAttribute('data-img', `assets/img/${row.filename.trim()}`);

      const title = document.createElement('h2');
      title.textContent = row.title || row.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " "); // Remove extension and replace underscores
      step.appendChild(title);

      // Add the image immediately (preload all images)
      const img = document.createElement('img');
      img.src = `assets/img/${row.filename.trim()}`;
      img.loading = 'lazy'; // Lazy load images for better performance
      step.appendChild(img);

      // Add caption if needed
      const cap = document.createElement('div');
      cap.className = 'caption';
      cap.textContent = row.caption || row.description || row.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      step.appendChild(cap);

      container.appendChild(step);
    }
  });
}

// Keep track of currently highlighted census tract
let activeTractId = null;

function initScrollama() {
  scrollama().setup({
    step: '.step',
    offset: 0.6,
    debug: false
  }).onStepEnter(({ element }) => {
    // Store the active element
    activeElement = element;
    
    // Remove active class from all steps
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('is-active');
    });
    element.classList.add('is-active');

    // Clear any previously active census tract
    if (activeTractId !== null && map.getSource('census-tracts')) {
      map.setFeatureState(
        { source: 'census-tracts', id: activeTractId },
        { active: false }
      );
      activeTractId = null;
    }

    // Check if this is a census tract step
    if (element.classList.contains('census-step')) {
      const tractId = element.getAttribute('data-tract-id');
      if (tractId && map.getSource('census-tracts')) {
        // Find the center of the census tract
        const tractFeature = map.querySourceFeatures('census-tracts', {
          filter: ['==', ['get', 'tract_id'], tractId]
        })[0];
        
        if (tractFeature) {
          // Highlight the census tract
          map.setFeatureState(
            { source: 'census-tracts', id: tractFeature.id },
            { active: true }
          );
          activeTractId = tractFeature.id;
          
          // Get the center of the tract's bounding box for centering the map
          const bounds = new mapboxgl.LngLatBounds();
          
          // For a multipolygon or polygon, get all coordinates
          const coordinates = tractFeature.geometry.type === 'MultiPolygon' 
            ? tractFeature.geometry.coordinates.flat(1)
            : tractFeature.geometry.coordinates[0];
            
          coordinates.forEach(coord => {
            bounds.extend(coord);
          });
          
          // Fly to the center of the bounds
          map.flyTo({ center: bounds.getCenter(), zoom: 14, duration: 1000 });
        }
      }
    } else {
      // Regular photo step
      const lat = +element.getAttribute('data-lat');
      const lng = +element.getAttribute('data-lng');
      
      if (lat && lng) {
        // Fly to the location
        map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
        
        // Update the connection line after a delay
        setTimeout(() => {
          updateConnectionLine({lng, lat});
        }, 1100); // Wait slightly longer than the fly animation
      }
    }
  }).onStepExit(({ element, direction }) => {
    // Additional logic for when leaving a step if needed
  });
}

// Update connection line on scroll and resize
window.addEventListener('scroll', () => {
  const activeStep = document.querySelector('.step.is-active');
  if (activeStep && !activeStep.classList.contains('census-step')) {
    const lat = +activeStep.getAttribute('data-lat');
    const lng = +activeStep.getAttribute('data-lng');
    if (lat && lng) {
      updateConnectionLine({lng, lat});
    }
  }
});

window.addEventListener('resize', () => {
  const activeStep = document.querySelector('.step.is-active');
  if (activeStep && !activeStep.classList.contains('census-step')) {
    const lat = +activeStep.getAttribute('data-lat');
    const lng = +activeStep.getAttribute('data-lng');
    if (lat && lng) {
      updateConnectionLine({lng, lat});
    }
  }
});

// Function to reorder photos and census tract steps
function reorderPhotos(newOrder) {
  if (Array.isArray(newOrder) && newOrder.length > 0) {
    customOrder = newOrder;
    populateSteps(document.getElementById('graphic'), customOrder);
    initScrollama();
  }
}

// Helper function to convert census tract GeoJSON to appropriate format
function preprocessCensusData(geojson) {
  // Add unique IDs to features if they don't have them
  return {
    ...geojson,
    features: geojson.features.map((feature, index) => {
      return {
        ...feature,
        id: feature.id || index,
        properties: {
          ...feature.properties,
          // Generate a color based on life expectancy if available
          color: generateColorFromValue(feature.properties.life_expectancy)
        }
      };
    })
  };
}

// Generate colors for census tracts based on life expectancy
function generateColorFromValue(value) {
  // Define a color scale from red (lower life expectancy) to green (higher)
  if (!value) return '#888888';
  
  // Assuming life expectancy range from 65 to 85 years
  const min = 65;
  const max = 85;
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Generate RGB values for a red to green gradient
  const r = Math.round(255 * (1 - normalized));
  const g = Math.round(255 * normalized);
  const b = 50;
  
  return `rgb(${r}, ${g}, ${b})`;
}
