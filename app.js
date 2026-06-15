// require("dotenv").config();

// const { Client, LocalAuth } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");
// const { google } = require("googleapis");

// const client = new Client({
//   authStrategy: new LocalAuth({
//     clientId: "vecura-bot",
//   }),
//   puppeteer: {
//     headless: false,
//     executablePath:
//       "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//     args: ["--no-sandbox"],
//   },
// });

// // QR Event
// client.on("qr", (qr) => {
//   console.log("📱 Scan QR Code");
//   qrcode.generate(qr, { small: true });
// });

// // Authenticated
// client.on("authenticated", () => {
//   console.log("✅ AUTHENTICATED");
// });

// // Ready
// client.on("ready", () => {
//   console.log("✅ WhatsApp Connected");
// });

// // Auth Failure
// client.on("auth_failure", (msg) => {
//   console.log(" AUTH FAILURE");
//   console.log(msg);
// });

// // Disconnected
// client.on("disconnected", (reason) => {
//   console.log(" DISCONNECTED:", reason);
// });

// // async function saveToSheet(sender, reelUrl) {
// //   try {
// //     const auth = new google.auth.GoogleAuth({
// //       keyFile: "./service-account.json",
// //       scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// //     });

// //     const sheets = google.sheets({
// //       version: "v4",
// //       auth,
// //     });
 
// //     await sheets.spreadsheets.values.append({
// //       spreadsheetId: process.env.SHEET_ID,
// //       range: "Sheet1!A:C",
// //       valueInputOption: "USER_ENTERED",
// //       resource: {
// //         values: [
// //           [
// //             new Date().toLocaleString(),
// //             sender,
// //             reelUrl,
// //           ],
// //         ],
// //       },
// //     });

// //     console.log("✅ Saved To Google Sheet");
// //     console.log("Sender:", sender);
// //     console.log("Link:", reelUrl);

// //   } catch (error) {
// //     console.error("❌ Google Sheet Error");
// //     console.error(error.message);
// //   }
// // }
// async function saveToSheet(sender, reelUrl) {
//   try {
//     const auth = new google.auth.GoogleAuth({
//       credentials: JSON.parse(process.env.GOOGLE_CREDS),
//       scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//     });

//     const sheets = google.sheets({ version: "v4", auth });

//     await sheets.spreadsheets.values.append({
//       spreadsheetId: process.env.SHEET_ID,
//       range: "Sheet1!A:C",
//       valueInputOption: "USER_ENTERED",
//       resource: {
//         values: [[
//           new Date().toLocaleString(),
//           sender,
//           reelUrl,
//         ]],
//       },
//     });

//     console.log("✅ Saved To Sheet");
//   } catch (err) {
//     console.log("❌ Sheet Error:", err.message);
//   }
// }
// client.on("message", async (msg) => {
//   try {

//     // Group only
//     if (!msg.from.includes("@g.us")) {
//       return;
//     }

//     const chat = await msg.getChat();

//     console.log("Group Name:", chat.name);

//     // Exact group name
//     if (chat.name !== "Vcura") {
//       return;
//     }

//     const messageText = msg.body || "";

//     // Instagram link only
//     const instaLink = messageText.match(
//       /https?:\/\/(www\.)?instagram\.com\/[^\s]+/i
//     );

//     if (!instaLink) {
//       return;
//     }

//     const contact = await msg.getContact();

//     const senderName =
//       contact.pushname ||
//       contact.name ||
//       msg.author ||
//       "Unknown";

//     await saveToSheet(
//       senderName,
//       instaLink[0]
//     );

//   } catch (err) {
//     console.error("❌ Error:", err.message);
//   }
// });

// client.initialize();
require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const { google } = require("googleapis");
const http = require("http");

let currentQR = "";

const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  if (req.url === "/qr" && currentQR) {
    const qrImage = await QRCode.toDataURL(currentQR);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<html><body style="text-align:center;font-family:sans-serif;margin-top:50px">
      <h2>📱 Scan with WhatsApp</h2>
      <img src="${qrImage}" style="width:300px;height:300px"/>
      <p>WhatsApp → Settings → Linked Devices → Link a Device</p>
      <p><small>Refresh if expired</small></p>
    </body></html>`);
  } else if (req.url === "/qr") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<html><body style="text-align:center;font-family:sans-serif;margin-top:50px">
      <h2>✅ Bot already connected!</h2>
    </body></html>`);
  } else {
    res.writeHead(200);
    res.end("Bot is running ✅");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

const isLocal = !process.env.RAILWAY_ENVIRONMENT;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "vecura-bot" }),
  puppeteer: {
    headless: isLocal ? false : true,
    executablePath: isLocal
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-extensions",
    ],
  },
});

client.on("qr", async (qr) => {
  currentQR = qr;
  console.log("📱 QR Ready!");
  qrcode.generate(qr, { small: true });
  if (isLocal) {
    console.log("Open: http://localhost:3000/qr");
  }
});

client.on("authenticated", () => {
  currentQR = "";
  console.log("✅ AUTHENTICATED");
});

client.on("ready", () => {
  console.log("✅ WhatsApp Connected");
});

client.on("auth_failure", (msg) => {
  console.log("❌ AUTH FAILURE", msg);
});

client.on("disconnected", (reason) => {
  console.log("❌ DISCONNECTED:", reason);
});

async function saveToSheet(sender, reelUrl) {
  try {
    if (!process.env.GOOGLE_CREDS || !process.env.SHEET_ID) {
      console.log("Missing env variables");
      return;
    }
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[new Date().toLocaleString(), sender, reelUrl]],
      },
    });
    console.log("✅ Saved To Sheet");
  } catch (err) {
    console.log("❌ Sheet Error:", err.message);
  }
}

client.on("message", async (msg) => {
  try {
    if (!msg.from.includes("@g.us")) return;
    const chat = await msg.getChat();
    console.log("Group Name:", chat.name);
    if (chat.name !== "Vcura") return;
    const messageText = msg.body || "";
    const instaLink = messageText.match(
      /https?:\/\/(www\.)?instagram\.com\/[^\s]+/i
    );
    if (!instaLink) return;
    const contact = await msg.getContact();
    const senderName = contact.pushname || contact.name || msg.author || "Unknown";
    await saveToSheet(senderName, instaLink[0]);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
});

client.initialize();