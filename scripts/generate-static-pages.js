import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import tracks data
import { tracks } from '../src/data/tracks.js';

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '../dist');
const trackDir = path.join(distDir, 'track');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
}

// Read the main index.html template
const indexTemplate = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

// Generate static HTML for each track
tracks.forEach(track => {
    console.log(`Generating static page for: ${track.name}`);
    
    // Create track-specific HTML
    const trackHtml = indexTemplate
        .replace('<title>ACTIVITY DW Club - Objavte Úžasné Trasy</title>', 
                `<title>${track.name} - ACTIVITY DW Club</title>`)
        .replace('<meta name="description" content="ACTIVITY DW Club - Nájdite najlepšie bežecké, cyklistické a turistické trasy vo vašom okolí" />', 
                `<meta name="description" content="${track.description}" />`)
        // Add Open Graph tags for better sharing
        .replace('</head>', `
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${track.name} - ACTIVITY DW Club">
    <meta property="og:description" content="${track.description}">
    <meta property="og:image" content="https://aktivity.ceaeurope.sk${track.previewImage}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${track.name} - ACTIVITY DW Club">
    <meta property="twitter:description" content="${track.description}">
    <meta property="twitter:image" content="https://aktivity.ceaeurope.sk${track.previewImage}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://aktivity.ceaeurope.sk/track/${track.id}">
    
    <!-- Preload specific track data -->
    <script>
        window.__INITIAL_TRACK_ID__ = "${track.id}";
    </script>
</head>`);
    
    // Create track directory
    const trackSpecificDir = path.join(trackDir, track.id);
    if (!fs.existsSync(trackSpecificDir)) {
        fs.mkdirSync(trackSpecificDir, { recursive: true });
    }
    
    // Write the HTML file
    fs.writeFileSync(path.join(trackSpecificDir, 'index.html'), trackHtml);
});

// Also generate a sitemap.xml
const sitemapUrls = [
    'https://aktivity.ceaeurope.sk/',
    ...tracks.map(track => `https://aktivity.ceaeurope.sk/track/${track.id}`)
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url.includes('/track/') ? '0.8' : '1.0'}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`✅ Generated ${tracks.length} static track pages`);
console.log(`✅ Generated sitemap with ${sitemapUrls.length} URLs`);