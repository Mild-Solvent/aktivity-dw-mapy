#!/usr/bin/env python3
"""
GPX File Renamer and Markdown Cleaner

This script:
1. Reads track names from the markdown file
2. Matches them with existing GPX files 
3. Renames GPX files to match exact track names
4. Removes tracks without GPX files from the markdown
"""

import os
import re
import shutil
from pathlib import Path


def normalize_name(name):
    """Normalize name for comparison by removing special chars and converting to lowercase"""
    # Remove special characters and convert to lowercase
    normalized = re.sub(r'[^\w\s-]', '', name.lower())
    # Replace multiple spaces/dashes with single space
    normalized = re.sub(r'[\s-]+', ' ', normalized).strip()
    return normalized


def clean_filename(name):
    """Create a clean filename from track name"""
    # Replace problematic characters for filenames
    clean = re.sub(r'[<>:"/\\|?*]', '', name)
    clean = re.sub(r'[•⇒]', ' ', clean)  # Replace special arrows/bullets
    clean = re.sub(r'\s+', ' ', clean).strip()  # Clean up spaces
    return clean


def extract_tracks_from_markdown(md_file):
    """Extract track information from markdown file"""
    tracks = []
    
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find track sections
    track_pattern = r'### (\d+)\. (.+?) \{#.+?\}(.*?)(?=### \d+\.|$)'
    matches = re.findall(track_pattern, content, re.DOTALL)
    
    for match in matches:
        track_num = int(match[0])
        track_name = match[1].strip()
        track_section = match[2]
        
        # Extract URL from the section
        url_match = re.search(r'\[https://mapy\.com/s/([^]]+)\]', track_section)
        url = url_match.group(0) if url_match else None
        url_code = url_match.group(1) if url_match else None
        
        tracks.append({
            'number': track_num,
            'name': track_name,
            'section': match[2],
            'url': url,
            'url_code': url_code,
            'full_match': match
        })
    
    return tracks


def find_gpx_files(gpx_dir):
    """Find all GPX files in the directory"""
    gpx_files = []
    for file in os.listdir(gpx_dir):
        if file.endswith('.gpx'):
            gpx_files.append(file)
    return sorted(gpx_files)


def match_tracks_with_gpx(tracks, gpx_files):
    """Match tracks with GPX files based on name similarity"""
    matched_tracks = []
    unmatched_gpx = gpx_files.copy()
    
    for track in tracks:
        track_normalized = normalize_name(track['name'])
        best_match = None
        best_score = 0
        
        for gpx_file in unmatched_gpx:
            gpx_normalized = normalize_name(gpx_file.replace('.gpx', ''))
            
            # Calculate similarity score (simple word overlap)
            track_words = set(track_normalized.split())
            gpx_words = set(gpx_normalized.split())
            
            if track_words and gpx_words:
                overlap = len(track_words.intersection(gpx_words))
                total_words = len(track_words.union(gpx_words))
                score = overlap / total_words if total_words > 0 else 0
                
                # Boost score if key words match
                if overlap >= 2 and score > 0.3:  # At least 2 words match and 30% similarity
                    if score > best_score:
                        best_score = score
                        best_match = gpx_file
        
        if best_match and best_score > 0.3:
            track['gpx_file'] = best_match
            track['match_score'] = best_score
            matched_tracks.append(track)
            unmatched_gpx.remove(best_match)
            print(f"✓ Matched: '{track['name']}' -> '{best_match}' (score: {best_score:.2f})")
        else:
            print(f"✗ No match found for: '{track['name']}'")
    
    return matched_tracks, unmatched_gpx


def rename_gpx_files(matched_tracks, gpx_dir):
    """Rename GPX files to match track names exactly"""
    renamed_files = []
    
    for track in matched_tracks:
        old_path = os.path.join(gpx_dir, track['gpx_file'])
        clean_name = clean_filename(track['name'])
        new_filename = f"{clean_name}.gpx"
        new_path = os.path.join(gpx_dir, new_filename)
        
        try:
            # Avoid renaming if names are the same
            if old_path != new_path:
                shutil.move(old_path, new_path)
                print(f"Renamed: '{track['gpx_file']}' -> '{new_filename}'")
            else:
                print(f"No rename needed: '{track['gpx_file']}'")
            
            track['new_gpx_file'] = new_filename
            renamed_files.append(track)
            
        except Exception as e:
            print(f"Error renaming {old_path} to {new_path}: {e}")
    
    return renamed_files


