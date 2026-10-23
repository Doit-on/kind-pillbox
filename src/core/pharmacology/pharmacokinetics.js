/**
 * ตัวคำนวณระดับยาในร่างกายและแปลงเป็น "เกราะปกป้องสุขภาพ" (Health Shield Calculator)
 * อ้างอิงทฤษฎี Pharmacokinetics (Half-life Elimination: C(t) = C0 * e^(-ke * t))
 */

export class PharmacokineticEngine {
  /**
   * คำนวณค่า Elimination Rate Constant (ke) จาก Half-life
   * @param {number} halfLifeHours ค่าครึ่งชีวิตของยา (ชั่วโมง)
   * @returns {number} ค่าคงที่การขับยาออกจากร่างกาย
   */
  static getEliminationRate(halfLifeHours) {
    if (!halfLifeHours || halfLifeHours <= 0) return 0.1;
    return Math.LN2 / halfLifeHours;
  }

  /**
   * คำนวณระดับความเข้มข้นสัมพัทธ์ของยาในกระแสเลือด (0.0 - 1.0)
   * @param {number} hoursSinceDose จำนวนชั่วโมงตั้งแต่กินยา
   * @param {number} halfLifeHours ค่าครึ่งชีวิตของยา
   * @param {number} onsetHours เวลาที่ยาเริ่มดูดซึมถึงจุดสูงสุด (Tmax โดยประมาณ)
   * @returns {number} สัดส่วนระดับยา (0.0 ถึง 1.0)
   */
  static calculateRelativeConcentration(hoursSinceDose, halfLifeHours, onsetHours = 1.5) {
    if (hoursSinceDose < 0) return 0;

    const ke = this.getEliminationRate(halfLifeHours);
    const ka = 1.5 / Math.max(0.5, onsetHours); // Absorption rate constant

    // Bateman function (Oral 1-compartment model)
    const factor = ka / (ka - ke);
    const concentration = factor * (Math.exp(-ke * hoursSinceDose) - Math.exp(-ka * hoursSinceDose));

    // Normalize to 0.0 - 1.0 range
    return Math.max(0, Math.min(1.0, concentration * 1.3));
  }

  /**
   * แปลงผลทางเภสัชศาสตร์ ให้กลายเป็น "เกราะปกป้องสุขภาพ" (Health Shield) สำหรับผู้สูงอายุ
   * @param {object} drug ข้อมูลยาจาก Master Drugs
   * @param {number} hoursSinceDose เวลาที่ผ่านไปนับจากมื้อก่อนหน้า
   * @param {boolean} isTakenStatus ทานยาของมื้อนี้แล้วหรือยัง
   * @returns {object} ข้อมูลเกราะปกป้องสุขภาพที่แสดงผลบน UI ได้ทันที
   */
  static evaluateHealthShield(drug, hoursSinceDose, isTakenStatus = true) {
    let rawConc = this.calculateRelativeConcentration(
      hoursSinceDose,
      drug.halfLifeHours,
      drug.onsetHours
    );

    // ปรับเปอร์เซ็นต์ให้อยู่ในสเกล 0 - 100%
    let percentage = Math.round(rawConc * 100);

    // หากเพิ่งทานหรือทานครบตามเวลา เกราะจะอยู่ในช่วงดูแลดีเยี่ยม (85-98%)
    if (isTakenStatus && hoursSinceDose <= (drug.safeDelayWindowHours || 6)) {
      percentage = Math.max(80, Math.min(98, percentage + 20));
    }

    let statusBadge = "ดีเยี่ยม";
    let badgeColor = "emerald"; // เขียว
    let friendlyMessage = "";

    if (percentage >= 80) {
      statusBadge = "ปกป้องดีเยี่ยม";
      badgeColor = "emerald";
      friendlyMessage = `ระดับยา${drug.genericName} อยู่ในเกณฑ์เหมาะสม กำลังช่วยดูแลร่างกายอย่างต่อเนื่องครับ`;
    } else if (percentage >= 55) {
      statusBadge = "เริ่มลดลงเล็กน้อย";
      badgeColor = "amber"; // เหลืองส้ม
      friendlyMessage = `ระดับยายังคงช่วยดูแลอยู่ แต่เริ่มลดลงตามเวลา ทานยาตามรอบเวลาเพื่อเติมเกราะปกป้องนะครับ`;
    } else {
      statusBadge = "เกราะปกป้องเหลือน้อย";
      badgeColor = "rose"; // แดงอ่อน
      friendlyMessage = `ระดับยาในร่างกายลดลงมากแล้ว ควรทานยาตามคำแนะนำเพื่อคงผลการรักษาที่ดีครับ`;
    }

    return {
      percentage,
      statusBadge,
      badgeColor,
      friendlyMessage,
      hoursSinceDose,
      drugName: drug.genericName
    };
  }
}
