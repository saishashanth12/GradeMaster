const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/Scheduler.jsx',
  'frontend/src/pages/RegisterPage.jsx',
  'frontend/src/pages/ProximityAnalyzer.jsx',
  'frontend/src/pages/ProfileSettings.jsx',
  'frontend/src/pages/PlacementHub.jsx',
  'frontend/src/pages/LoginPage.jsx',
  'frontend/src/pages/CandidateDashboard.jsx',
  'frontend/src/components/Navbar.jsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace 'http://localhost:5000' with empty string
    content = content.replace(/http:\/\/localhost:5000/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced URLs in ${f}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
