const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Parse YAML front matter from markdown files
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---/;
    const match = content.match(frontMatterRegex);

    if (!match) {
        return null;
    }

    const frontMatter = {};
    const lines = match[1].split('\n');

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        // Parse arrays (categories)
        if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(v => v.trim());
        }

        frontMatter[key] = value;
    }

    return frontMatter;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Generate HTML from template
function generateHTML(template, data) {
    let html = template;

    // Replace title
    html = html.replace('{{TITLE}}', data.title || 'Security Advisory');

    // Replace date
    html = html.replace('{{DATE}}', formatDate(data.date) || '');

    // Replace categories
    const categoriesHTML = (data.categories || [])
        .map(cat => `<div class="category">${cat}</div>`)
        .join('');
    html = html.replace('{{CATEGORIES}}', categoriesHTML);

    return html;
}

async function generateOGImages() {
    console.log('Starting OG image generation...');

    // Paths
    const advisoriesDir = path.join(__dirname, '..', '_advisories');
    const templatePath = path.join(__dirname, '..', '_templates', 'og-image.html');
    const outputDir = path.join(__dirname, '..', 'assets', 'og');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    // Read template
    const template = fs.readFileSync(templatePath, 'utf8');
    console.log('Template loaded');

    // Get all markdown files in advisories directory
    const files = fs.readdirSync(advisoriesDir).filter(f => f.endsWith('.md'));
    console.log(`Found ${files.length} advisory files`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const file of files) {
            const filePath = path.join(advisoriesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const frontMatter = parseFrontMatter(content);

            if (!frontMatter) {
                console.warn(`⚠️  No front matter found in ${file}, skipping`);
                continue;
            }

            // Generate slug from filename (remove .md extension)
            const slug = file.replace('.md', '');
            const outputPath = path.join(outputDir, `${slug}.png`);

            // Generate HTML with data
            const html = generateHTML(template, frontMatter);

            // Create a new page
            const page = await browser.newPage();

            // Set viewport to OG image size
            await page.setViewport({
                width: 1200,
                height: 630,
                deviceScaleFactor: 2 // For better quality
            });

            // Set content
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            // Take screenshot
            await page.screenshot({
                path: outputPath,
                type: 'png'
            });

            await page.close();

            console.log(`✓ Generated: ${slug}.png`);
        }
    } finally {
        await browser.close();
    }

    console.log('✅ OG image generation complete!');
}

// Run the generation
generateOGImages().catch(error => {
    console.error('Error generating OG images:', error);
    process.exit(1);
});
