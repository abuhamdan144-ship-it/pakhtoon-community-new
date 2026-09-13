const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ErrorBoundary')) {
  content = content.replace(
    "import { defaultHeroLegends } from '../data/heroLegends';",
    "import { defaultHeroLegends } from '../data/heroLegends';\nimport ErrorBoundary from './ErrorBoundary';"
  );
  
  content = content.replace(
    /<AnimatePresence mode="wait"><motion\.div key=\{activeTab\} [^>]*>/,
    "$&<ErrorBoundary fallback={<div className=\"p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-200 mt-4\">Failed to load this tab. Please try another section.</div>}>"
  );
  
  content = content.replace(
    /<\/motion\.div><\/AnimatePresence>/,
    "</ErrorBoundary>$&"
  );
  
  fs.writeFileSync(file, content);
  console.log("Patched Admin.jsx with ErrorBoundary");
} else {
  console.log("Admin.jsx already patched");
}
