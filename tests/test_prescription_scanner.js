/**
 * ทดสอบการถอดรหัสและตรวจความถูกต้องของฉลากซองยาในประเทศไทย
 */

import { PrescriptionScanner } from "../src/core/ocr/prescription_scanner.js";

console.log("=================================================================");
console.log("🔍 เริ่มต้นทดสอบ Prescription Scanner กับตัวอย่างซองยาไทยจริง");
console.log("=================================================================\n");

const sampleHospitalLabels = [
  {
    source: "ตัวอย่างที่ 1: รพ.รัฐบาล (ภาษาไทยเต็มรูปแบบ)",
    rawText: "โรงพยาบาลศิริราช ผู้ป่วย: นายประเสริฐ ยา: Amlodipine 5 mg รับประทานครั้งละ 1 เม็ด วันละ 1 ครั้ง หลังอาหาร เช้า"
  },
  {
    source: "ตัวอย่างที่ 2: รพ.เอกชน / ตัวย่อสากล (ac/pc/bid)",
    rawText: "Bangkok Hospital - Metformin 500 mg Take 1 tab with meal morning, evening (bid)"
  },
  {
    source: "ตัวอย่างที่ 3: ยาลดกรดก่อนอาหาร",
    rawText: "คลินิกหมอสมชาย Omeprazole 20 mg รับประทานครั้งละ 1 แคปซูล ก่อนอาหารเช้า 30 นาที"
  },
  {
    source: "ตัวอย่างที่ 4: ซองยาที่ตัวเลขผิดปกติ (OCR สแกนผิดเป็น 500mg)",
    rawText: "Amlodipine 500 mg รับประทานครั้งละ 1 เม็ด หลังอาหารเช้า"
  }
];

sampleHospitalLabels.forEach((sample, index) => {
  console.log(`📌 [${index + 1}] ${sample.source}`);
  console.log(`   ข้อความดิบ: "${sample.rawText}"`);

  const result = PrescriptionScanner.parsePrescriptionText(sample.rawText);

  console.log(`   👉 ผลการถอดรหัส:`);
  console.log(`      - ชื่อยา: ${result.extractedData.genericName}`);
  console.log(`      - ขนาดยา: ${result.extractedData.dosage} ${result.extractedData.unit}`);
  console.log(`      - ปริมาณ: ครั้งละ ${result.extractedData.amountPerIntake} เม็ด`);
  console.log(`      - มื้อยา: ${result.extractedData.dailySlots.join(", ")}`);
  console.log(`      - ความสัมพันธ์กับอาหาร: ${result.extractedData.mealRelationLabel}`);
  console.log(`      - ความเชื่อมั่น (Confidence): ${Math.round(result.extractedData.confidenceScore * 100)}%`);

  const safety = result.safetyReport;
  console.log(`   🛡️ ผลการตรวจความปลอดภัย:`);
  console.log(`      - ความถูกต้อง: ${safety.isValid ? "✅ ผ่านเกณฑ์ปลอดภัย" : "❌ ตรวจพบข้อผิดพลาดร้ายแรง"}`);
  if (safety.issues.length > 0) {
    safety.issues.forEach(issue => console.log(`        ⚠️ [${issue.severity}] ${issue.messageTh}`));
  }
  if (safety.cautions.length > 0) {
    safety.cautions.forEach(caution => console.log(`        ℹ️ ${caution.messageTh}`));
  }
  console.log("-----------------------------------------------------------------\n");
});
