mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2YW50YXRsb3ciLCJhIjoiY21haDJ0YmgzMDdhczJxcTB0OHc1YXJoNyJ9.QCvT5Ybb0--dtOTlPc4mCA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-71.1, 42.35],
  zoom: 12
});

map.on('load', () => {
  map.addSource('route66', {
    type: 'geojson',
    data: 'data/route66.geojson'
  });

  map.addLayer({
    id: 'route66-line',
    type: 'line',
    source: 'route66',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#FF5733',
      'line-width': 4
    }
  });
});

const scroller = scrollama();

scroller
  .setup({
    step: '.step',
    offset: 0.5,
    debug: false
  })
  .onStepEnter(response => {
    const el = response.element;
    const lat = el.getAttribute('data-lat');
    const lng = el.getAttribute('data-lng');
    const zoom = el.getAttribute('data-zoom');
    const imgSrc = el.getAttribute('data-img');
    const caption = el.getAttribute('data-caption');

    map.flyTo({
      center: [lng, lat],
      zoom: zoom
    });

    document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
    el.classList.add('is-active');

    // If image or caption not yet added, inject them
    if (!el.querySelector('img')) {
      const img = document.createElement('img');
      img.src = imgSrc;
      el.appendChild(img);
    }

    if (!el.querySelector('.caption')) {
      const cap = document.createElement('div');
      cap.className = 'caption';
      cap.innerText = caption;
      el.appendChild(cap);
    }
  });
