const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.jsx', 'utf8');

if (!code.includes('MemberCard')) {
  code = code.replace(
    "import Membership from './pages/Register';",
    "import Membership from './pages/Register';\nimport MemberCard from './components/MemberCard';"
  );
  
  code = code.replace(
    "<Route path=\"/membership\" element={<Membership />} />",
    "<Route path=\"/membership\" element={<Membership />} />\n            <Route path=\"/card\" element={<MemberCard />} />"
  );
  fs.writeFileSync('/app/applet/src/App.jsx', code);
}
