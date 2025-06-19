import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
import re, sys

xml_file = sys.argv[1] if len(sys.argv) > 1 else 'yaredwbekelephd.WordPress.2025-06-04.xml'
ns = {'wp': 'http://wordpress.org/export/1.2/', 'content': 'http://purl.org/rss/1.0/modules/content/'}
root = ET.parse(xml_file).getroot()
channel = root.find('channel')
out_dir = Path('_posts')
out_dir.mkdir(exist_ok=True)
for item in channel.findall('item'):
    post_type = item.find('wp:post_type', ns)
    status = item.find('wp:status', ns)
    if post_type is None or post_type.text != 'post':
        continue
    if status is not None and status.text != 'publish':
        continue
    title = item.find('title').text or 'Untitled'
    date_str = item.find('wp:post_date', ns).text
    slug = item.find('wp:post_name', ns).text or re.sub(r'\W+', '-', title.lower()).strip('-')
    content = item.find('content:encoded', ns).text or ''
    date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    filename = f"{date:%Y-%m-%d}-{slug}.md"
    fm = f"---\nlayout: post\ntitle: \"{title.replace('"','\\"')}\"\n---\n"
    out_path = out_dir / filename
    out_path.write_text(fm + '\n' + content)
    print('Wrote', out_path)
