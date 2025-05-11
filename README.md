# Health on the Line: 6 Miles and 23 Years Along the 66 Bus Route

## Project Overview

This web-based interactive explores health disparities along Boston's 66 bus route, which goes through deeply unequal neighborhoods in just six miles. The project combines geospatial visualization, photography, and data storytelling to highlight how social determinants of health are embodied along this transit corridor.


## Project Purpose

This project visually documents how socioeconomic inequalities translate into stark health outcomes. The 66 bus route was chosen as a perfect case study, connecting:

- Harvard University (Cambridge)
- Allston (with significant Harvard property ownership)
- Brighton
- Brookline (affluent Boston suburb)
- Longwood Medical Area (home to world-class hospitals)
- Roxbury (one of the city's poorest neighborhoods)

In just six miles, life expectancy at birth varies by 23 years between neighborhoods.

## Technical Implementation

The project is built with:

- **HTML/CSS/JavaScript** - Core web technologies
- **Mapbox GL JS** - Interactive API mapping platform
- **Scrollama** - Scrollytelling library for scroll-based interactions
- **PapaParse** - CSV parsing library

The map visualization follows the bus route with a scrollytelling interface that highlights specific locations and their associated stories and statistics.

## Data Sources

- **Route Path Data**: The 66 bus route GeoJSON was obtained from [Transit.land](https://www.transit.land)
- **Health Statistics**: Data sourced from Boston Public Health Commission, Census Reporter, and academic research
- **Photography**: Original photography documenting the built environment along the route
- **Census Data**: Demographic and socioeconomic data from Census Reporter

## 📁 Project Structure

```
├── index.html              # Main HTML document
├── style.css               # CSS styling
├── script.js               # JavaScript for interactive functionality
├── assets/
│   └── img/                # Photography assets
├── data/
│   ├── img_coords.csv      # Coordinates and metadata for photos, along with text boxes
│   └── route66.geojson     # GeoJSON of the bus route
└── README.md               # This documentation
```

## 🚀 Setup and Usage

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/health-on-the-line.git
   cd health-on-the-line
   ```

2. You'll need to obtain a Mapbox API access token:
   - Sign up at [Mapbox](https://www.mapbox.com/)
   - Create an access token
   - Replace the token in script.js with your own

3. Run a local server:
   ```bash
   # Using Python (one option)
   python -m http.server
   
   # Or using Node.js
   npx serve
   ```

4. Open your browser to `http://localhost:8000` (or whichever port your server uses)


## Limitations & Future Development

- There is significantly more data for Boston than either Cambridge or Brookline, limiting data comparison
- One could use geojson census tracts and census data to create color-coded overlays of additional health metrics

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 license. This generally means you can share and adapt this project free of charge, so long as you provide attribution to the original creator and copyright holder (Devan Tatlow), freely license any adaptation with the same license, and do not use it for commercial purposes. You can see the full license documentation [here](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## Acknowledgments

- This project was created as part of Anthro 1821: Introduction to Social Medicine: Theory, Methods, Applications, taught in Spring 2025 at Harvard University by Professor Lindsey Zeve.
- I cannot thank Professor Zeve and her teaching fellow, Taylor Brock-Fisher enough for all their guidance this semester - I learned so much and this project would have never happened without you!
