#!/usr/bin/env python3
"""
Mapy.com Track Data Scraper

This script reads URLs from a text file and extracts track information:
- Track name
- Distance 
- Elevation gain/loss

The data is saved to a markdown file for easy website integration.
"""

import sys
import time
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup


class MapyScraper:
    def __init__(self):
        self.setup_driver()
        
    def setup_driver(self):
        """Setup Chrome driver with headless options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
        except Exception as e:
            print(f"Failed to setup Chrome driver: {e}")
            print("Make sure ChromeDriver is installed. You can install it with: brew install chromedriver")
            sys.exit(1)
    
    def extract_track_data(self, url):
        """Extract track data from a Mapy.com URL"""
        print(f"Processing: {url}")
        
        try:
            self.driver.get(url)
            
            # Wait for the page to load completely
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait for dynamic content
            time.sleep(3)
            
            # Get page source and parse with BeautifulSoup
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Extract track name from the hero header
            track_name = self.extract_track_name(soup)
            
            # Extract distance
            distance = self.extract_distance(soup)
            
            # Extract elevation
            elevation = self.extract_elevation(soup)
            
            return {
                'name': track_name,
                'distance': distance,
                'elevation': elevation,
                'url': url
            }
            
        except TimeoutException:
            print(f"Timeout loading {url}")
            return None
        except Exception as e:
            print(f"Error processing {url}: {e}")
            return None
    
    def extract_track_name(self, soup):
        """Extract track name from the hero header"""
        try:
            # Look for the title in the hero header
            hero_header = soup.find('p', class_='ui-heroheader__title')
            if hero_header:
                h1_element = hero_header.find('h1')
                if h1_element:
                    return h1_element.get('title', h1_element.text.strip())
            
            # Fallback: look for any h1 with title attribute
            h1_elements = soup.find_all('h1')
            for h1 in h1_elements:
                title = h1.get('title')
                if title:
                    return title
                    
            # Last resort: use page title
            title_tag = soup.find('title')
            if title_tag and title_tag.text != 'Mapy.com':
                return title_tag.text.strip()
                
            return "Unknown Track"
            
        except Exception as e:
            print(f"Error extracting track name: {e}")
            return "Unknown Track"
    
    def extract_distance(self, soup):
        """Extract distance from stats section"""
        try:
            # Look for distance in stats
            stats = soup.find('ul', class_='stats')
            if stats:
                # Find the li element containing distance info
                for li in stats.find_all('li'):
                    small_sup = li.find('small', class_='sup')
                    if small_sup and 'distance' in small_sup.text.lower():
                        strong = li.find('strong')
                        small_sub = li.find('small', class_='sub')
                        if strong and small_sub:
                            return f"{strong.text.strip()} {small_sub.text.strip()}"
            
            # Fallback: search for distance pattern in text
            text = soup.get_text()
            distance_match = re.search(r'(\d+[\.,]\d+)\s*km', text, re.IGNORECASE)
            if distance_match:
                return f"{distance_match.group(1)} km"
                
            return "Unknown"
            
        except Exception as e:
            print(f"Error extracting distance: {e}")
            return "Unknown"
    
    def extract_elevation(self, soup):
        """Extract elevation gain/loss from elevation chart section"""
        try:
            # Look for elevation in line-chart section
            line_chart = soup.find('div', class_='line-chart')
            if line_chart:
                # Find elevation values - look for specific elevation gain/loss patterns
                elevation_values = []
                
                # Look for span elements with class 'value' that contain elevation data
                value_spans = line_chart.find_all('span', class_='value')
                for span in value_spans:
                    value_text = span.text.strip()
                    # Only include values that end with 'm' and are elevation-like
                    if 'm' in value_text and re.match(r'^\d+[\.,]?\d*\s*m$', value_text.strip()):
                        elevation_values.append(value_text)
                
                if elevation_values:
                    # Typically first value is elevation gain, second is elevation loss
                    if len(elevation_values) >= 2:
                        return f"↑{elevation_values[0]} / ↓{elevation_values[1]}"
                    else:
                        return elevation_values[0]
            
            # Fallback: search for elevation pattern in the description text
            elevation_desc = soup.find('p', class_='desc')
            if elevation_desc:
                value_spans = elevation_desc.find_all('span', class_='value')
                elevation_values = []
                for span in value_spans:
                    value_text = span.text.strip()
                    if 'm' in value_text and re.match(r'^\d+[\.,]?\d*\s*m$', value_text.strip()):
                        elevation_values.append(value_text)
                
                if elevation_values:
                    if len(elevation_values) >= 2:
                        return f"↑{elevation_values[0]} / ↓{elevation_values[1]}"
                    else:
                        return elevation_values[0]
            
            # Last fallback: search for elevation pattern in text
            text = soup.get_text()
            elevation_matches = re.findall(r'(\d+[\.,]?\d*)\s*m', text)
            if elevation_matches:
                # Filter for reasonable elevation values (typically > 100m for meaningful elevation gain)
                valid_elevations = [m for m in elevation_matches if float(m.replace(',', '.').replace(' ', '')) > 100]
                if valid_elevations:
                    return f"{valid_elevations[0]} m"
                    
            return "Unknown"
            
        except Exception as e:
            print(f"Error extracting elevation: {e}")
            return "Unknown"
    
    def process_links_file(self, input_file, output_file):
        """Process all links from input file and save to output file"""
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                links = [line.strip() for line in f.readlines() if line.strip()]
            
            tracks_data = []
            
            for link in links:
                if link.startswith('http'):
                    track_data = self.extract_track_data(link)
                    if track_data:
                        tracks_data.append(track_data)
                        print(f"✓ Extracted: {track_data['name']}")
                    else:
                        print(f"✗ Failed to extract data from: {link}")
            
            # Save to markdown file
            self.save_to_markdown(tracks_data, output_file)
            print(f"\nData saved to: {output_file}")
            
        except FileNotFoundError:
            print(f"Error: Input file '{input_file}' not found")
        except Exception as e:
            print(f"Error processing links: {e}")
    
    def save_to_markdown(self, tracks_data, output_file):
        """Save track data to markdown file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Mapy.com Track Data\n\n")
            f.write(f"*Scraped on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n")
            
            if not tracks_data:
                f.write("No track data could be extracted.\n")
                return
            
            f.write("## Track Summary\n\n")
            f.write(f"Total tracks processed: {len(tracks_data)}\n\n")
            
            # Create a table for overview
            f.write("| Track Name | Distance | Elevation | Link |\n")
            f.write("|------------|----------|-----------|------|\n")
            for track in tracks_data:
                name = track['name'][:50] + '...' if len(track['name']) > 50 else track['name']
                f.write(f"| {name} | {track['distance']} | {track['elevation']} | [View]({track['url']}) |\n")
            
            f.write("\n## Track Details\n\n")
            
            for i, track in enumerate(tracks_data, 1):
                # Create a clean slug for the track
                track_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', track['name'].lower()).replace(' ', '-')
                
                f.write(f"### {i}. {track['name']} {{#{track_slug}}}\n\n")
                
                # Add track metadata in a more structured way
                f.write("**Track Information:**\n\n")
                f.write(f"- 📏 **Distance:** {track['distance']}\n")
                f.write(f"- ⛰️  **Elevation:** {track['elevation']}\n")
                f.write(f"- 🔗 **Source:** [{track['url']}]({track['url']})\n\n")
                
                # Add placeholder for additional data that could be added later
                f.write("**Additional Details:**\n\n")
                f.write("- **Type:** *Not specified*\n")
                f.write("- **Difficulty:** *Not specified*\n")
                f.write("- **Description:** *Add description here*\n\n")
                
                f.write("---\n\n")
    
    def close(self):
        """Close the browser driver"""
        if hasattr(self, 'driver'):
            self.driver.quit()


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 mapy_scraper.py <input_links_file> <output_markdown_file>")
        print("Example: python3 mapy_scraper.py links.txt tracks_data.md")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    scraper = MapyScraper()
    
    try:
        scraper.process_links_file(input_file, output_file)
    finally:
        scraper.close()
    
    print("Scraping completed!")


if __name__ == "__main__":
    main()