def update_markdown_file(matched_tracks, original_md_file, output_md_file):
    """Create updated markdown file with only matched tracks"""
    
    # Read original content to preserve header
    with open(original_md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract header (everything before first track detail)
    header_match = re.search(r'^(.*?)(?=### 1\.)', content, re.DOTALL)
    header = header_match.group(1) if header_match else ""
    
    # Update track count in header
    header = re.sub(r'Total tracks processed: \d+', f'Total tracks processed: {len(matched_tracks)}', header)
    
    # Rebuild track summary table
    table_lines = [
        "| Track Name | Distance | Elevation | Link |",
        "|------------|----------|-----------|------|"
    ]
    
    # Extract distance and elevation from each track's section
    for track in matched_tracks:
        # Extract distance from the section
        distance_match = re.search(r'📏 \*\*Distance:\*\* ([^\\n]+)', track['section'])
        distance = distance_match.group(1) if distance_match else "Unknown"
        
        # Extract elevation from the section  
        elevation_match = re.search(r'⛰️  \*\*Elevation:\*\* ([^\\n]+)', track['section'])
        elevation = elevation_match.group(1) if elevation_match else "Unknown"
        
        # Truncate long names for table
        display_name = track['name'][:50] + '...' if len(track['name']) > 50 else track['name']
        
        table_lines.append(f"| {display_name} | {distance} | {elevation} | [View]({track['url']}) |")
    
    # Create new content
    new_content = header + "\n".join(table_lines) + "\n\n## Track Details\n\n"
    
    # Add track detail sections
    for i, track in enumerate(matched_tracks, 1):
        # Update track number
        track_slug = re.sub(r'[^a-zA-Z0-9\\s-]', '', track['name'].lower()).replace(' ', '-')
        
        section_content = f"""### {i}. {track['name']} {{#{track_slug}}}

**Track Information:**

- 📏 **Distance:** {distance}
- ⛰️  **Elevation:** {elevation}
- 🔗 **Source:** {track['url']}
- 📁 **GPX File:** `{track['new_gpx_file']}`

**Additional Details:**

- **Type:** *Not specified*
- **Difficulty:** *Not specified*
- **Description:** *Add description here*

---

"""
        new_content += section_content
    
    # Write updated file
    with open(output_md_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\\nUpdated markdown saved to: {output_md_file}")


def main():
    # Configuration
    gpx_dir = "gpx"
    md_file = "all_tracks_data.md"
    output_md_file = "cleaned_tracks_data.md"
    
    print("🔍 Analyzing tracks and GPX files...")
    
    # Extract tracks from markdown
    tracks = extract_tracks_from_markdown(md_file)
    print(f"Found {len(tracks)} tracks in markdown")
    
    # Find GPX files
    gpx_files = find_gpx_files(gpx_dir)
    print(f"Found {len(gpx_files)} GPX files")
    
    # Match tracks with GPX files
    print("\\n🔗 Matching tracks with GPX files...")
    matched_tracks, unmatched_gpx = match_tracks_with_gpx(tracks, gpx_files)
    
    if unmatched_gpx:
        print(f"\\n❓ Unmatched GPX files: {unmatched_gpx}")
    
    # Rename GPX files
    print(f"\\n📝 Renaming {len(matched_tracks)} GPX files...")
    renamed_tracks = rename_gpx_files(matched_tracks, gpx_dir)
    
    # Update markdown file
    print("\\n📄 Updating markdown file...")
    update_markdown_file(renamed_tracks, md_file, output_md_file)
    
    print(f"\\n✅ Process completed!")
    print(f"   - Matched and renamed: {len(renamed_tracks)} tracks")
    print(f"   - Removed from markdown: {len(tracks) - len(renamed_tracks)} tracks without GPX files")
    print(f"   - Updated file: {output_md_file}")


if __name__ == "__main__":
    main()