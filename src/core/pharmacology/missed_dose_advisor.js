/**
 * ระบบให้คำแนะนำเมื่อทานยาไม่ตรงเวลา (Missed-Dose Advisor)
 * อ้างอิงตามหลักความปลอดภัยทางเภสัชวิทยา (Clinical Practice Guidelines)
 * ห้ามเพิ่มขนาดยาชดเชย (Strictly No Double-Dosing)
 */

export class MissedDoseAdvisor {
  /**
   * ประเมินการทานยาที่คลาดเคลื่อนจากเวลาที่กำหนด
   * @param {object} drug ข้อมูลยา
   * @param {Date} scheduledTime เวลาที่ควรทานตามตาราง
   * @param {Date} currentTime เวลาปัจจุบันที่นึกขึ้นได้
   * @param {Date} nextScheduledTime เวลาของมื้อถัดไป
   * @param {boolean} hasEatenFood ทานอาหารในมื้อนี้หรือยัง (สำหรับยาที่ต้องการอาหาร)
   * @returns {object} คำแนะนำที่เข้าใจง่ายและปลอดภัยสูงสุด
   */
  static evaluateMissedDose({
    drug,
    scheduledTime,
    currentTime,
    nextScheduledTime,
    hasEatenFood = true
  }) {
    const delayHours = (currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
    const hoursLeftBeforeNext = (nextScheduledTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

    const result = {
      action: "TAKE_NOW",
      canTakeNow: true,
      delayHours: Math.max(0, Math.round(delayHours * 10) / 10),
      hoursLeftBeforeNext: Math.max(0, Math.round(hoursLeftBeforeNext * 10) / 10),
      warningTitle: "",
      friendlyExplanation: "",
      pharmacologicalReason: "",
      doubleDoseWarning: "⚠️ ข้อสำคัญที่สุด: ห้ามเพิ่มขนาดยาเป็น 2 เม็ดเพื่อชดเชยมื้อที่ลืมโดยเด็ดขาด เพราะอาจทำให้ได้รับยาเกินขนาดครับ"
    };

    // กรณีที่ 1: ยังไม่เลยเวลา หรือทานตรงเวลาปกติ
    if (delayHours <= 0.5) {
      result.action = "TAKE_ON_TIME";
      result.warningTitle = "ถึงเวลาทานยาแล้วครับ";
      result.friendlyExplanation = `ทานยา${drug.genericName} ตามเวลาปกติ ดื่มน้ำตาม 1 แก้วนะครับ`;
      result.pharmacologicalReason = "การทานตรงเวลาช่วยรักษาระดับยาในร่างกายให้คงที่และออกฤทธิ์ได้ดีที่สุด";
      return result;
    }

    // กรณีที่ 2: เหลือเวลาอีกน้อยมากจะถึงมื้อถัดไป -> ต้องข้ามมื้อนี้ไปเลย ห้ามกิน!
    if (hoursLeftBeforeNext <= (drug.skipIfHoursLeftBeforeNext || 3)) {
      result.action = "SKIP_TO_NEXT";
      result.canTakeNow = false;
      result.warningTitle = "แนะนำให้ข้ามมื้อนี้ไปก่อนนะครับ";
      result.friendlyExplanation = `เนื่องจากอีกเพียงประมาณ ${Math.round(hoursLeftBeforeNext)} ชั่วโมงจะถึงเวลามื้อถัดไปแล้ว มื้อนี้ให้ปล่อยผ่านไปได้เลยครับ แล้วรอทานมื้อถัดไปตามเวลาปกติ`;
      result.pharmacologicalReason = `ยา${drug.genericName} หากทานตอนนี้ ระดับยาจะไปทับซ้อนกับมื้อถัดไป ซึ่งเสี่ยงต่อการได้รับยาเกินขนาด (Overdose)`;
      return result;
    }

    // กรณีที่ 3: ยาต้องทานพร้อมอาหาร (เช่น Metformin) แต่ยังไม่ได้ทานข้าว
    if (drug.requiresFood && !hasEatenFood) {
      result.action = "EAT_SNACK_FIRST";
      result.canTakeNow = false;
      result.warningTitle = "ทานของว่างเบาๆ ก่อนทานยานะครับ";
      result.friendlyExplanation = `ยาตัวนี้ต้องการอาหารในกระเพาะเพื่อช่วยการดูดซึมและป้องกันอาการระคายเคือง แนะนำดื่มนมหรือทานกล้วย/ขนมปัง 1 ชิ้นก่อน แล้วค่อยทานยานะครับ`;
      result.pharmacologicalReason = `การทานยา${drug.genericName} ขณะท้องว่าง อาจทำให้ระคายเคืองกระเพาะอาหาร หรือทำให้ระดับน้ำตาลลดต่ำเกินไป`;
      return result;
    }

    // กรณีที่ 4: เลยเวลามาพอสมควร แต่อยู่ในเกณฑ์ปลอดภัย (Safe Window)
    if (delayHours <= (drug.safeDelayWindowHours || 6)) {
      result.action = "TAKE_NOW";
      result.canTakeNow = true;
      result.warningTitle = `เลยเวลามาประมาณ ${Math.round(delayHours)} ชั่วโมง ทานตอนนี้ได้เลยครับ`;
      result.friendlyExplanation = `ไม่ต้องกังวลใจนะครับ ยาตัวนี้ออกฤทธิ์ได้ยาวนาน สามารถหยิบทานตอนนี้ได้ทันที ดื่มน้ำตามปกติ แล้วมื้อต่อไปทานตามเวลาเดิมได้เลยครับ`;
      result.pharmacologicalReason = `ยา${drug.genericName} มีค่าครึ่งชีวิตประมาณ ${drug.halfLifeHours} ชั่วโมง ระดับยาในร่างกายยังไม่ตกลงจนเสียการรักษา`;
      return result;
    }

    // กรณีที่ 5: เลยเวลามานานมากเกิน Safe Window
    result.action = "SKIP_TO_NEXT";
    result.canTakeNow = false;
    result.warningTitle = "มื้อนี้ให้ข้ามไปก่อนนะครับ";
    result.friendlyExplanation = `มื้อนี้เลยเวลามาค่อนข้างนานแล้ว แนะนำให้ข้ามมื้อนี้ไป แล้วเริ่มทานใหม่ในมื้อถัดไปตามเวลาเดิม ไม่ต้องทานชดเชยนะครับ`;
    result.pharmacologicalReason = `รอบเวลากินยาเคลื่อนไปมาก การข้ามมื้อนี้ปลอดภัยกว่าการฝืนทานเพื่อไม่ให้กระทบรอบยาของวันถัดไป`;
    return result;
  }
}
