import fs from 'fs';
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "    match /ads/{adId} {\n      allow read: if true;\n      allow create, update: if isAdmin() && isValidAd(request.resource.data);\n      allow delete: if isAdmin();\n    }\n  }\n}    match /Members/{docId} {\n      allow read: if true;\n    }\n    match /Cabinet/{docId} {\n      allow read: if true;\n    }",
  "    match /ads/{adId} {\n      allow read: if true;\n      allow create, update: if isAdmin() && isValidAd(request.resource.data);\n      allow delete: if isAdmin();\n    }\n\n    match /Members/{docId} {\n      allow read: if true;\n    }\n    match /Cabinet/{docId} {\n      allow read: if true;\n    }\n  }\n}"
);

fs.writeFileSync('firestore.rules', rules);
console.log('Fixed rules');
