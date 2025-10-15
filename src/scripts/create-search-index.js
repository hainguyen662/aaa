const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const docsDir = path.join(__dirname, '..', 'docs');
const outputDir = path.join(__dirname, '..', 'static');
const outputFile = path.join(outputDir, 'search-index.json');

function getDocs(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getDocs(filePath));
    } else if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: body } = matter(content);
      
      const cleanedBody = body
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/<[\s\S]*?>/g, '')   // Remove HTML tags
        .replace(/#+/g, '')           // Remove markdown headings
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text
        .replace(/\s+/g, ' ')         // Collapse whitespace
        .trim();

      results.push({
        title: data.title || path.basename(filePath, path.extname(filePath)),
        content: cleanedBody,
        path: ('/ops/' + path.relative(path.join(__dirname, '..'), filePath)).replace(/\\/g, '/').replace('docs/', 'docs/').replace(/\.mdx?$/, ''),
      });
    }
  });
  return results;
}

try {
  const docs = getDocs(docsDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(docs, null, 2));

  console.log(`✅ Search index with ${docs.length} documents created at ${outputFile}`);
} catch (error) {
  console.error('Error creating search index:', error);
}
