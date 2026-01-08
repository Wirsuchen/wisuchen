/*
  Service Account + Cloud Translate quick test

  What this tests:
  1) The JSON key file can be read and parsed
  2) google-auth-library can mint an OAuth access token
  3) Cloud Translate endpoint can be called with that token

  Run:
    node scripts/test-google-translate-sa.js
*/

const fs = require("fs")
const path = require("path")
const {GoogleAuth} = require("google-auth-library")

async function main() {
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(
      process.cwd(),
      "credentials",
      "google-translate-service-account.json"
    )

  if (!fs.existsSync(credentialsPath)) {
    console.error("❌ Credentials file not found at:", credentialsPath)
    process.exit(2)
  }

  const raw = fs.readFileSync(credentialsPath, "utf8")
  let creds
  try {
    creds = JSON.parse(raw)
  } catch (e) {
    console.error("❌ Credentials file is not valid JSON:", e.message)
    process.exit(2)
  }

  console.log("✅ Loaded service account JSON")
  console.log("   project_id:", creds.project_id)
  console.log("   client_email:", creds.client_email)

  // Per Google Auth Library docs: GoogleAuth({ keyFile, scopes }) then getClient/getAccessToken
  const auth = new GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/cloud-translation"],
  })

  let client
  try {
    client = await auth.getClient()
  } catch (e) {
    console.error(
      "❌ Failed to create auth client (key invalid or unreadable):",
      e.message
    )
    process.exit(3)
  }

  let token
  try {
    const tokenResp = await client.getAccessToken()
    token = tokenResp && tokenResp.token
  } catch (e) {
    console.error("❌ Failed to mint access token:", e.message)
    process.exit(4)
  }

  if (!token) {
    console.error("❌ No access token returned (unexpected)")
    process.exit(4)
  }

  console.log("✅ Minted access token")

  // Call Cloud Translate v2 REST API
  const url = "https://translation.googleapis.com/language/translate/v2"
  const body = {
    q: "Hello world",
    target: "de",
    source: "en",
    format: "text",
  }

  let resp
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    console.error("❌ Network error calling Cloud Translate:", e.message)
    process.exit(5)
  }

  const text = await resp.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }

  if (!resp.ok) {
    console.error("❌ Cloud Translate call failed")
    console.error("   HTTP:", resp.status)
    if (json && json.error) {
      console.error("   API error:", json.error.message)
    } else {
      console.error("   Body:", text.slice(0, 2000))
    }

    console.error("\nMost common fixes:")
    console.error(" - Enable Cloud Translation API on the project")
    console.error(" - Ensure billing is enabled for that Google Cloud project")
    console.error(
      " - Grant the service account a Translation role (e.g. Cloud Translation API User)"
    )

    process.exit(6)
  }

  const translated = json?.data?.translations?.[0]?.translatedText
  console.log("✅ Cloud Translate call succeeded")
  console.log("   Translation:", translated)
}

main().catch(e => {
  console.error("❌ Unexpected error:", e)
  process.exit(1)
})
