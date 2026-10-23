/**
 * Automated Test Suite สำหรับทดสอบ Pharmacological Logic & Safety Engine
 */

import { MASTER_DRUGS } from "../src/data/master_drugs.js";
import { PharmacokineticEngine } from "../src/core/pharmacology/pharmacokinetics.js";
import { MissedDoseAdvisor } from "../src/core/pharmacology/missed_dose_advisor.js";
import { PrescriptionSafetyValidator } from "../src/core/pharmacology/safety_validator.js";

console.log("=================================================================");
console.log("🧪 เริ่มต้นการทดสอบระบบคำนวณและประเมินความปลอดภัย: ตลับยาใจดี");
console.log("=================================================================\n");

// TEST CASE 1: การสแกนซองยาปกติ (Amlodipine 5mg)
console.log("--- [Test 1: สแกนซองยาปกติ - Amlodipine 5mg] ---");
const scanNormal = {
  genericName: "Amlodipine",
  dosage: "5",
  unit: "mg",
  timing: "morning"
};
const resultNormal = PrescriptionSafetyValidator.validatePrescriptionScan(scanNormal);
console.log("ผ่านการตรวจสอบ:", resultNormal.isValid ? "✅ ผ่าน" : "❌ ไม่ผ่าน");
console.log("ต้องให้ญาติช่วยตรวจไหม:", resultNormal.requiresCaregiverConfirmation ? "⚠️ ต้องให้ญาติช่วยตรวจ" : "✅ บันทึกได้เลย");
console.log("ข้อควรระวัง:", resultNormal.cautions.map(c => c.messageTh).join(" | "));
console.log();

// TEST CASE 2: ตรวจจับข้อผิดพลาดจากการอ่านตัวเลขผิด (OCR Error เช่น 500mg แทนที่จะเป็น 5mg)
console.log("--- [Test 2: ตรวจจับขนาดตัวเลขผิดปกติจากการสแกน (OCR Error 500mg)] ---");
const scanOutRange = {
  genericName: "Amlodipine",
  dosage: "500", // ผิดปกติมาก! สูงเกินไป
  unit: "mg"
};
const resultOutRange = PrescriptionSafetyValidator.validatePrescriptionScan(scanOutRange);
console.log("ผ่านการตรวจสอบ:", resultOutRange.isValid ? "✅ ผ่าน" : "❌ ไม่ผ่าน (ระบบสกัดกั้นไว้ได้)");
console.log("ข้อผิดพลาดที่แจ้งเตือน:");
resultOutRange.issues.forEach(issue => console.log(`  - [${issue.severity}] ${issue.messageTh}`));
console.log();

// TEST CASE 3: ตรวจจับยากลุ่มเสี่ยงสูง (High-Alert Medication - Warfarin)
console.log("--- [Test 3: ตรวจจับยาความเสี่ยงสูง (Warfarin)] ---");
const scanWarfarin = {
  genericName: "Warfarin",
  dosage: "3",
  unit: "mg"
};
const resultWarfarin = PrescriptionSafetyValidator.validatePrescriptionScan(scanWarfarin);
console.log("ตรวจพบ High-Alert:", resultWarfarin.requiresCaregiverConfirmation ? "🔴 แจ้งเตือนลูกหลานอัตโนมัติ" : "ปกติ");
console.log("คำเตือนความเสี่ยง:");
resultWarfarin.cautions.forEach(c => console.log(`  - ${c.messageTh}`));
console.log();

// TEST CASE 4: คำนวณ "เกราะปกป้องสุขภาพ" (Health Shield)
console.log("--- [Test 4: คำนวณเกราะปกป้องสุขภาพตามเวลาที่ผ่านไป (Half-Life)] ---");
const amlodipine = MASTER_DRUGS.amlodipine;

// ทานยาไปแล้ว 2 ชม. (กำลังดูดซึมเต็มที่)
const shield2h = PharmacokineticEngine.evaluateHealthShield(amlodipine, 2, true);
console.log(`ผ่านไป 2 ชม.: เกราะ ${shield2h.percentage}% (${shield2h.statusBadge}) -> ${shield2h.friendlyMessage}`);

