// netlify/functions/get-thanks.js
// Retourne les derniers remerciements sauvegardés (lu par le widget)
const fs = require("fs");
const THANKS_FILE = "/tmp/circle-thanks.json";

function json(code, body) {
  return {
    statusCode: code,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async () => {
  try {
    if (!fs.existsSync(THANKS_FILE)) {
      return json(200, { thanks: [] });
    }
    const all = JSON.parse(fs.readFileSync(THANKS_FILE, "utf8"));
    // Retourne les 10 derniers
    return json(200, { thanks: all.slice(-10) });
  } catch {
    return json(200, { thanks: [] });
  }
};
