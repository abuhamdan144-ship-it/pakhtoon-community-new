const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

const functionsToPatch = [
  'startNewLegend', 'startLegendEdit', 'startNewProfile', 'startProfileEdit', 'startNewOperational', 'startOperationalEdit'
];

functionsToPatch.forEach(fn => {
  // We can just use a simple replace by looking for the function signature
  const searchString = `const ${fn} = `;
  if (!content.includes(searchString)) return;
  
  // Find start
  const startIdx = content.indexOf(searchString);
  const openBracket = content.indexOf('{', startIdx);
  
  // Basic hack: just insert startTransition(() => { after the bracket
  // and find the closing bracket before the next 'const ' or at the end
  // Actually, since they all end with '  };', we can find the next '  };'
  const nextEnd = content.indexOf('  };', openBracket);
  if (nextEnd !== -1) {
    const body = content.substring(openBracket + 1, nextEnd);
    if (!body.includes('startTransition')) {
      const replaced = `{
    startTransition(() => {` + body + `    });`;
      content = content.substring(0, openBracket) + replaced + content.substring(nextEnd);
      console.log('Patched', fn);
    }
  }
});

fs.writeFileSync(file, content);
