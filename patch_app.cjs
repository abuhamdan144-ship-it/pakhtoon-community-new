const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ErrorBoundary')) {
  content = content.replace("import Loader from './components/Loader';", "import Loader from './components/Loader';\nimport ErrorBoundary from './components/ErrorBoundary';");
  
  content = content.replace(
    /<Routes>[\s\S]*?<\/Routes>/,
    "<ErrorBoundary>\n            <Routes>\n              <Route path=\"/\" element={<HTMLDesignPreview />} />\n              <Route path=\"/portal\" element={<Navigate to=\"/\" replace />} />\n              <Route path=\"/membership\" element={<Membership />} />\n              <Route path=\"/card\" element={<MemberCard />} />\n              <Route path=\"/admin\" element={<Admin />} />\n              <Route path=\"/privacy-policy\" element={<PrivacyPolicy />} />\n            </Routes>\n          </ErrorBoundary>"
  );

  fs.writeFileSync(file, content);
  console.log("Patched App.jsx");
} else {
  console.log("App.jsx already patched");
}
