# Mapy.com Track Data Scraper

A Python web scraper that extracts track information from Mapy.com links and saves the data to a structured Markdown file for website integration.

## Features

- Extracts track names, distances, and elevation data from Mapy.com URLs
- Handles JavaScript-rendered content using Selenium
- Outputs data in a clean Markdown format with tables and structured sections
- Includes emoji icons for better visual presentation
- Provides placeholder sections for additional track metadata

## Requirements

- Python 3.7+
- Chrome browser
- ChromeDriver

## Installation

1. **Install Python dependencies:**
   ```bash
   pip3 install requests beautifulsoup4 selenium
   ```

2. **Install ChromeDriver:**
   ```bash
   brew install chromedriver
   ```

## Usage

1. **Create a text file with Mapy.com links (one per line):**
   ```
   https://mapy.com/s/robavalovu
   https://mapy.com/s/fahujufute
   https://mapy.com/s/kovelodoze
   https://mapy.com/s/polenudave
   ```

2. **Run the scraper:**
   ```bash
   python3 mapy_scraper.py links.txt output.md
   ```

## Output Format

The scraper generates a Markdown file with:

- **Track Summary Table**: Overview of all tracks with links
- **Detailed Track Information**: Individual sections for each track including:
  - Track name with anchor links
  - Distance with 📏 emoji
  - Elevation gain/loss with ⛰️ emoji and ↑/↓ arrows
  - Source URL with 🔗 emoji
  - Placeholder fields for additional metadata

## Example Output

```markdown
# Mapy.com Track Data

*Scraped on: 2025-09-28 20:57:56*

## Track Summary

| Track Name | Distance | Elevation | Link |
|------------|----------|-----------|------|
| Inovec Mitice Ostrý vrch | 81.7 km | ↑1,735 m / ↓1,728 m | [View](https://mapy.com/s/robavalovu) |

## Track Details

### 1. Inovec Mitice Ostrý vrch {#inovec-mitice-ostr-vrch}

**Track Information:**

- 📏 **Distance:** 81.7 km
- ⛰️  **Elevation:** ↑1,735 m / ↓1,728 m
- 🔗 **Source:** [https://mapy.com/s/robavalovu](https://mapy.com/s/robavalovu)

**Additional Details:**

- **Type:** *Not specified*
- **Difficulty:** *Not specified*
- **Description:** *Add description here*
```

## Data Extraction

The scraper identifies track data using these HTML elements:

- **Track Name**: `<p class="ui-heroheader__title"><h1 title="TRACK_NAME">`
- **Distance**: `<ul class="stats"><li><small class="sup">Distance</small><strong>VALUE</strong><small class="sub">km</small></li></ul>`
- **Elevation**: `<div class="line-chart"><span class="value">VALUE m</span>` (for gain/loss)

## Website Integration

The generated Markdown file is optimized for website integration with:
- Clean table format for overview pages
- Individual track sections with anchor links
- Structured metadata fields ready for content management
- Emoji icons for visual appeal
- Placeholder sections for additional content

## Troubleshooting

- **ChromeDriver issues**: Make sure ChromeDriver is properly installed and accessible in your PATH
- **SSL warnings**: The urllib3 warnings can be ignored - they don't affect functionality
- **Failed extractions**: Check if the Mapy.com URLs are accessible and contain the expected content structure

## Files

- `mapy_scraper.py` - Main scraper script
- `links.txt` - Sample input file with test links
- `tracks_data_improved.md` - Sample output file
- `SCRAPER_README.md` - This documentation

## Integration with TrackFinder

The scraped data can be easily integrated into the main TrackFinder Vue.js application by:

1. Converting the Markdown data to JSON format
2. Adding the tracks to `src/data/tracks.json`
3. Adding preview images and GPX files to the appropriate asset directories
4. Following the TrackFinder data structure for consistency