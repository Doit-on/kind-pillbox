/**
 * เซิร์ฟเวอร์ตลับยาใจดี (Kind Pillbox Local Server)
 * รันด้วย Node.js มาตรฐาน ไม่ต้องติดตั้งไลบรารีเสริมใดๆ เพิ่มเติม
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MASTER_DRUGS } from "./src/data/master_drugs.js";
import { PharmacokineticEngine } from "./src/core/pharmacology/pharmacokinetics.js";
import { MissedDoseAdvisor } from "./src/core/pharmacology/missed_dose_advisor.js";
import { PrescriptionScanner } from "./src/core/ocr/prescription_scanner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. API: สแกนและตรวจสอบข้อมูลซองยา (/api/scan)
  if (pathname === "/api/scan" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const scanResult = PrescriptionScanner.parsePrescriptionText(payload.text || "");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(scanResult));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  // 2. API: ประเมินการทานยาไม่ตรงเวลา (/api/missed-dose)
  if (pathname === "/api/missed-dose" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const drug = MASTER_DRUGS[payload.drugKey] || MASTER_DRUGS.amlodipine;
        const now = new Date();
        const scheduled = payload.scheduledTime ? new Date(payload.scheduledTime) : new Date(now.getTime() - (2 * 3600 * 1000));
        const next = payload.nextTime ? new Date(payload.nextTime) : new Date(now.getTime() + (10 * 3600 * 1000));

        const evaluation = MissedDoseAdvisor.evaluateMissedDose({
          drug,
          scheduledTime: scheduled,
          currentTime: now,
          nextScheduledTime: next,
          hasEatenFood: payload.hasEatenFood ?? true
        });

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(evaluation));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 3. Static File Serving: เสิร์ฟหน้าเว็บแอปพลิเคชัน
  let filePath = path.join(__dirname, "src", "presentation", pathname === "/" ? "index.html" : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, "src", "presentation", "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "text/plain";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end("500 Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log("=================================================================");
  console.log(`🌸 เซิร์ฟเวอร์ตลับยาใจดี กำลังทำงานที่: http://localhost:${PORT}`);
  console.log("=================================================================");
  console.log("👉 เปิดเว็บเบราว์เซอร์หรือมือถือ เพื่อทดสอบแอปพลิเคชันได้ทันที");
});
