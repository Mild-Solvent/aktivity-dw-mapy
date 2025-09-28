#!/usr/bin/env python3
"""
Swap preview.png and profil.png names in all track folders
"""

import os
import shutil
from pathlib import Path

def swap_images_in_track(track_dir):
    """Swap preview.png and profil.png in a single track directory"""
    preview_file = track_dir / "preview.png"
    profil_file = track_dir / "profil.png"
    temp_file = track_dir / "temp_swap.png"
    
    swapped = False
    
    # Only proceed if both files exist
    if preview_file.exists() and profil_file.exists():
        try:
            # Use temporary file for safe swapping
            shutil.move(str(preview_file), str(temp_file))
            shutil.move(str(profil_file), str(preview_file))
            shutil.move(str(temp_file), str(profil_file))
            swapped = True
            print(f"✓ Swapped images in: {track_dir.name}")
        except Exception as e:
            print(f"✗ Error swapping in {track_dir.name}: {e}")
    elif preview_file.exists() and not profil_file.exists():
        print(f"○ Only preview.png exists in: {track_dir.name}")
    elif profil_file.exists() and not preview_file.exists():
        print(f"○ Only profil.png exists in: {track_dir.name}")
    else:
        print(f"○ No PNG files to swap in: {track_dir.name}")
    
    return swapped

def main():
    print("🔄 Starting image swap process...")
    
    tracks_dir = Path("assets/tracks")
    
    if not tracks_dir.exists():
        print("❌ assets/tracks directory not found!")
        return
    
    swapped_count = 0
    total_dirs = 0
    
    # Process each track directory
    for item in tracks_dir.iterdir():
        if item.is_dir() and not item.name.startswith('.') and item.name != '__pycache__':
            total_dirs += 1
            if swap_images_in_track(item):
                swapped_count += 1
    
    print(f"\n✅ Image swap completed!")
    print(f"   - Processed: {total_dirs} track directories")
    print(f"   - Swapped: {swapped_count} track image pairs")
    print(f"   - Skipped: {total_dirs - swapped_count} tracks (missing one or both images)")

if __name__ == "__main__":
    main()