const { connectDB } = require("./config/db");
const axios = require("axios");

async function testWeb() {
  try {
    await axios.get("http://localhost:5000/auth/callback?code=testcode123");
    console.log("Web route test passed");
  } catch (e) {
    console.error("Web route test failed", e.message);
  }
}

(async () => {
  console.log("Testing Database Connection...");
  await connectDB();

  // We can't easily test the web route without the server running,
  // but the user will run `npm start` which runs the server.
  // This script mainly verifies the DB config works isolated.
  process.exit(0);
})();
