#!/usr/bin/env python3
"""
Create final tracks markdown file with only tracks that have GPX files
"""

import os
import re
from datetime import datetime

def get_gpx_files():
    """Get list of GPX files and create track names from them"""
    gpx_dir = "gpx"
    tracks = []
    
    for file in os.listdir(gpx_dir):
        if file.endswith('.gpx'):
            track_name = file.replace('.gpx', '')
            tracks.append({
                'name': track_name,
                'gpx_file': file
            })
    
    return sorted(tracks, key=lambda x: x['name'])

def extract_track_data_from_original(track_name, original_md_file):
    """Extract distance, elevation and URL for a track from original markdown"""
    with open(original_md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the track in the summary table
    table_pattern = r'\| ([^|]+) \| ([^|]+) \| ([^|]+) \| \[View\]\(([^)]+)\) \|'
    matches = re.findall(table_pattern, content)
    
    for match in matches:
        name, distance, elevation, url = match
        name = name.strip()
        
        # Check if names match (with some normalization)
        if normalize_for_comparison(name) == normalize_for_comparison(track_name):
            return {
                'distance': distance.strip(),
                'elevation': elevation.strip(),
                'url': url.strip()
            }
    
    # If not found in table, try to find in detailed sections
    track_pattern = rf'### \d+\. {re.escape(track_name)}.*?📏 \*\*Distance:\*\* ([^\n]+).*?⛰️.*?\*\*Elevation:\*\* ([^\n]+).*?\[https://mapy\.com/s/([^\]]+)\]'
    match = re.search(track_pattern, content, re.DOTALL)
    
    if match:
        return {
            'distance': match.group(1).strip(),
            'elevation': match.group(2).strip(),
            'url': f'https://mapy.com/s/{match.group(3)}'
        }
    
    return {
        'distance': 'Unknown',
        'elevation': 'Unknown',
        'url': '#'
    }

def normalize_for_comparison(text):
    """Normalize text for comparison"""
    # Convert to lowercase, remove special characters
    normalized = re.sub(r'[^\w\s]', '', text.lower())
    return ' '.join(normalized.split())

def create_final_markdown(tracks, output_file):
    """Create the final cleaned markdown file"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Mapy.com Track Data - Final Collection\n\n")
        f.write(f"*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n")
        f.write(f"This collection contains only tracks with available GPX files.\n\n")
        
        f.write("## Track Summary\n\n")
        f.write(f"Total tracks: {len(tracks)}\n\n")
        
        # Create summary table
        f.write("| Track Name | Distance | Elevation | GPX File | Link |\n")
        f.write("|------------|----------|-----------|----------|------|\n")
        
        for track in tracks:
            name = track['name'][:50] + '...' if len(track['name']) > 50 else track['name']
            data = track['data']
            f.write(f"| {name} | {data['distance']} | {data['elevation']} | `{track['gpx_file']}` | [View]({data['url']}) |\n")
        
        f.write("\n## Track Details\n\n")
        
        # Create detailed sections
        for i, track in enumerate(tracks, 1):
            track_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', track['name'].lower()).replace(' ', '-')
            data = track['data']
            
            f.write(f"### {i}. {track['name']} {{#{track_slug}}}\n\n")
            f.write("**Track Information:**\n\n")
            f.write(f"- 📏 **Distance:** {data['distance']}\n")
            f.write(f"- ⛰️ **Elevation:** {data['elevation']}\n")
            f.write(f"- 🔗 **Source:** [{data['url']}]({data['url']})\n")
            f.write(f"- 📁 **GPX File:** `{track['gpx_file']}`\n\n")
            f.write("**Additional Details:**\n\n")
            f.write("- **Type:** *Not specified*\n")
            f.write("- **Difficulty:** *Not specified*\n")
            f.write("- **Description:** *Add description here*\n\n")
            f.write("---\n\n")

def main():
    original_md_file = "all_tracks_data.md"
    output_file = "final_tracks_data.md"
    
    print("📁 Getting GPX files...")
    tracks = get_gpx_files()
    print(f"Found {len(tracks)} GPX files")
    
    print("🔍 Extracting track data from original markdown...")
    for track in tracks:
        track['data'] = extract_track_data_from_original(track['name'], original_md_file)
        print(f"✓ {track['name']}")
    
    print(f"\n📝 Creating final markdown file...")
    create_final_markdown(tracks, output_file)
    
    print(f"✅ Final tracks file created: {output_file}")
    print(f"   - Total tracks with GPX files: {len(tracks)}")

if __name__ == "__main__":
    main()