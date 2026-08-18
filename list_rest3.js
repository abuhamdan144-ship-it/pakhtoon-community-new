async function run() {
  const url = `https://firestore.googleapis.com/v1/projects/opc-new-48a8d/databases/(default)/documents:listCollectionIds?key=AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo`;
  const res = await fetch(url, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }});
  const text = await res.text();
  console.log(res.status, text);
}
run();
