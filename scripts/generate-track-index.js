#!/usr/bin/env node

/**
 * Generate Track Index Script
 * 
 * This script scans the assets/tracks folder and generates a list of available tracks.
 * It can be used to automatically update the trackLoader.js file or generate a track index.
 * 
 * Usage:
 * node scripts/generate-track-index.js
 */

const fs = require('fs');
const path = require('path');

const TRACKS_DIR = path.join(__dirname, '../assets/tracks');
const TRACK_LOADER_FILE = path.join(__dirname, '../src/utils/trackLoader.js');

function scanTracksDirectory() {
  try {
    const items = fs.readdirSync(TRACKS_DIR, { withFileTypes: true });
    
    const trackFolders = items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => name !== 'README.md' && !name.startsWith('.'));

    return trackFolders;
  } catch (error) {
    console.error('Error scanning tracks directory:', error);
    return [];
  }
}

function validateTrackFolder(trackId) {
  const trackDir = path.join(TRACKS_DIR, trackId);
  const requiredFiles = ['track-info.json', 'preview.png', 'track.gpx'];
  
  const validation = {
    trackId,
    valid: true,
    missing: [],
    errors: []
  };

  for (const file of requiredFiles) {
    const filePath = path.join(trackDir, file);
    if (!fs.existsSync(filePath)) {
      validation.valid = false;
      validation.missing.push(file);
    }
  }

  // Validate track-info.json
  try {
    const trackInfoPath = path.join(trackDir, 'track-info.json');
    if (fs.existsSync(trackInfoPath)) {
      const trackInfo = JSON.parse(fs.readFileSync(trackInfoPath, 'utf8'));
      
      if (trackInfo.id !== trackId) {
        validation.valid = false;
        validation.errors.push(`ID mismatch: folder=${trackId}, json.id=${trackInfo.id}`);
      }

      const requiredFields = ['name', 'description', 'sport', 'difficulty', 'location', 'distance', 'duration', 'elevation'];
      for (const field of requiredFields) {
        if (!trackInfo[field]) {
          validation.valid = false;
          validation.errors.push(`Missing required field: ${field}`);
        }
      }
    }
  } catch (error) {
    validation.valid = false;
    validation.errors.push(`Invalid JSON: ${error.message}`);
  }

  return validation;
}

function updateTrackLoader(trackIds) {
  // With import.meta.glob approach, we don't need to update the trackLoader
  // The glob pattern automatically picks up all track-info.json files
  console.log('✅ Using import.meta.glob - trackLoader automatically discovers tracks');
  console.log('📁 Available tracks:', trackIds.join(', '));
}

function generateTrackIndex() {
  console.log('🔍 Scanning tracks directory...');
  
  const trackFolders = scanTracksDirectory();
  console.log(`📁 Found ${trackFolders.length} track folders:`, trackFolders);
  
  if (trackFolders.length === 0) {
    console.log('⚠️  No track folders found');
    return;
  }

  console.log('\n🔎 Validating tracks...');
  const validTracks = [];
  const invalidTracks = [];

  for (const trackId of trackFolders) {
    const validation = validateTrackFolder(trackId);
    
    if (validation.valid) {
      validTracks.push(trackId);
      console.log(`✅ ${trackId}: Valid`);
    } else {
      invalidTracks.push(validation);
      console.log(`❌ ${trackId}: Invalid`);
      if (validation.missing.length > 0) {
        console.log(`   Missing files: ${validation.missing.join(', ')}`);
      }
      if (validation.errors.length > 0) {
        validation.errors.forEach(error => console.log(`   Error: ${error}`));
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Valid tracks: ${validTracks.length}`);
  console.log(`   Invalid tracks: ${invalidTracks.length}`);

  if (validTracks.length > 0) {
    console.log('\n🔄 Updating trackLoader.js...');
    updateTrackLoader(validTracks);
  }

  // Generate index.json for future use
  const indexData = {
    generated: new Date().toISOString(),
    validTracks,
    invalidTracks: invalidTracks.map(v => ({
      id: v.trackId,
      missing: v.missing,
      errors: v.errors
    }))
  };

  const indexPath = path.join(TRACKS_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  console.log('📋 Generated track index.json');

  return { validTracks, invalidTracks };
}

// Run the script
if (require.main === module) {
  generateTrackIndex();
}

module.exports = {
  scanTracksDirectory,
  validateTrackFolder,
  generateTrackIndex
};
