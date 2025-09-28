#!/usr/bin/env python3
"""
Integrate all organized tracks into the Vue.js website
This script will:
1. Generate new tracks data from our markdown file
2. Create asset directory structure
3. Copy all assets (GPX, images, maps)
4. Update tracks.json file
"""

import os
import re
import json
import shutil
from datetime import datetime
from pathlib import Path

def get_tracks_from_markdown():
    """Extract track data from our final markdown file"""
    tracks = []
    
    with open('final_tracks_data_complete.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract track sections
    track_pattern = r'### (\d+)\. (.+?) \{#(.+?)\}(.*?)(?=### \d+\.|$)'
    matches = re.findall(track_pattern, content, re.DOTALL)
    
    for match in matches:
        track_num = int(match[0])
        track_name = match[1]
        track_slug = match[2]
        track_section = match[3]
        
        # Extract data from section
        track_data = {
            'number': track_num,
            'name': track_name,
            'slug': track_slug,
            'section': track_section
        }
        
        # Extract distance
        distance_match = re.search(r'- 📏 \*\*Distance:\*\* ([^\n]+)', track_section)
        track_data['distance'] = distance_match.group(1) if distance_match else 'Unknown'
        
        # Extract elevation
        elevation_match = re.search(r'- ⛰️ \*\*Elevation:\*\* ([^\n]+)', track_section)
        track_data['elevation'] = elevation_match.group(1) if elevation_match else 'Unknown'
        
        # Extract source URL
        url_match = re.search(r'- 🔗 \*\*Source:\*\* \[([^\]]+)\]\(([^\)]+)\)', track_section)
        track_data['source_url'] = url_match.group(2) if url_match else '#'
        
        # Extract GPX file
        gpx_match = re.search(r'- 📁 \*\*GPX File:\*\* `([^`]+)`', track_section)
        track_data['gpx_file'] = gpx_match.group(1) if gpx_match else None
        
        # Extract preview image
        preview_match = re.search(r'- 🖼️ \*\*Preview Image:\*\* `([^`]+)`', track_section)
        track_data['preview_image'] = preview_match.group(1) if preview_match else None
        
        # Extract map image
        map_match = re.search(r'- 🗺️ \*\*Map Image:\*\* `([^`]+)`', track_section)
        track_data['map_image'] = map_match.group(1) if map_match else None
        
        tracks.append(track_data)
    
    return tracks

def clean_filename_for_id(name):
    """Create a clean ID from track name"""
    # Remove special characters, convert to lowercase, replace spaces with hyphens
    clean = re.sub(r'[^\w\s-]', '', name.lower())
    clean = re.sub(r'\s+', '-', clean).strip('-')
    return clean

def estimate_duration(distance_str, elevation_str, sport):
    """Estimate duration based on distance, elevation and sport"""
    try:
        # Extract numeric distance
        distance_match = re.search(r'([0-9]+\.?[0-9]*)', distance_str)
        distance = float(distance_match.group(1)) if distance_match else 20
        
        # Extract elevation gain (first number)
        elevation_match = re.search(r'([0-9]+)', elevation_str.replace(',', ''))
        elevation = int(elevation_match.group(1)) if elevation_match else 300
        
        # Base speeds (km/h)
        if sport == 'cycling':
            base_speed = 15
            elevation_penalty = elevation / 100  # minutes per 100m
        elif sport == 'running':
            base_speed = 8
            elevation_penalty = elevation / 50   # minutes per 50m
        else:  # hiking
            base_speed = 4
            elevation_penalty = elevation / 30   # minutes per 30m
        
        # Calculate base time in hours
        base_time = distance / base_speed
        # Add elevation penalty in hours
        total_time = base_time + (elevation_penalty / 60)
        
        # Convert to hours and minutes
        hours = int(total_time)
        minutes = int((total_time - hours) * 60)
        
        if hours > 0:
            return f"{hours}h {minutes:02d}m"
        else:
            return f"{minutes}m"
            
    except:
        return "2h 00m"

def categorize_sport_and_difficulty(track_name, distance, elevation):
    """Categorize sport and difficulty based on track name and metrics"""
    name_lower = track_name.lower()
    
    # Determine sport
    if any(word in name_lower for word in ['bike', 'kordiky', 'trail +', 'brumov']):
        sport = 'cycling'
    elif any(word in name_lower for word in ['maraton', 'beh', 'run']):
        sport = 'running'  
    else:
        sport = 'hiking'
    
    # Determine difficulty based on distance and elevation
    try:
        dist_num = float(re.search(r'([0-9]+\.?[0-9]*)', distance).group(1))
        elev_match = re.search(r'([0-9]+)', elevation.replace(',', ''))
        elev_num = int(elev_match.group(1)) if elev_match else 300
        
        # Difficulty scoring
        if sport == 'cycling':
            if dist_num > 80 or elev_num > 2000:
                difficulty = 'hard'
            elif dist_num > 40 or elev_num > 800:
                difficulty = 'moderate'
            else:
                difficulty = 'easy'
        elif sport == 'running':
            if dist_num > 80 or elev_num > 2000:
                difficulty = 'hard'
            elif dist_num > 25 or elev_num > 600:
                difficulty = 'moderate' 
            else:
                difficulty = 'easy'
        else:  # hiking
            if dist_num > 50 or elev_num > 1500:
                difficulty = 'hard'
            elif dist_num > 20 or elev_num > 800:
                difficulty = 'moderate'
            else:
                difficulty = 'easy'
    except:
        difficulty = 'moderate'
    
    return sport, difficulty

def generate_description(track_name, sport, difficulty, location):
    """Generate a description for the track"""
    sport_texts = {
        'cycling': 'cyklistická trasa',
        'running': 'bežecká trasa', 
        'hiking': 'turistická trasa'
    }
    
    difficulty_texts = {
        'easy': 'jednoduchá a relaxačná',
        'moderate': 'stredne náročná',
        'hard': 'náročná a výzyvná'
    }
    
    base_desc = f"{difficulty_texts[difficulty].capitalize()} {sport_texts[sport]}"
    
    # Add specific details based on track name
    name_lower = track_name.lower()
    if 'hora' in name_lower or 'vrch' in name_lower:
        base_desc += " vedúca cez horské oblasti s úžasnými výhľadmi"
    elif 'maraton' in name_lower:
        base_desc += " pre milovníkov dlhých výziev"
    elif 'trail' in name_lower:
        base_desc += " cez technický terén"
    elif 'kordiky' in name_lower or 'žiar' in name_lower:
        base_desc += " cez malebné mestá a okolie"
    else:
        base_desc += " cez krásnu prirodzenú krajinu"
    
    base_desc += f" v regióne {location}."
    
    return base_desc

def extract_location(track_name):
    """Extract location from track name"""
    name_lower = track_name.lower()
    
    # Known locations from track names
    if 'vršatec' in name_lower:
        return "Vršatec, Slovensko"
    elif 'babia hora' in name_lower:
        return "Babia hora, Slovensko"
    elif 'inovec' in name_lower:
        return "Inovec, Slovensko"
    elif 'kordiky' in name_lower or 'žiar' in name_lower:
        return "Banska Bystrica, Slovensko"
    elif 'kolačin' in name_lower:
        return "Kolačín, Slovensko"
    elif 'trenčín' in name_lower or 'brumov' in name_lower:
        return "Trenčiansky kraj, Slovensko"
    elif 'varín' in name_lower or 'suchým' in name_lower:
        return "Žilinský kraj, Slovensko"
    else:
        return "Slovensko"

def create_assets_directory_structure(tracks):
    """Create directory structure and copy assets for tracks"""
    assets_dir = Path("assets/tracks")
    
    # Keep existing tracks but remove generated ones if they exist
    if assets_dir.exists():
        # Preserve existing sample tracks (vrsatec, mountain-biking-trail, etc.)
        existing_tracks = [d.name for d in assets_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
        print(f"Found existing tracks: {existing_tracks}")
        
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    copied_tracks = []
    
    for track in tracks:
        track_id = clean_filename_for_id(track['name'])
        track_dir = assets_dir / track_id
        track_dir.mkdir(exist_ok=True)
        
        track_info = {
            'id': track_id,
            'name': track['name'],
            'assets_copied': [],
            'directory': str(track_dir)
        }
        
        # Copy preview image (remove .png and add it back to handle naming)
        if track['preview_image']:
            preview_src = Path("images") / track['preview_image']
            if preview_src.exists():
                preview_dst = track_dir / "preview.png"
                shutil.copy2(preview_src, preview_dst)
                track_info['assets_copied'].append('preview.png')
        
        # Copy map image as profil.png (elevation profile)
        if track['map_image']:
            map_src = Path("maps") / track['map_image']
            if map_src.exists():
                # Copy map image as profil.png for elevation profile
                profil_dst = track_dir / "profil.png"
                shutil.copy2(map_src, profil_dst)
                track_info['assets_copied'].append('profil.png')
        
        # Copy GPX file
        if track['gpx_file']:
            gpx_src = Path("gpx") / track['gpx_file']
            if gpx_src.exists():
                gpx_dst = track_dir / "track.gpx"
                shutil.copy2(gpx_src, gpx_dst)
                track_info['assets_copied'].append('track.gpx')
        
        copied_tracks.append(track_info)
        print(f"✓ Created assets for: {track['name']} ({len(track_info['assets_copied'])} files)")
    
    return copied_tracks

def create_individual_track_info_files(tracks_data):
    """Create individual track-info.json files for each track"""
    created_count = 0
    
    for i, track in enumerate(tracks_data):
        track_id = clean_filename_for_id(track['name'])
        track_dir = Path("assets/tracks") / track_id
        
        sport, difficulty = categorize_sport_and_difficulty(
            track['name'], 
            track['distance'], 
            track['elevation']
        )
        
        location = extract_location(track['name'])
        duration = estimate_duration(track['distance'], track['elevation'], sport)
        
        # Extract numeric distance for distanceValue
        distance_match = re.search(r'([0-9]+\.?[0-9]*)', track['distance'])
        distance_value = float(distance_match.group(1)) if distance_match else 20.0
        
        # Create track info JSON structure matching existing format
        track_info = {
            "id": track_id,
            "name": track['name'],
            "description": generate_description(track['name'], sport, difficulty, location),
            "sport": sport,
            "distance": track['distance'],
            "distanceValue": distance_value,
            "difficulty": difficulty,
            "location": location,
            "locationRegion": "slovakia",
            "duration": duration,
            "elevation": track['elevation'],
            "previewImage": "./preview.png",
            "gpxFile": "./track.gpx",
            "mapUrl": track['source_url'],
            "tags": generate_tags(track['name'], sport, difficulty),
            "createdAt": datetime.now().strftime("%Y-%m-%d"),
            "about": {
                "title": "O tejto trase",
                "createdText": f"Vytvorené dňa {datetime.now().strftime('%B %d, %Y')}",
                "experienceText": f"Táto trasa ponúka zážitok {difficulty} úrovne, ideálny pre nadšencov {sport}."
            },
            "stats": {
                "distance": {
                    "icon": "📏",
                    "label": "Vzdialenosť",
                    "value": track['distance']
                },
                "duration": {
                    "icon": "⏱️",
                    "label": "Trvanie",
                    "value": duration
                },
                "elevation": {
                    "icon": "⛰️",
                    "label": "Prevýšenie",
                    "value": track['elevation']
                },
                "startPoint": {
                    "icon": "📍",
                    "label": "START",
                    "value": location
                }
            }
        }
        
        # Write track-info.json file
        info_file = track_dir / "track-info.json"
        with open(info_file, 'w', encoding='utf-8') as f:
            json.dump(track_info, f, ensure_ascii=False, indent=2)
        
        created_count += 1
        print(f"✓ Created track-info.json for: {track['name']}")
    
    print(f"✓ Created {created_count} track-info.json files")
    return created_count

def generate_tags(track_name, sport, difficulty):
    """Generate relevant tags for a track"""
    tags = []
    
    name_lower = track_name.lower()
    
    # Add sport-specific tags
    if sport == 'cycling':
        tags.extend(['cyklistika', 'bicykel'])
    elif sport == 'running':
        tags.extend(['beh', 'behanie'])
    else:
        tags.extend(['turistika', 'pešia túra'])
    
    # Add difficulty tag
    if difficulty == 'easy':
        tags.append('ľahké')
    elif difficulty == 'moderate':
        tags.append('stredné')
    else:
        tags.append('náročné')
    
    # Add terrain-specific tags based on name
    if any(word in name_lower for word in ['hora', 'vrch', 'vrchol']):
        tags.extend(['hory', 'vrchol'])
    if 'trail' in name_lower:
        tags.append('trail')
    if 'maraton' in name_lower:
        tags.append('maraton')
    if any(word in name_lower for word in ['les', 'príroda']):
        tags.append('príroda')
    
    return tags[:5]  # Limit to 5 tags

def update_assets_index_json():
    """Update assets/tracks/index.json with list of all tracks"""
    assets_dir = Path("assets/tracks")
    track_ids = []
    
    # Find all track directories
    for item in assets_dir.iterdir():
        if item.is_dir() and (item / "track-info.json").exists():
            track_ids.append(item.name)
    
    # Sort track IDs
    track_ids.sort()
    
    # Create index.json
    index_data = {
        "tracks": track_ids,
        "updated": datetime.now().strftime("%Y-%m-%d")
    }
    
    index_file = assets_dir / "index.json"
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Updated assets/tracks/index.json with {len(track_ids)} tracks")
    return track_ids

def update_readme():
    """Update assets/tracks/README.md with information about the tracks"""
    readme_path = Path("assets/tracks/README.md")
    
    # Count tracks
    assets_dir = Path("assets/tracks")
    track_count = len([d for d in assets_dir.iterdir() if d.is_dir() and (d / "track-info.json").exists()])
    
    readme_content = f"""# Track Assets Directory

This directory contains individual track folders with their assets and metadata.

## Structure

Each track folder contains:
- `track-info.json` - Complete track metadata
- `preview.png` - Preview image for the track
- `track.gpx` - GPS track data
- `profil.png` - Elevation profile/map image (optional)

## Current Tracks

Total tracks: {track_count}

Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This directory is automatically managed by the integration script.
"""
    
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"✓ Updated assets/tracks/README.md")

def main():
    print("🔄 Starting track integration process...")
    
    # Step 1: Extract tracks from markdown
    print("\n📋 Step 1: Extracting tracks from markdown...")
    tracks_data = get_tracks_from_markdown()
    print(f"Found {len(tracks_data)} tracks to integrate")
    
    # Step 2: Create assets directory structure
    print(f"\n📁 Step 2: Creating assets directory structure...")
    copied_tracks = create_assets_directory_structure(tracks_data)
    
    # Step 3: Create individual track-info.json files
    print(f"\n📄 Step 3: Creating individual track-info.json files...")
    created_count = create_individual_track_info_files(tracks_data)
    
    # Step 4: Update assets index
    print(f"\n📑 Step 4: Updating assets index...")
    track_ids = update_assets_index_json()
    
    # Step 5: Update README
    print(f"\n📝 Step 5: Updating README...")
    update_readme()
    
    print(f"\n✅ Track integration completed successfully!")
    print(f"   - Integrated: {len(tracks_data)} tracks")
    print(f"   - Assets created: {len(copied_tracks)} track directories")  
    print(f"   - Created: {created_count} track-info.json files")
    print(f"   - Updated: assets/tracks/index.json with {len(track_ids)} tracks")
    print(f"   - Updated: assets/tracks/README.md")
    print(f"\n🎉 Your tracks are now integrated into the website structure with:")
    print(f"   - 📏 Distance and elevation data")
    print(f"   - 🖼️ Preview images")  
    print(f"   - 🗺️ Map images (as elevation profiles)")
    print(f"   - 📁 GPX files")
    print(f"   - 📄 Individual track-info.json files")
    print(f"   - 🏃 Categorized by sport (cycling/running/hiking)")
    print(f"   - 🟡 Difficulty levels (easy/moderate/hard)")

if __name__ == "__main__":
    main()