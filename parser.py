import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import html2text
import os
from datetime import datetime

# Initialize html2text converter
h = html2text.HTML2Text()
h.body_width = 0  # Don't wrap lines

def parse_xml(file_path):
    """Parses the WordPress XML file and extracts posts and pages."""
    tree = ET.parse(file_path)
    root = tree.getroot()

    items = []
    for item in root.findall('.//item'):
        post_type = item.find('{http://wordpress.org/export/1.2/}post_type').text
        title = item.find('title').text
        content_encoded = item.find('{http://purl.org/rss/1.0/modules/content/}encoded').text
        pub_date_str = item.find('pubDate').text
        link = item.find('link').text
        post_id = item.find('{http://wordpress.org/export/1.2/}post_id').text
        status = item.find('{http://wordpress.org/export/1.2/}status').text

        # Convert HTML content to Markdown
        # Ensure content_encoded is not None before processing
        markdown_content = ""
        if content_encoded:
            # Use BeautifulSoup to handle HTML entities and structure before html2text
            soup = BeautifulSoup(content_encoded, 'lxml')

            # Remove unwanted tags or elements if necessary
            # For example, remove script and style tags
            for script_or_style in soup(["script", "style"]):
                script_or_style.decompose()

            # Convert HTML to Markdown
            markdown_content = h.handle(str(soup))

        # Handle potential None values for title
        if title is None:
            title = "Untitled Post" # Or use post_id or another identifier

        # Parse the publication date
        try:
            # Example format: Wed, 04 Jun 2025 13:55:41 +0000
            # Adjust format string as per your XML's date format
            pub_date = datetime.strptime(pub_date_str, '%a, %d %b %Y %H:%M:%S +0000')
        except ValueError:
            # Fallback if parsing fails, e.g. use current time or a default date
            pub_date = datetime.now()


        categories = [cat.text for cat in item.findall('category[@domain="category"]')]
        tags = [tag.text for tag in item.findall('category[@domain="post_tag"]')]

        items.append({
            'id': post_id,
            'type': post_type,
            'title': title,
            'content': markdown_content,
            'date': pub_date,
            'link': link,
            'status': status,
            'categories': categories,
            'tags': tags
        })

    return items

def save_content(items):
    """Saves posts and pages into appropriate Jekyll directories."""
    posts_dir = "_posts"
    pages_dir = "_pages" # Or just root for pages like 'about.md'

    # The script will now print arguments for create_file_with_block
    # instead of directly creating files.

    for item in items:
        # Sanitize title for filename
        # Replace spaces and special characters with underscores
        # Ensure it's a valid filename
        # Ensure only ASCII characters are used in filenames
        sanitized_title = "".join(c if c.isalnum() and c.isascii() else "_" for c in item['title'])
        # Truncate if too long, ensuring it doesn't just become "____"
        filename_title = sanitized_title[:50] if sanitized_title else f"item_{item['id']}"
        if not any(c.isalnum() for c in filename_title): # Check if filename_title is only underscores
            filename_title = f"item_{item['id']}"

        # Specific handling for "Résumé" to become "resume"
        if item['title'].lower() == "résumé":
            filename_title = "resume"


        # Format date for filename (Jekyll convention: YYYY-MM-DD-title.md)
        date_prefix = item['date'].strftime('%Y-%m-%d')

        content_to_write = ""
        filepath_str = ""

        if item['type'] == 'post' and item['status'] == 'publish':
            # Ensure posts_dir exists (though create_file_with_block should handle it)
            # os.makedirs(posts_dir, exist_ok=True) # Not needed with create_file_with_block

            # Ensure filename_title is not empty or just underscores
            if not filename_title.strip('_'):
                filename_title = f"post_{item['id']}"

            filepath_str = f"_posts/{date_prefix}-{filename_title}.md"
            front_matter = f"""---
layout: post
title: "{item['title'].replace('"', '\\"')}"
date: {item['date'].strftime('%Y-%m-%d %H:%M:%S %z')}
categories: {str(item['categories'])}
tags: {str(item['tags'])}
---\n\n"""
            content_to_write = front_matter + item['content']

        elif item['type'] == 'page' and item['status'] == 'publish':
            # os.makedirs(pages_dir, exist_ok=True) # Not needed

            # Ensure filename_title is not empty or just underscores for pages
            if not filename_title.strip('_'):
                 filename_title = f"page_{item['id']}"

            # Make permalink more robust
            permalink_title = filename_title.lower().replace('_', '-')

            # For pages, Jekyll typically expects them in the root or a collection.
            # Let's try placing them in a '_pages' directory for organization,
            # and ensure permalinks are set correctly.
            # If pages should be in root, filepath_str would be f"{filename_title.lower()}.md"
            filepath_str = f"_pages/{filename_title.lower()}.md"
            front_matter = f"""---
layout: page
title: "{item['title'].replace('"', '\\"')}"
permalink: /{permalink_title}/
---\n\n"""
            content_to_write = front_matter + item['content']

        else:
            # Skip drafts or other types
            print(f"Skipping item: {item['title']} (type: {item['type']}, status: {item['status']})")
            continue

        # Print arguments for create_file_with_block
        # This will be captured and used by the agent
        print("CREATE_FILE_ARGS_START")
        print(filepath_str)
        print(content_to_write)
        print("CREATE_FILE_ARGS_END")
        print(f"Prepared arguments for: {filepath_str}")


if __name__ == '__main__':
    xml_file = 'yaredwbekelephd.WordPress.2025-06-04.xml'
    parsed_items = parse_xml(xml_file)

    # Filter for items that are either post or page and have status 'publish'
    # to avoid attempting to generate files for items that will be skipped.
    publishable_items_count = sum(1 for item in parsed_items if item['type'] in ['post', 'page'] and item['status'] == 'publish')

    print(f"Starting content saving process for {publishable_items_count} publishable items...")
    save_content(parsed_items)
    print(f"Finished processing. Processed {len(parsed_items)} items in total from XML.")
    print(f"Generated arguments for {publishable_items_count} files to be created.")
