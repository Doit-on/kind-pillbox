/**
 * ระบบสแกนและสกัดข้อมูลจากซองยาโรงพยาบาล (Prescription Bag Intelligent Scanner)
 * ออกแบบเฉพาะสำหรับฉลากยาในประเทศไทย (รองรับคำย่อทางการแพทย์ ภาษาไทย และรูปแบบซองยา รพ.รัฐ/เอกชน)
 */

import { PrescriptionSafetyValidator } from "../pharmacology/safety_validator.js";

export class PrescriptionScanner {
  /**
   * พจนานุกรมคำย่อและรูปแบบข้อความบนซองยาไทย
   */
  static THAI_PRESCRIPTION_PATTERNS = {
    timing: [
      { pattern: /(?:เช้า|มื้อเช้า|ตอนเช้า|morning|\bman\b)/i, slot: "morning", label: "เช้า" },
      { pattern: /(?:เที่ยง|กลางวัน|มื้อเที่ยง|noon|midday)/i, slot: "noon", label: "กลางวัน" },
      { pattern: /(?:เย็น|มื้อเย็น|evening|vesp)/i, slot: "evening", label: "เย็น" },
      { pattern: /(?:ก่อนนอน|ตอนนอน|bedtime|\bhs\b)/i, slot: "bedtime", label: "ก่อนนอน" }
    ],
    mealRelation: [
      { pattern: /(?:ก่อนอาหาร|\bac\b|before\s*meal)/i, type: "before_meal", label: "ก่อนอาหาร 30 นาที" },
      { pattern: /(?:หลังอาหารทันที|พร้อมอาหาร|with\s*meal)/i, type: "with_meal", label: "พร้อมอาหาร/หลังอาหารทันที" },
      { pattern: /(?:หลังอาหาร|\bpc\b|after\s*meal)/i, type: "after_meal", label: "หลังอาหาร" },
      { pattern: /(?:ตามต้องการ|เมื่อมีอาการ|เวลาปวด|\bprn\b)/i, type: "prn", label: "ทานเฉพาะเวลาจำเป็น" }
    ],
    frequency: [
      { pattern: /(?:วันละ\s*1\s*ครั้ง|\bod\b|\bqd\b)/i, count: 1, text: "วันละ 1 ครั้ง" },
      { pattern: /(?:วันละ\s*2\s*ครั้ง|\bbid\b)/i, count: 2, text: "วันละ 2 ครั้ง" },
      { pattern: /(?:วันละ\s*3\s*ครั้ง|\btid\b)/i, count: 3, text: "วันละ 3 ครั้ง" },
      { pattern: /(?:วันละ\s*4\s*ครั้ง|\bqid\b)/i, count: 4, text: "วันละ 4 ครั้ง" }
    ],
    dosageStrength: /(\d+(?:\.\d+)?)\s*(?:มิลลิกรัม|มก\.?|mg|mcg|ml|มล\.?)/i,
    amountPerIntake: /(?:ครั้งละ|ละ)\s*(\d+(?:\.\d+)?|\d+\/\d+|\d+-\d+)?\s*(?:เม็ด|แคปซูล|ช้อนชา|tab|cap)/i
  };

