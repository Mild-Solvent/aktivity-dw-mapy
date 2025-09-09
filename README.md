# TrackFinder - Activity Tracks Discovery Platform

A modern Vue.js web application for discovering running, cycling, and hiking tracks with interactive maps, filtering, and mobile-responsive design.

## Features

- 🗺️ **Interactive Track Discovery**: Browse tracks with preview images and detailed information
- 🔍 **Advanced Filtering**: Filter by sport, distance, difficulty, and location
- 📱 **Mobile-First Design**: Fully responsive and optimized for mobile devices
- 🍔 **Burger Menu Navigation**: Clean navigation with collapsible menu
- 🎯 **Dynamic Routing**: Individual pages for each track with detailed view
- 📥 **GPX Downloads**: Download track files for GPS devices
- 🌐 **Map Integration**: View tracks on Mapy.com with embedded maps
- ⚡ **Modern UI**: Clean design with hover effects and smooth animations

## Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Routing**: Vue Router 4
- **Build Tool**: Vite
- **Styling**: Modern CSS with mobile-first approach
- **Maps**: Mapy.com integration

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── HomePage.vue       # Main track listing page
│   │   ├── TrackDetail.vue    # Individual track details
│   │   ├── Terms.vue          # Terms & Conditions
│   │   └── Privacy.vue        # Privacy Policy
│   ├── data/
│   │   └── tracks.json        # Track data with filtering metadata
│   ├── assets/
│   │   └── tracks/            # Organized track assets
│   │       ├── vrsatec/
│   │       ├── mountain-biking-trail/
│   │       ├── river-run/
│   │       └── forest-hike/
│   ├── App.vue               # Main app component with header
│   ├── main.js              # App entry point with routing
│   └── style.css            # Global styles
├── package.json
├── vite.config.js
└── index.html
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /Users/rabbithole/github/aktivity-dw-mapy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser and visit**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Main Features

1. **Browse Tracks**: View all available tracks on the home page with preview images
2. **Filter & Search**: Use the burger menu to filter by sport, distance, difficulty, and location
3. **Track Details**: Click on any track card to view detailed information
4. **Interactive Map**: View track routes on embedded Mapy.com maps
5. **Download GPX**: Download track files for your GPS device
6. **Mobile Navigation**: Use the responsive burger menu on mobile devices

### Adding New Tracks

To add new tracks to the application:

1. **Add track assets**:
   ```bash
   mkdir src/assets/tracks/your-track-name
   # Add preview.png and track.gpx files
   ```

2. **Update tracks.json**:
   ```json
   {
     "id": "your-track-name",
     "name": "Your Track Name",
     "description": "Track description...",
     "sport": "cycling|running|hiking",
     "distance": "10.5 km",
     "distanceValue": 10.5,
     "difficulty": "easy|moderate|hard",
     "location": "Location Name",
     "locationRegion": "region-identifier",
     "duration": "1h 30m",
     "elevation": "200m",
     "previewImage": "/src/assets/tracks/your-track-name/preview.png",
     "gpxFile": "/src/assets/tracks/your-track-name/track.gpx",
     "mapUrl": "https://mapy.com/s/your-map-link",
     "tags": ["tag1", "tag2", "tag3"],
     "createdAt": "2024-11-03"
   }
   ```

## Mobile Compatibility

The application is designed with mobile-first principles:

- **Responsive Grid**: Track cards adapt to screen size
- **Touch-Friendly**: Large tap targets and smooth scrolling
- **Optimized Images**: Properly sized for different screen densities
- **Mobile Menu**: Collapsible burger menu for easy navigation
- **Fast Loading**: Optimized assets and minimal bundle size

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Chrome Mobile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Track data and images from Strava/Mapy.com
- Icons from system emoji sets
- CSS design inspired by modern web standards
