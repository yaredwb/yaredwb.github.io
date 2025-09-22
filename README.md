## Personal site

Static site for [yaredwb.github.io](https://yaredwb.github.io/), powered by Jekyll.

### Local development

1. Install Ruby and Bundler if they are not already available.
2. Install dependencies: undle install.
3. Start the local server: undle exec jekyll serve.
4. Visit http://localhost:4000 to preview changes.

### Creating a new post

1. Start from the draft template in _drafts/post-template.md, or run one of the following:
   - undle exec jekyll post "Your Post Title" if you have the jekyll-compose gem installed.
   - Copy any file in _posts/ and rename it to YYYY-MM-DD-your-title.md.
2. Update the front matter:
   `yaml
   ---
   layout: post
   title: "Your Post Title"
   date: 2025-09-20
   categories: [topic]
   description: Optional short summary.
   ---
   `
3. Write the post in Markdown below the front matter.
4. Move the file into _posts/ (if it is not there already), commit, and push. The new entry will appear on the home page and on the Writing page automatically.

### Content guide

- Use Markdown for regular content; short HTML snippets are supported when needed.
- Images should live in the media/ folder and be referenced with absolute paths such as /media/example.jpg.
- Pages use pretty URLs (/resume/, /research/, etc.), so prefer linking with those paths.