  /**
   * ถอดรหัสข้อความดิบ (OCR Text) ที่สแกนได้จากหน้าซองยา
   * @param {string} rawOcrText ข้อความทั้งหมดที่ OCR อ่านได้จากซองยา
   * @returns {object} ข้อมูลยาเชิงโครงสร้างที่พร้อมนำไปตรวจสอบความปลอดภัย
   */
  static parsePrescriptionText(rawOcrText) {
    if (!rawOcrText || typeof rawOcrText !== "string") {
      return {
        success: false,
        error: "ไม่พบข้อความจากรูปถ่าย กรุณาถ่ายภาพใหม่อีกครั้งให้ชัดเจนครับ"
      };
    }

    const cleanText = rawOcrText.replace(/\r?\n/g, " ").trim();

    // 1. ตรวจหาชื่อยา (ค้นหาจากคำขึ้นต้น หรือชื่อยาภาษาอังกฤษที่มีตัวเลข mg)
    let extractedDrugName = null;
    const drugNameMatch = cleanText.match(/([A-Za-z]{3,25}(?:\s+[A-Za-z]{3,20})?)\s*(\d+(?:\.\d+)?\s*mg)/i);
    if (drugNameMatch) {
      extractedDrugName = drugNameMatch[1].trim();
    } else {
      // Fallback: หากลุ่มคำภาษาอังกฤษคำแรกที่มีความยาวตั้งแต่ 4 ตัวอักษรขึ้นไป
      const enWordMatch = cleanText.match(/\b([A-Z][a-z]{3,20})\b/);
      if (enWordMatch) extractedDrugName = enWordMatch[1];
    }

    // 2. ตรวจหาขนาดยา (Strength เช่น 5mg, 500mg)
    let strength = null;
    let unit = "mg";
    const strengthMatch = cleanText.match(this.THAI_PRESCRIPTION_PATTERNS.dosageStrength);
    if (strengthMatch) {
      strength = parseFloat(strengthMatch[1]);
    }

    // 3. ตรวจหาจำนวนที่ทานต่อครั้ง (เช่น ครั้งละ 1 เม็ด)
    let amountPerIntake = 1;
    const intakeMatch = cleanText.match(this.THAI_PRESCRIPTION_PATTERNS.amountPerIntake);
    if (intakeMatch && intakeMatch[1]) {
      amountPerIntake = parseFloat(intakeMatch[1]) || 1;
    }

    // 4. ตรวจหามื้อยา (เช้า / เที่ยง / เย็น / ก่อนนอน)
    const detectedSlots = [];
    for (const item of this.THAI_PRESCRIPTION_PATTERNS.timing) {
      if (item.pattern.test(cleanText)) {
        detectedSlots.push(item.slot);
      }
    }

    // 5. ตรวจหาความสัมพันธ์กับมื้ออาหาร (ก่อนอาหาร / หลังอาหาร / พร้อมอาหาร / prn)
    let mealRelation = "after_meal";
    let mealRelationLabel = "หลังอาหาร";
    for (const item of this.THAI_PRESCRIPTION_PATTERNS.mealRelation) {
      if (item.pattern.test(cleanText)) {
        mealRelation = item.type;
        mealRelationLabel = item.label;
        break;
      }
    }

    // 6. ตรวจหาความถี่
    let frequencyText = "ตามที่ระบุ";
    for (const item of this.THAI_PRESCRIPTION_PATTERNS.frequency) {
      if (item.pattern.test(cleanText)) {
        frequencyText = item.text;
        break;
      }
    }

    // คำนวณ Confidence Score เบื้องต้น
    let confidenceScore = 0.5;
    if (extractedDrugName) confidenceScore += 0.2;
    if (strength) confidenceScore += 0.15;
    if (detectedSlots.length > 0) confidenceScore += 0.15;

    const extractedResult = {
      rawText: rawOcrText,
      genericName: extractedDrugName,
      dosage: strength,
      unit: unit,
      amountPerIntake: amountPerIntake,
      dailySlots: detectedSlots.length > 0 ? detectedSlots : ["morning"],
      mealRelation: mealRelation,
      mealRelationLabel: mealRelationLabel,
      frequencyText: frequencyText,
      confidenceScore: Math.round(confidenceScore * 100) / 100
    };

    // ส่งเข้าสู่กระบวนการตรวจสอบความปลอดภัยขั้นสูง (Safety Validator)
    const safetyReport = PrescriptionSafetyValidator.validatePrescriptionScan(extractedResult);

    return {
      success: true,
      extractedData: extractedResult,
      safetyReport: safetyReport,
      // บังคับให้แสดงหน้าต่างยืนยันเสมอเพื่อความปลอดภัยสูงสุด
      needsHumanConfirmation: true,
      isImageClearEnough: confidenceScore >= 0.7
    };
  }

  /**
   * สร้าง Prompt มาตรฐานสำหรับ Gemini Vision ในการอ่านรูปซองยาให้ได้ JSON ที่แม่นยำที่สุด
   */
  static getGeminiVisionPrompt() {
    return `คุณคือผู้เชี่ยวชาญการถอดรหัสฉลากซองยาโรงพยาบาลและคลินิกในประเทศไทย (Thai Hospital Prescription Label Specialist)
โปรดอ่านรูปถ่ายหน้าซองยาที่แนบมา และสกัดข้อมูลออกมาเป็น JSON ตาม Schema นี้เท่านั้น โดยห้ามแต่งเติมข้อมูลที่มองไม่เห็น:

{
  "drug_generic_name": "ชื่อสามัญทางยา (ภาษาอังกฤษ เช่น Amlodipine, Metformin)",
  "drug_brand_name": "ชื่อทางการค้า (ถ้ามี)",
  "dosage_amount": "ตัวเลขขนาดยา เช่น 5, 500, 20 (เฉพาะตัวเลข)",
  "dosage_unit": "หน่วย เช่น mg, ml, mcg",
  "intake_amount": "จำนวนที่ทานต่อครั้ง เช่น 1, 0.5, 2 (เฉพาะตัวเลข)",
  "timing_slots": ["morning", "noon", "evening", "bedtime"],
  "meal_relation": "before_meal | after_meal | with_meal | bedtime | prn",
  "caution_text": "ข้อความคำเตือนพิเศษที่พิมพ์บนซอง เช่น กินติดต่อกันจนหมด หรือ อาจทำให้ง่วงนอน",
  "hospital_name": "ชื่อโรงพยาบาลหรือคลินิก (ถ้ามี)",
  "readability_confidence": 0.0 ถึง 1.0 (ประเมินความคมชัดของภาพ หากภาพเบลอให้ระบุคะแนนต่ำ)
}

ข้อควรระวัง:
- หากตัวเลขขนาดยาไม่ชัดเจน ห้ามเดา ให้ระบุ readability_confidence ต่ำกว่า 0.5
- ตรวจสอบตัวย่อภาษาอังกฤษเช่น pc (หลังอาหาร), ac (ก่อนอาหาร), bid (วันละ 2 ครั้ง), hs (ก่อนนอน) ให้แม่นยำ`;
  }
}
