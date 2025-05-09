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
});

Papa.parse('data/img_coords.csv', {
  download: true,
  header: true,
  complete: function(results) {
    const container = document.getElementById('graphic');
    results.data.forEach(row => {
      const step = document.createElement('div');
      step.className = 'step';
      step.setAttribute('data-lat', row.latitude);
      step.setAttribute('data-lng', row.longitude);
      step.setAttribute('data-img', `assets/img/${row.filename.trim()}`);

      const title = document.createElement('h2');
      title.textContent = row.filename;
      step.appendChild(title);

      container.appendChild(step);
    });

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
    });
  }
});
