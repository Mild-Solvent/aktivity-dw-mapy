#!/usr/bin/env python3
"""
Rename images to match exact track names from final collection
"""

import os
import re
import shutil
from pathlib import Path

def get_final_track_names():
    """Get track names from our final markdown file"""
    tracks = []
    
    # Read final tracks data
    with open('final_tracks_data.md', 'r', encoding='utf-8') as f:
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

def get_image_files():
    """Get all image files from images directory"""
    images_dir = "images"
    image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    
    image_files = []
    for file in os.listdir(images_dir):
        if any(file.lower().endswith(ext) for ext in image_extensions):
            image_files.append(file)
    
    return sorted(image_files)

def match_images_with_tracks(track_names, image_files):
    """Match image files with track names"""
    matches = []
    unmatched_images = image_files.copy()
    
    for track_name in track_names:
        track_normalized = normalize_for_matching(track_name)
        best_match = None
        best_score = 0
        
        for image_file in unmatched_images:
            # Remove extension for comparison
            image_name = os.path.splitext(image_file)[0]
            image_normalized = normalize_for_matching(image_name)
            
            # Calculate word overlap score
            track_words = set(track_normalized.split())
            image_words = set(image_normalized.split())
            
            if track_words and image_words:
                overlap = len(track_words.intersection(image_words))
                total_words = len(track_words.union(image_words))
                score = overlap / total_words if total_words > 0 else 0
                
                # Boost score if many words match
                if overlap >= 2 and score > 0.25:
                    if score > best_score:
                        best_score = score
                        best_match = image_file
        
        if best_match and best_score > 0.25:
            matches.append({
                'track_name': track_name,
                'image_file': best_match,
                'score': best_score
            })
            unmatched_images.remove(best_match)
            print(f"✓ Matched: '{track_name}' -> '{best_match}' (score: {best_score:.2f})")
        else:
            print(f"✗ No match found for: '{track_name}'")
    
    if unmatched_images:
        print(f"\n❓ Unmatched images: {unmatched_images}")
    
    return matches

def clean_filename(name):
    """Create a clean filename from track name"""
    # Replace problematic characters for filenames but keep important ones
    clean = name.replace('/', '-')  # Replace slashes with dashes
    clean = re.sub(r'[<>:"|?*]', '', clean)  # Remove Windows-problematic chars
    clean = clean.strip()
    return clean

def rename_images(matches, images_dir):
    """Rename image files to match track names"""
    renamed_count = 0
    
    for match in matches:
        old_path = os.path.join(images_dir, match['image_file'])
        
        # Get file extension
        _, ext = os.path.splitext(match['image_file'])
        
        # Create new filename
        clean_name = clean_filename(match['track_name'])
        new_filename = f"{clean_name}{ext}"
        new_path = os.path.join(images_dir, new_filename)
        
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
                        new_filename = f"{base_name}_{counter}{ext}"
                        new_path = os.path.join(images_dir, new_filename)
                        counter += 1
                
                shutil.move(old_path, new_path)
                print(f"Renamed: '{match['image_file']}' -> '{new_filename}'")
                renamed_count += 1
            else:
                print(f"No rename needed: '{match['image_file']}'")
        
        except Exception as e:
            print(f"Error renaming {old_path} to {new_path}: {e}")
    
    return renamed_count

def update_final_markdown_with_images():
    """Update final markdown to include image references"""
    images_dir = "images"
    
    # Get updated image files
    updated_images = {}
    for file in os.listdir(images_dir):
        if any(file.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
            # Remove extension to get track name
            track_name = os.path.splitext(file)[0]
            updated_images[track_name] = file
    
    # Read current final markdown
    with open('final_tracks_data.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update each track section to include image reference
    def add_image_ref(match):
        section_num = match.group(1)
        track_name = match.group(2)
        track_slug = match.group(3)
        
        # Check if we have an image for this track
        image_file = updated_images.get(track_name)
        image_ref = f"- 🖼️ **Preview Image:** `{image_file}`\n" if image_file else ""
        
        return f"""### {section_num}. {track_name} {{#{track_slug}}}

**Track Information:**

{image_ref}"""
    
    # Replace track sections with image references
    pattern = r'### (\d+)\. (.+?) \{#(.+?)\}\n\n\*\*Track Information:\*\*\n\n'
    updated_content = re.sub(pattern, add_image_ref, content)
    
    # Write updated file
    with open('final_tracks_data_with_images.md', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"\nUpdated markdown with image references: final_tracks_data_with_images.md")

def main():
    images_dir = "images"
    
    print("🔍 Getting track names from final collection...")
    track_names = get_final_track_names()
    print(f"Found {len(track_names)} tracks in final collection")
    
    print("\n📁 Getting image files...")
    image_files = get_image_files()
    print(f"Found {len(image_files)} image files")
    
    print("\n🔗 Matching images with track names...")
    matches = match_images_with_tracks(track_names, image_files)
    
    print(f"\n📝 Renaming {len(matches)} image files...")
    renamed_count = rename_images(matches, images_dir)
    
    print(f"\n📄 Updating markdown with image references...")
    update_final_markdown_with_images()
    
    print(f"\n✅ Process completed!")
    print(f"   - Successfully matched and renamed: {renamed_count} images")
    print(f"   - Total tracks with images: {len(matches)}")
    print(f"   - Updated markdown file: final_tracks_data_with_images.md")

if __name__ == "__main__":
    main()