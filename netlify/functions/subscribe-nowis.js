// netlify/functions/subscribe-nowis.js
//
// Adds a submitted email to a NOWIS (GVO eResponder) campaign so the
// autoresponder sequence starts. Called client-side, after a Netlify Form
// submission succeeds, from script.js.
//
// REQUIRED SETUP (Netlify dashboard, not in this file):
//   Site settings > Environment variables > add:
//     NOWIS_API_KEY = <your real API key>
//     NOWIS_CAMPAIGN_ID = <the CampaignId for "Ideal Client Alliance">
//   Never put either value directly in this file or in script.js.

const NOWIS_ENDPOINT = "http://gogvo.com/api/eresponder/add_subscriber";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email, fullName;
  try {
    const body = JSON.parse(event.body || "{}");
    email = (body.email || "").trim();
    fullName = (body.fullName || "").trim() || email;
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "error", message: "Invalid request body" }),
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "error", message: "A valid email is required" }),
    };
  }

  const apiKey = process.env.NOWIS_API_KEY;
  const campaignId = process.env.NOWIS_CAMPAIGN_ID;

  if (!apiKey || !campaignId) {
    console.error("Missing NOWIS_API_KEY or NOWIS_CAMPAIGN_ID environment variable");
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", message: "Server not configured" }),
    };
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    system: "lcs",
    CampaignId: campaignId,
    Email: email,
    FullName: fullName,
  });

  try {
    const response = await fetch(NOWIS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.status !== "success") {
      console.error("NOWIS add_subscriber failed:", data.message || data);
      return {
        statusCode: 502,
        body: JSON.stringify({ status: "error", message: data.message || "NOWIS rejected the request" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success", subscriberId: data.SubscriberId || null }),
    };
  } catch (err) {
    console.error("NOWIS request failed:", err);
    return {
      statusCode: 502,
      body: JSON.stringify({ status: "error", message: "Could not reach NOWIS" }),
    };
  }
};
