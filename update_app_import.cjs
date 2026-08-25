const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.jsx', 'utf8');

if (!code.includes('import MemberCard')) {
  code = code.replace(
    "import Membership from './components/Membership';",
    "import Membership from './components/Membership';\nimport MemberCard from './components/MemberCard';"
  );
  fs.writeFileSync('/app/applet/src/App.jsx', code);
}
