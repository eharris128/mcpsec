# AGENTS.md - AI Agent Guide for MCP Security Research Blog

## Project Overview

This is a Jekyll-based static blog site focused on MCP (Model Context Protocol) security research, hosted on GitHub Pages.

- **Technology Stack**: Jekyll 4.3, Ruby, GitHub Pages
- **Theme**: Minima 2.5.2
- **Purpose**: Publishing security advisories, research, and analysis related to AI agents and MCP implementations
- **Live Site**: https://mcpsec.dev
- **Repository**: git@github.com:eharris128/mcpsec.git

## Key Commands

```bash
# Local development server (default port 4000)
bundle exec jekyll serve

# Build the site
bundle exec jekyll build

# Install/update dependencies
bundle install

# Clean build artifacts
bundle exec jekyll clean
```

## Project Structure

```
.
├── _advisories/          # Security advisories collection
├── _includes/            # Reusable HTML components
│   └── email-cta.html   # Email signup CTA component
├── _layouts/             # Page templates
│   └── post.html        # Blog post layout
├── _site/               # Generated site (gitignored)
├── .jekyll-cache/       # Build cache
├── assets/              # Static assets (images, CSS)
├── advisories/          # Advisories index page
├── .claude/             # Claude-specific files
├── _config.yml          # Jekyll configuration
├── Gemfile              # Ruby dependencies
├── Gemfile.lock         # Locked dependency versions
├── CNAME                # Custom domain configuration
├── index.md             # Homepage
├── about.md             # About page
├── 404.md               # 404 error page
├── robots.txt           # SEO/crawler directives
├── llms.txt             # LLM-specific information
└── favicon.ico          # Site favicon
```

## Content Management

### Creating Blog Posts

Blog posts should be placed in the root directory or a `_posts/` directory (if created) with the naming convention:
```
YYYY-MM-DD-title-of-post.md
```

### Creating Security Advisories

1. Add new advisory to `_advisories/` directory
2. Use format: `YYYY-MM-DD-advisory-title.md`
3. Include front matter:
```yaml
---
layout: post
title: "Advisory Title"
date: YYYY-MM-DD
categories: [security, mcp]
---
```

### Markdown Configuration
- **Processor**: Kramdown
- **Syntax Highlighter**: Rouge
- Supports GitHub Flavored Markdown

## Configuration Details

### Key _config.yml Settings
- **Title**: MCP Security Research
- **URL**: https://mcpsec.dev
- **Permalink Structure**: `/blog/:year/:month/:title/`
- **Collections**: 
  - advisories (output: true, permalink: `/advisories/:name/`)

### Plugins
- jekyll-feed (RSS feed generation)
- jekyll-seo-tag (SEO metadata)
- jekyll-sitemap (sitemap.xml generation)

### Social/SEO
- **Twitter**: @Evan__Harris
- **OpenGraph Image**: `/assets/og-image.png`

## Development Workflow

### Local Setup
1. Ensure Ruby is installed
2. Install bundler: `gem install bundler`
3. Install dependencies: `bundle install`
4. Start development server: `bundle exec jekyll serve`
5. View site at `http://localhost:4000`

### Git Workflow
- **Main Branch**: master
- **Remote**: origin (GitHub)
- **Deploy Branch**: GitHub Pages deploys from master

### Making Changes
1. Edit files locally
2. Test with `bundle exec jekyll serve`
3. Commit changes to master
4. Push to GitHub: `git push origin master`
5. GitHub Pages automatically rebuilds

## Deployment

### GitHub Pages
- **Hosting**: GitHub Pages
- **Custom Domain**: mcpsec.dev (configured via CNAME file)
- **Build**: Automatic on push to master branch
- **SSL**: Provided by GitHub Pages

### Build Process
1. Push to master triggers GitHub Pages build
2. Jekyll builds the static site
3. Site is deployed to https://mcpsec.dev

## Important Notes

### Jekyll Conventions
- Front matter is required for all content files
- Use `layout: post` for blog posts and advisories
- Place reusable components in `_includes/`
- Custom layouts go in `_layouts/`

### Ruby/Bundler Requirements
- Ruby version: Check `.ruby-version` if exists
- Bundler manages gem dependencies
- Always use `bundle exec` prefix for Jekyll commands

### Security Considerations
- Never commit sensitive data
- Keep dependencies updated: `bundle update`
- Review security advisories for gems

### File Editing Guidelines
- Preserve existing code style and formatting
- Follow Jekyll/Liquid template syntax
- Maintain consistent markdown formatting
- Test all changes locally before pushing

## Common Tasks

### Adding a New Page
1. Create `.md` file in root directory
2. Add front matter with layout and title
3. Add to navigation in `_config.yml` under `header_pages`

### Updating Dependencies
```bash
bundle update              # Update all gems
bundle update jekyll       # Update specific gem
```

### Troubleshooting
- Clear cache if build issues: `bundle exec jekyll clean`
- Check Jekyll version compatibility
- Ensure all gems are installed: `bundle install`
- Verify YAML syntax in _config.yml and front matter

## Additional Resources
- Jekyll Documentation: https://jekyllrb.com/docs/
- GitHub Pages: https://pages.github.com/
- Minima Theme: https://github.com/jekyll/minima