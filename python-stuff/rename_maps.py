#!/usr/bin/env python3
"""
Rename map images to match exact track names with "- map" suffix
"""

import os
import re
import shutil
from pathlib import Path

def get_final_track_names():
    """Get track names from our final markdown file"""
    tracks = []
    
    # Read final tracks data
    with open('final_tracks_data_with_images.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract track names from detailed sections
    track_pattern = r'### \d+\. (.+?) \{#.+?\}'
    matches = re.findall(track_pattern, content)
    
    for match in matches:
        tracks.append(match.strip())
    
    return tracks

def normalize_for_matching(name):
    """Normalize name for matching - remove special chars, convert to lowercase"""
    # Remove special characters and convert to lowercase
    normalized = re.sub(r'[^\w\s]', '', name.lower())
    # Replace multiple spaces with single space
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

def get_map_files():
    """Get all image files from maps directory"""
    maps_dir = "maps"
    image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    
    map_files = []
    for file in os.listdir(maps_dir):
        if any(file.lower().endswith(ext) for ext in image_extensions):
            map_files.append(file)
    
    return sorted(map_files)

def match_maps_with_tracks(track_names, map_files):
    """Match map files with track names"""
    matches = []
    unmatched_maps = map_files.copy()
    
    for track_name in track_names:
        track_normalized = normalize_for_matching(track_name)
        best_match = None
        best_score = 0
        
        for map_file in unmatched_maps:
            # Remove extension for comparison
            map_name = os.path.splitext(map_file)[0]
            map_normalized = normalize_for_matching(map_name)
            
            # Calculate word overlap score
            track_words = set(track_normalized.split())
            map_words = set(map_normalized.split())
            
            if track_words and map_words:
                overlap = len(track_words.intersection(map_words))
                total_words = len(track_words.union(map_words))
                score = overlap / total_words if total_words > 0 else 0
                
                # Boost score if many words match
                if overlap >= 2 and score > 0.25:
                    if score > best_score:
                        best_score = score
                        best_match = map_file
        
        if best_match and best_score > 0.25:
            matches.append({
                'track_name': track_name,
                'map_file': best_match,
                'score': best_score
            })
            unmatched_maps.remove(best_match)
            print(f"✓ Matched: '{track_name}' -> '{best_match}' (score: {best_score:.2f})")
        else:
            print(f"✗ No match found for: '{track_name}'")
    
    if unmatched_maps:
        print(f"\n❓ Unmatched maps: {unmatched_maps}")
    
    return matches

def clean_filename(name):
    """Create a clean filename from track name"""
    # Replace problematic characters for filenames but keep important ones
    clean = name.replace('/', '-')  # Replace slashes with dashes
    clean = re.sub(r'[<>:"|?*]', '', clean)  # Remove Windows-problematic chars
    clean = clean.strip()
    return clean

def rename_maps(matches, maps_dir):
    """Rename map files to match track names with '- map' suffix"""
    renamed_count = 0
    
    for match in matches:
        old_path = os.path.join(maps_dir, match['map_file'])
        
        # Get file extension
        _, ext = os.path.splitext(match['map_file'])
        
        # Create new filename with "- map" suffix
        clean_name = clean_filename(match['track_name'])
        new_filename = f"{clean_name} - map{ext}"
        new_path = os.path.join(maps_dir, new_filename)
        
        try:
            # Avoid renaming if names are the same
            if os.path.normpath(old_path) != os.path.normpath(new_path):
                # Check if target file already exists
                if os.path.exists(new_path):
                    print(f"Warning: Target file already exists: {new_filename}")
                    # Add a number suffix
                    base_name = clean_name
                    counter = 1
                    while os.path.exists(new_path):
                        new_filename = f"{base_name} - map_{counter}{ext}"
                        new_path = os.path.join(maps_dir, new_filename)
                        counter += 1
                
                shutil.move(old_path, new_path)
                print(f"Renamed: '{match['map_file']}' -> '{new_filename}'")
                renamed_count += 1
            else:
                print(f"No rename needed: '{match['map_file']}'")
        
        except Exception as e:
            print(f"Error renaming {old_path} to {new_path}: {e}")
    
    return renamed_count

def update_final_markdown_with_maps():
    """Update final markdown to include map references"""
    maps_dir = "maps"
    
    # Get updated map files
    updated_maps = {}
    for file in os.listdir(maps_dir):
        if any(file.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
            # Remove extension and "- map" suffix to get track name
            track_name = os.path.splitext(file)[0]
            if track_name.endswith(' - map'):
                track_name = track_name[:-6]  # Remove " - map"
                updated_maps[track_name] = file
    
    # Read current final markdown
    with open('final_tracks_data_with_images.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process each track section individually
    lines = content.split('\n')
    updated_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        updated_lines.append(line)
        
        # Look for track section headers
        if re.match(r'### \d+\. (.+?) \{#.+?\}', line):
            track_match = re.match(r'### \d+\. (.+?) \{#.+?\}', line)
            if track_match:
                track_name = track_match.group(1)
                map_file = updated_maps.get(track_name)
                
                # Skip the next empty line and "Track Information:" line
                if i + 1 < len(lines):
                    updated_lines.append(lines[i + 1])  # Empty line
                    i += 1
                if i + 1 < len(lines):
                    updated_lines.append(lines[i + 1])  # "Track Information:"
                    i += 1
                if i + 1 < len(lines):
                    updated_lines.append(lines[i + 1])  # Empty line
                    i += 1
                
                # Add map reference if we have one
                if map_file:
                    updated_lines.append(f"- 🗺️ **Map Image:** `{map_file}`")
        
        i += 1
    
    # Write updated file
    with open('final_tracks_data_complete.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(updated_lines))
    
    print(f"\nUpdated markdown with map references: final_tracks_data_complete.md")

def main():
    maps_dir = "maps"
    
    print("🔍 Getting track names from final collection...")
    track_names = get_final_track_names()
    print(f"Found {len(track_names)} tracks in final collection")
    
    print("\n🗺️ Getting map files...")
    map_files = get_map_files()
    print(f"Found {len(map_files)} map files")
    
    print("\n🔗 Matching maps with track names...")
    matches = match_maps_with_tracks(track_names, map_files)
    
    print(f"\n📝 Renaming {len(matches)} map files...")
    renamed_count = rename_maps(matches, maps_dir)
    
    print(f"\n📄 Updating markdown with map references...")
    update_final_markdown_with_maps()
    
    print(f"\n✅ Process completed!")
    print(f"   - Successfully matched and renamed: {renamed_count} maps")
    print(f"   - Total tracks with maps: {len(matches)}")
    print(f"   - Updated markdown file: final_tracks_data_complete.md")

if __name__ == "__main__":
    main()