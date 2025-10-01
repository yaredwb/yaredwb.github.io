import xml.etree.ElementTree as ET
import re
import os
from datetime import datetime

# Parse the WordPress XML file
tree = ET.parse('yaredwbekelephd.WordPress.2025-06-04.xml')
root = tree.getroot()

# Define namespaces
ns = {
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'wp': 'http://wordpress.org/export/1.2/',
    'dc': 'http://purl.org/dc/elements/1.1/'
}

# Find the channel
channel = root.find('channel')

# Create _posts directory if it doesn't exist
os.makedirs('_posts', exist_ok=True)

# Function to clean HTML content and convert to markdown
def clean_content(content):
    if not content:
        return ""
    
    # Basic HTML to Markdown conversion
    content = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', r'[\2](\1)', content)
    content = re.sub(r'<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/?>', r'![{\2}](\1)', content)
    content = re.sub(r'<img[^>]*src="([^"]*)"[^>]*/?>', r'![](\1)', content)
    content = re.sub(r'<strong>(.*?)</strong>', r'**\1**', content)
    content = re.sub(r'<b>(.*?)</b>', r'**\1**', content)
    content = re.sub(r'<em>(.*?)</em>', r'*\1*', content)
    content = re.sub(r'<i>(.*?)</i>', r'*\1*', content)
    content = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1', content)
    content = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1', content)
    content = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1', content)
    content = re.sub(r'<h4[^>]*>(.*?)</h4>', r'#### \1', content)
    content = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', content)
    content = re.sub(r'<br[^>]*/?>', r'\n', content)
    content = re.sub(r'<ul[^>]*>(.*?)</ul>', r'\1', content, flags=re.DOTALL)
    content = re.sub(r'<ol[^>]*>(.*?)</ol>', r'\1', content, flags=re.DOTALL)
    content = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1\n', content)
    content = re.sub(r'<pre[^>]*>(.*?)</pre>', r'```\n\1\n```', content, flags=re.DOTALL)
    content = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', content)
    
    # Remove any remaining HTML tags
    content = re.sub(r'<[^>]+>', '', content)
    
    # Clean up extra whitespace
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    content = content.strip()
    
    # Fix image paths to use local media folder
    content = re.sub(r'https://yaredwb\.com/wp-content/uploads/', '/media/', content)
    
    return content

# Function to create a valid filename slug
def create_slug(title):
    if not title:
        return "untitled"
    
    # Convert to lowercase and replace spaces with hyphens
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    
    # Limit length
    if len(slug) > 50:
        slug = slug[:50].rstrip('-')
    
    return slug or "untitled"

# Counter for processed posts
post_count = 0

# Process each item in the channel
for item in channel.findall('item'):
    # Get post type
    post_type = item.find('wp:post_type', ns)
    if post_type is None or post_type.text != 'post':
        continue
    
    # Get post status
    status = item.find('wp:status', ns)
    if status is None or status.text != 'publish':
        continue
    
    # Get basic post information
    title_elem = item.find('title')
    title = title_elem.text if title_elem is not None and title_elem.text else "Untitled Post"
    
    # Get post date
    post_date_elem = item.find('wp:post_date', ns)
    if post_date_elem is None or not post_date_elem.text:
        continue
    
    post_date = post_date_elem.text
    date_part = post_date.split(' ')[0]
    
    # Get content
    content_elem = item.find('content:encoded', ns)
    content = content_elem.text if content_elem is not None else ""
    
    # Skip posts with no content or very short content
    if not content or len(content.strip()) < 50:
        continue
    
    # Get author
    author_elem = item.find('dc:creator', ns)
    author = author_elem.text if author_elem is not None else "yaredwb"
    
    # Get categories/tags
    categories = []
    for category in item.findall('category'):
        if category.text and category.text.strip():
            categories.append(category.text.strip())
    
    # Clean the content
    clean_post_content = clean_content(content)
    
    # Create filename
    slug = create_slug(title)
    filename = f"{date_part}-{slug}.md"
    filepath = os.path.join('_posts', filename)
    
    # Create front matter
    front_matter = f"""---
layout: default
title: "{title}"
date: {post_date}
author: {author}"""
    
    if categories:
        front_matter += f"\ncategories: [{', '.join([f'"{cat}"' for cat in categories[:5]])}]"
    
    front_matter += "\n---\n\n"
    
    # Write the post file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(front_matter + clean_post_content)
    
    post_count += 1
    print(f"Created post: {filename}")

print(f"\nTotal posts migrated: {post_count}")