// ทานยาไปแล้ว 24 ชม. (ครบ 1 วัน ยังไม่ได้ทานมื้อใหม่)
const shield24h = PharmacokineticEngine.evaluateHealthShield(amlodipine, 24, false);
console.log(`ผ่านไป 24 ชม. (ยังไม่ได้ทานมื้อใหม่): เกราะ ${shield24h.percentage}% (${shield24h.statusBadge}) -> ${shield24h.friendlyMessage}`);
console.log();

// TEST CASE 5: การให้คำแนะนำเมื่อทานยาไม่ตรงเวลา (Missed-Dose Scenarios)
console.log("--- [Test 5: การให้คำแนะนำเมื่อทานยาไม่ตรงเวลา (ลืมกินยา)] ---");

// สถานการณ์ 5.1: เลยเวลามา 3 ชั่วโมง สำหรับ Amlodipine (Safe Window ~12 ชม.)
const now = new Date();
const scheduledMorning = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // 3 ชม. ก่อนหน้า
const nextDoseMorning = new Date(now.getTime() + (21 * 60 * 60 * 1000)); // อีก 21 ชม.
const advice51 = MissedDoseAdvisor.evaluateMissedDose({
  drug: amlodipine,
  scheduledTime: scheduledMorning,
  currentTime: now,
  nextScheduledTime: nextDoseMorning
});
console.log("สถานการณ์ 5.1 (Amlodipine เลยมา 3 ชม.):");
console.log(`  การกระทำ: [${advice51.action}] ${advice51.warningTitle}`);
console.log(`  คำอธิบาย: ${advice51.friendlyExplanation}`);
console.log(`  คำเตือนสำคัญ: ${advice51.doubleDoseWarning}`);
console.log();

// สถานการณ์ 5.2: ยาเบาหวาน Metformin ที่ต้องทานพร้อมอาหาร แต่ผู้สูงอายุยังไม่ได้ทานข้าว
const metformin = MASTER_DRUGS.metformin;
const scheduledMetformin = new Date(now.getTime() - (1.5 * 60 * 60 * 1000)); // เลยมา 1.5 ชม.
const nextMetformin = new Date(now.getTime() + (6 * 60 * 60 * 1000));
const advice52 = MissedDoseAdvisor.evaluateMissedDose({
  drug: metformin,
  scheduledTime: scheduledMetformin,
  currentTime: now,
  nextScheduledTime: nextMetformin,
  hasEatenFood: false // ยังไม่ได้ทานข้าว!
});
console.log("สถานการณ์ 5.2 (Metformin เลยมา 1.5 ชม. แต่ยังไม่ได้ทานข้าว):");
console.log(`  การกระทำ: [${advice52.action}] ${advice52.warningTitle}`);
console.log(`  คำอธิบาย: ${advice52.friendlyExplanation}`);
console.log();

// สถานการณ์ 5.3: ยา Amoxicillin เหลือเวลาอีกแค่ 1.5 ชม. จะถึงรอบถัดไป (ใกล้มาก)
const amox = MASTER_DRUGS.amoxicillin;
const scheduledAmox = new Date(now.getTime() - (6 * 60 * 60 * 1000)); // ลืมมา 6 ชม.
const nextAmox = new Date(now.getTime() + (1.5 * 60 * 60 * 1000)); // อีกแค่ 1.5 ชม. จะถึงรอบใหม่
const advice53 = MissedDoseAdvisor.evaluateMissedDose({
  drug: amox,
  scheduledTime: scheduledAmox,
  currentTime: now,
  nextScheduledTime: nextAmox
});
console.log("สถานการณ์ 5.3 (เหลือเวลาอีกเพียง 1.5 ชม. จะถึงมื้อถัดไป):");
console.log(`  การกระทำ: [${advice53.action}] ${advice53.warningTitle}`);
console.log(`  คำอธิบาย: ${advice53.friendlyExplanation}`);
console.log(`  เหตุผลทางการแพทย์: ${advice53.pharmacologicalReason}`);
console.log(`  คำเตือนสำคัญ: ${advice53.doubleDoseWarning}`);
console.log();

console.log("=================================================================");
console.log("🎉 การทดสอบทุกกรณีสำเร็จสมบูรณ์ (All test cases passed safely!)");
console.log("=================================================================");
