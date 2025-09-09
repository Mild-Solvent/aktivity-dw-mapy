# Dynamic Track Management System

This directory contains all track data organized in individual folders. Each track has its own folder with all necessary files for dynamic rendering.

## Directory Structure

```
assets/tracks/
├── track-id/
│   ├── track-info.json    # Track metadata and information
│   ├── preview.png        # Preview image for the track
│   ├── track.gpx         # GPX file for download
│   └── [other files]     # Any additional files
└── README.md             # This file
```

## Adding a New Track

To add a new track, follow these steps:

### 1. Create Track Folder
Create a new folder with a unique track ID (use lowercase, hyphens for spaces):
```bash
mkdir assets/tracks/my-new-track
```

### 2. Add Required Files

**2.1. Create `track-info.json`**
```json
{
  "id": "my-new-track",
  "name": "My New Track Name",
  "description": "Description of the track...",
  "sport": "cycling|running|hiking",
  "distance": "15.2 km",
  "distanceValue": 15.2,
  "difficulty": "easy|moderate|hard",
  "location": "City, Country",
  "locationRegion": "slovakia|hungary|austria|czech",
  "duration": "1h 30m",
  "elevation": "450m",
  "previewImage": "./preview.png",
  "gpxFile": "./track.gpx",
  "mapUrl": "https://your-map-url.com",
  "tags": ["tag1", "tag2", "tag3"],
  "createdAt": "2024-11-03",
  "about": {
    "title": "O tejto trase",
    "createdText": "Vytvorené dňa November 3, 2024",
    "experienceText": "Táto trasa ponúka zážitok strednej úrovne, ideálny pre nadšencov cyklistiky."
  },
  "stats": {
    "distance": {
      "icon": "📏",
      "label": "Vzdialenosť",
      "value": "15.2 km"
    },
    "duration": {
      "icon": "⏱️",
      "label": "Trvanie",
      "value": "1h 30m"
    },
    "elevation": {
      "icon": "⛰️",
      "label": "Prevýšenie",
      "value": "450m"
    },
    "startPoint": {
      "icon": "📍",
      "label": "START",
      "value": "City, Country"
    }
  }
}
```

**2.2. Add `preview.png`**
- Add a preview image file (recommended size: 800x400px or similar aspect ratio)
- Name it exactly `preview.png`

**2.3. Add `track.gpx`**
- Add the GPX file for the track
- Name it exactly `track.gpx`

### 3. Register the Track

Update the track loader to include your new track:

Edit `src/utils/trackLoader.js` and add your track ID to the `knownTracks` array:
```javascript
const knownTracks = [
  'vrsatec',
  'mountain-biking-trail', 
  'river-run',
  'forest-hike',
  'my-new-track'  // Add your new track here
];
```

### 4. Test the Track

1. Start your development server
2. The new track should automatically appear on the main page
3. Click on it to verify all data loads correctly

## Field Descriptions

### Required Fields
- `id`: Unique identifier (must match folder name)
- `name`: Display name of the track
- `description`: Short description shown on track cards
- `sport`: Type of activity (`cycling`, `running`, `hiking`)
- `difficulty`: Difficulty level (`easy`, `moderate`, `hard`)
- `location`: Starting location
- `distance`, `duration`, `elevation`: Basic stats
- `previewImage`, `gpxFile`: File references

### Optional Fields
- `locationRegion`: For filtering by region
- `mapUrl`: External map link
- `tags`: Array of searchable tags
- `createdAt`: Creation date
- `about`: Custom about section text
- `stats`: Custom stats with icons and labels

## Sports and Difficulty Icons

### Sports
- `cycling`: 🚴
- `running`: 🏃
- `hiking`: 🥾

### Difficulty
- `easy`: 🟢
- `moderate`: 🟡
- `hard`: 🔴

## Tips

1. **Images**: Use optimized images to keep loading times fast
2. **GPX Files**: Ensure GPX files are valid and contain track data
3. **Descriptions**: Keep descriptions concise but informative
4. **Tags**: Use relevant Slovak tags for better searchability
5. **Testing**: Always test your track before committing changes

## Troubleshooting

**Track not appearing?**
- Check that the folder name matches the `id` in `track-info.json`
- Verify the track ID is added to `knownTracks` array
- Check browser console for loading errors

**Images not loading?**
- Ensure image file is named exactly `preview.png`
- Check file permissions and accessibility
- Verify image format is supported (PNG, JPG, WebP)

**GPX download not working?**
- Ensure GPX file is named exactly `track.gpx`
- Check that GPX file is valid XML format
- Verify file is accessible via HTTP
