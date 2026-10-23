/**
 * ระบบตรวจสอบความปลอดภัยข้อมูลยาและการสแกนซองยา (Prescription Safety Validator)
 * ป้องกันข้อผิดพลาดจากการอ่านตัวเลขผิด (OCR Error) และตรวจสอบยาความเสี่ยงสูง
 */

import { MASTER_DRUGS } from "../../data/master_drugs.js";

export class PrescriptionSafetyValidator {
  /**
   * ค้นหายาใน Master Database โดยรองรับการพิมพ์ตัวพิมพ์เล็ก/ใหญ่ หรือชื่อทางการค้า
   * @param {string} drugNameSearch ชื่อยาที่ต้องการค้นหา
   * @returns {object|null} ข้อมูลยาใน Master Database
   */
  static findMasterDrug(drugNameSearch) {
    if (!drugNameSearch) return null;
    const cleanSearch = drugNameSearch.trim().toLowerCase();

    for (const key of Object.keys(MASTER_DRUGS)) {
      const drug = MASTER_DRUGS[key];
      if (
        drug.genericName.toLowerCase() === cleanSearch ||
        drug.genericName.toLowerCase().includes(cleanSearch) ||
        cleanSearch.includes(drug.genericName.toLowerCase())
      ) {
        return drug;
      }
    }
    return null;
  }

  /**
   * ตรวจสอบข้อมูลที่สกัดได้จากซองยา (OCR Result Validation)
   * @param {object} scannedData ข้อมูลที่ AI/OCR ดึงออกมาจากรูปถ่ายซองยา
   * @returns {object} ผลการประเมินความปลอดภัยและสถานะการตรวจสอบ
   */
  static validatePrescriptionScan(scannedData) {
    const issues = [];
    const cautions = [];
    let isSafeToSaveDirectly = true;
    let requiresCaregiverConfirmation = false;

    // 1. ตรวจสอบชื่อยา
    const masterDrug = this.findMasterDrug(scannedData.genericName || scannedData.drugName);
    if (!masterDrug) {
      issues.push({
        code: "UNKNOWN_DRUG",
        severity: "WARNING",
        messageTh: `ไม่พบชื่อยา "${scannedData.genericName || scannedData.drugName}" ในฐานข้อมูลยามาตรฐาน กรุณาตรวจซองยาอีกครั้งเพื่อยืนยันตัวสะกด`
      });
      isSafeToSaveDirectly = false;
    }

    // 2. ตรวจสอบขนาดยา (Dosage Range Check) ป้องกัน OCR อ่านเลขผิด เช่น 5mg กลายเป็น 50mg หรือ 500mg
    const dosageValue = parseFloat(scannedData.dosage || scannedData.strength);
    if (masterDrug && !isNaN(dosageValue)) {
      const { min, max, common } = masterDrug.typicalDosageMg;
      if (dosageValue > max) {
        issues.push({
          code: "DOSAGE_TOO_HIGH",
          severity: "CRITICAL",
          messageTh: `⚠️ ขนาดยาที่ตรวจพบ (${dosageValue} mg) สูงกว่าขนาดปกติทั่วไปของ ${masterDrug.genericName} (ไม่เกิน ${max} mg) กรุณาดูที่ซองยาจริงอีกครั้งว่าถูกต้องหรือไม่`
        });
        isSafeToSaveDirectly = false;
        requiresCaregiverConfirmation = true;
      } else if (dosageValue < min) {
        issues.push({
          code: "DOSAGE_TOO_LOW",
          severity: "WARNING",
          messageTh: `ขนาดยาที่ตรวจพบ (${dosageValue} mg) น้อยกว่าขนาดมาตรฐานทั่วไป (${min} mg) โปรดตรวจสอบความถูกต้อง`
        });
      }
    }

    // 3. ตรวจสอบยากลุ่มเสี่ยงสูง (High-Alert Medication) เช่น Warfarin
    if (masterDrug && masterDrug.highAlert) {
      requiresCaregiverConfirmation = true;
      cautions.push({
        code: "HIGH_ALERT_DRUG",
        messageTh: `🔴 ยา ${masterDrug.genericName} เป็นยาที่มีความสำคัญเป็นพิเศษ ต้องทานตรงเวลาและห้ามปรับเปลี่ยนขนาดยาเอง แนะนำให้ลูกหลานช่วยตรวจสอบความถูกต้องร่วมด้วยครับ`
      });
    }

    // 4. สรุปข้อควรระวังเรื่องอาหาร/เครื่องดื่ม
    if (masterDrug && masterDrug.foodCautions.length > 0) {
      cautions.push({
        code: "FOOD_INTERACTION",
        messageTh: `🍽️ ข้อควรระวังในการรับประทาน: หลีกเลี่ยง ${masterDrug.foodCautions.join(", ")} ร่วมกับยานี้`
      });
    }

    return {
      isValid: issues.filter(i => i.severity === "CRITICAL").length === 0,
      isSafeToSaveDirectly: isSafeToSaveDirectly && issues.length === 0,
      requiresCaregiverConfirmation,
      masterDrug,
      issues,
      cautions,
      humanVerificationSummary: {
        confirmedDrugName: masterDrug ? masterDrug.genericName : (scannedData.genericName || "ไม่ระบุ"),
        confirmedDosage: `${dosageValue || scannedData.dosage} ${masterDrug ? masterDrug.unit : "mg"}`,
        thaiCategory: masterDrug ? masterDrug.thaiCategory : "ยาตามแพทย์สั่ง",
        routineAdvice: masterDrug ? masterDrug.routineAdvice : "รับประทานตามที่แพทย์สั่งอย่างเคร่งครัด"
      }
    };
  }
}
