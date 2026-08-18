async function run() {
  const res = await fetch('https://firestore.googleapis.com/v1/projects/opc-new-48a8d/databases/(default)/documents');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
