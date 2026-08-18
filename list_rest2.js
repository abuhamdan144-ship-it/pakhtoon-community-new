async function run() {
  const apiKey = "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo";
  const url = `https://firestore.googleapis.com/v1/projects/opc-new-48a8d/databases/(default)/documents?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
