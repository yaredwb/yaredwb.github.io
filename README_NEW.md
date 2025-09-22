# Yared W. Bekele, PhD - Personal Website

A clean, professional Jekyll website for showcasing research, teaching, and writing in computational geomechanics and applied AI.

## 🎨 Design Highlights

This website features a modern, researcher-focused design with:

### Visual Design
- **Clean, professional aesthetic** with a sophisticated color palette
- **Enhanced typography** with improved hierarchy and readability  
- **Gradient hero section** with animated background elements
- **Card-based layout** for content organization
- **Subtle animations** and hover effects for improved interactivity

### User Experience
- **Fully responsive design** that works beautifully on all devices
- **Accessibility features** including skip links and proper ARIA labels
- **Dark mode support** that respects user preferences
- **Fast loading** with optimized CSS and minimal JavaScript

## 🚀 Local Development

1. Install Ruby and Bundler if they are not already available.
2. Install dependencies: `bundle install`
3. Start the local server: `bundle exec jekyll serve`
4. Visit http://localhost:4000 to preview changes.

## ✍️ Creating a New Post

1. Start from the draft template in `_drafts/post-template.md`, or copy any file in `_posts/`
2. Name the file: `YYYY-MM-DD-your-title.md`
3. Update the front matter:
   ```yaml
   ---
   layout: post
   title: "Your Post Title"
   date: 2025-09-20
   categories: [topic]
   description: Optional short summary.
   ---
   ```
4. Write the post in Markdown below the front matter
5. Move the file into `_posts/` (if not there already), commit, and push

The new entry will appear on the home page and Writing page automatically.

## 📁 Content Structure

### Pages
- **Home** (`index.md`) - Main landing page with hero and overview
- **Writing** (`blog.md`) - Blog listing with post previews  
- **Research** (`research.md`) - Publications, projects, and tools
- **Teaching** (`teaching.md`) - Courses and mentorship activities
- **Resume** (`resume.md`) - Professional background and experience

### Posts
Located in `_posts/` directory with markdown format and proper front matter for easy content management and automated post listing.

## 🎯 Technical Features

- **Modern CSS** with custom properties and advanced layouts
- **Performance optimized** with efficient animations and loading
- **SEO-friendly** with proper meta tags and structured markup
- **Print-friendly** styles for academic use cases
- **Dark mode support** that respects user preferences

## 📱 Content Guide

- Use Markdown for regular content; short HTML snippets are supported when needed
- Images should live in the `media/` folder and be referenced with absolute paths such as `/media/example.jpg`
- Pages use pretty URLs (`/resume/`, `/research/`, etc.), so prefer linking with those paths
- The site automatically generates post listings, RSS feed, and sitemap

---

**Built with dedication to computational excellence** - A website that reflects the precision and innovation of modern computational research.
