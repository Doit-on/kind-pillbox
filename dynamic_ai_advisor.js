/**
 * dynamic_ai_advisor.js
 * ระบบ AI ให้คำปรึกษาทางเภสัชวิทยาและประเมินการลืมกินยา (Clinical AI Pharmacist Advisor)
 * ทำงานได้ทั้งแบบ Offline (Master Pharmacology Engine) และแบบ Online (Google Gemini API)
 */

/**
 * ประเมินคำแนะนำเมื่อทานยาตามเวลาปกติในแต่ละมื้อ
 */
export function generateDynamicAdviceForPills(pills, mealSlotName) {
  if (!pills || pills.length === 0) {
    return "มื้อนี้ยังไม่มีรายการยาตามแพทย์สั่งจ้ะ พักผ่อนให้สบายใจนะจ๊ะ";
  }

  const adviceParts = [];
  const cautionParts = [];

  pills.forEach(pill => {
    const nameLower = (pill.name || "").toLowerCase();
    const customCaution = pill.advice || "";

    if (nameLower.includes("amlodipine") || nameLower.includes("norvasc")) {
      adviceParts.push("ยาลดความดัน (Amlodipine) ช่วยคุมความดันโลหิตให้คงที่");
      cautionParts.push("หลีกเลี่ยงการดื่มน้ำส้มโอหรือเกรปฟรุตเพราะจะทำให้ตัวยาตกค้างเกินขนาดจ้ะ");
    } else if (nameLower.includes("metformin") || nameLower.includes("glucophage")) {
      adviceParts.push("ยาเบาหวาน (Metformin) แนะนำทานพร้อมข้าวคำแรกหรือหลังอาหารทันที");
      cautionParts.push("ทานพร้อมอาหารช่วยลดอาการคลื่นไส้แสบท้อง และห้ามดื่มแอลกอฮอล์เด็ดขาดจ้ะ");
    } else if (nameLower.includes("omeprazole") || nameLower.includes("miracid")) {
      adviceParts.push("ยาลดกรด (Omeprazole) ควรกลืนทั้งเม็ดพร้อมน้ำ ก่อนอาหาร 30 นาที");
      cautionParts.push("ห้ามเคี้ยวเม็ดยา และเว้นระยะห่างจากนมสดอย่างน้อย 2 ชั่วโมงจ้ะ");
    } else if (nameLower.includes("warfarin") || nameLower.includes("coumadin")) {
      adviceParts.push("ยาต้านการแข็งตัวของเลือด (Warfarin) สำคัญมาก ต้องทานเวลาเดิมเป๊ะทุกวัน");
      cautionParts.push("หลีกเลี่ยงผักใบเขียวเข้มปริมาณมากผิดปกติ และระวังอย่าให้เกิดแผลฟกช้ำจ้ะ");
    } else if (nameLower.includes("atorvastatin") || nameLower.includes("simvastatin") || nameLower.includes("lipitor")) {
      adviceParts.push("ยาลดไขมันในเลือด จะออกฤทธิ์ดูแลหลอดเลือดได้ดีที่สุดช่วงเวลานอนพักผ่อน");
    } else if (nameLower.includes("losartan") || nameLower.includes("enalapril") || nameLower.includes("cozaar")) {
      adviceParts.push("ยาลดความดันช่วยปกป้องไตและหัวใจ ทานสม่ำเสมอ");
      cautionParts.push("ระวังอาการหน้ามืดเมื่อลุกเปลี่ยนท่าเร็วๆ จ้ะ");
    } else if (nameLower.includes("amoxicillin") || nameLower.includes("augmentin") || nameLower.includes("ฆ่าเชื้อ") || nameLower.includes("ปฏิชีวนะ")) {
      adviceParts.push("ยาฆ่าเชื้อต้องรับประทานติดต่อกันจนหมดตามแพทย์สั่งอย่างเคร่งครัด");
      cautionParts.push("ทานให้ครบตามจำนวนวันเพื่อป้องกันเชื้อดื้อยาจ้ะ");
    } else if (nameLower.includes("aspirin") || nameLower.includes("clopidogrel") || nameLower.includes("plavix")) {
      adviceParts.push("ยาต้านเกล็ดเลือดช่วยป้องกันลิ่มเลือดอุดตัน ทานหลังอาหารทันทีพร้อมน้ำ 1 แก้ว");
    } else if (customCaution && customCaution !== "ทานตามแพทย์สั่ง" && customCaution !== "รับประทานตามที่แพทย์สั่งอย่างเคร่งครัด") {
      adviceParts.push(`ยา ${pill.name}: ${customCaution}`);
    } else {
      adviceParts.push(`ยา ${pill.name} ทานตามฉลากยา (${pill.detail || 'หลังอาหาร'})`);
    }
  });

  let combined = `มื้อ${mealSlotName}นี้มียาตามแพทย์สั่ง ${pills.length} ชนิด: ` + adviceParts.join(" • ");
  if (cautionParts.length > 0) {
    combined += " ⚠️ ข้อควรระวัง: " + cautionParts.join(" และ ");
  }
  combined += " ดื่มน้ำตาม 1 แก้วใหญ่เพื่อช่วยให้ยาดูดซึมได้ดีนะจ๊ะ";

  return combined;
}

/**
 * วิเคราะห์การลืมกินยาหรือกินช้ากว่าเวลาสำหรับยาแต่ละตัว (Individual Drug Pharmacokinetics Evaluation)
 */
export function evaluateMissedDoseForDrug(drugName, detail = "", delayHours = 1, hasEatenFood = true, hoursLeftBeforeNext = 6) {
  const name = (drugName || "").toLowerCase();

  // 1. Amlodipine / ยาลดความดันกลุ่ม Calcium Channel Blockers
  if (name.includes("amlodipine") || name.includes("norvasc") || name.includes("felodipine")) {
    if (delayHours <= 12 && hoursLeftBeforeNext >= 4) {
      return {
        drugName: drugName,
        action: "TAKE_NOW",
        badge: "🟢 ทานได้ทันทีตอนนี้",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        advice: "ยาลดความดัน Amlodipine ตัวนี้ออกฤทธิ์ได้ยาวนาน 35-50 ชั่วโมง สามารถหยิบทานตอนนี้พร้อมน้ำ 1 แก้วได้เลยจ้ะ แล้วมื้อพรุ่งนี้เช้าทานตามเวลาเดิมได้ตามปกติ",
        reason: "ครึ่งชีวิตยายาวนาน ระดับยาในร่างกายยังไม่ลดฮวบ ทานตอนนี้ช่วยให้ความดันคงที่ได้ดี"
      };
    } else {
      return {
        drugName: drugName,
        action: "SKIP_TO_NEXT",
        badge: "🔴 ข้ามมื้อนี้ไปก่อน",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        advice: "เนื่องจากเลยเวลามาเกิน 12 ชั่วโมง และใกล้ถึงเวลามื้อเช้าวันพรุ่งนี้แล้ว มื้อนี้ให้ปล่อยผ่านไปได้เลยจ้ะ พรุ่งนี้ค่อยทานมื้อเช้าตามเวลาเดิม (ห้ามทาน 2 เม็ดเด็ดขาดนะจ๊ะ)",
        reason: "เหลือเวลาอีกไม่กี่ชั่วโมงจะถึงมื้อถัดไป หากทานตอนนี้ระดับยาจะซ้อนทับกัน เสี่ยงความดันตกวูบ"
      };
    }
  }

  // 2. Metformin / ยาเบาหวาน
  if (name.includes("metformin") || name.includes("glucophage")) {
    if (delayHours <= 2.5 && hoursLeftBeforeNext >= 3.5) {
      if (hasEatenFood) {
        return {
          drugName: drugName,
          action: "TAKE_NOW",
          badge: "🟢 ทานได้ทันทีตอนนี้",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
          advice: "คุณตาทานข้าวเรียบร้อยแล้ว ทานยา Metformin ตอนนี้ได้เลยจ้ะ ดื่มน้ำตามแก้วใหญ่ๆ นะจ๊ะ",
          reason: "มีอาหารในกระเพาะแล้ว ช่วยดูดซึมยาและป้องกันอาการคลื่นไส้แสบท้อง"
        };
      } else {
        return {
          drugName: drugName,
          action: "TAKE_WITH_SNACK",
          badge: "🟡 ทานของว่างก่อนทานยา",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
          advice: "ยาเบาหวาน Metformin ต้องมีอาหารในกระเพาะจ้ะ แนะนำดื่มนมจืดหรือทานขนมปัง/กล้วยสักชิ้นก่อน แล้วค่อยทานยา เพื่อป้องกันอาการแสบท้องและน้ำตาลตกนะจ๊ะ",
          reason: "การทานยาขณะท้องว่างอาจระคายเคืองทางเดินอาหารและทำให้น้ำตาลในเลือดลดต่ำผิดปกติ"
        };
      }
    } else {
      return {
        drugName: drugName,
        action: "SKIP_TO_NEXT",
        badge: "🔴 ข้ามมื้อนี้ไปก่อน",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        advice: "เลยเวลามานานหลายชั่วโมงหรือใกล้ถึงมื้อถัดไปแล้ว มื้อนี้ให้ข้ามไปได้เลยจ้ะ แล้วรอทานพร้อมอาหารในมื้อถัดไปตามเวลาเดิม ห้ามทานชดเชย 2 เท่าเด็ดขาดจ้ะ",
        reason: "หากทานช้าเกินไปจนชนมื้อถัดไป เสี่ยงต่อภาวะน้ำตาลในเลือดตกต่ำเฉียบพลัน (Hypoglycemia)"
      };
    }
  }

  // 3. Omeprazole / ยาลดกรดกลุ่ม PPI
  if (name.includes("omeprazole") || name.includes("miracid") || name.includes("esomeprazole") || name.includes("pantoprazole")) {
    if (delayHours <= 1.5 && !hasEatenFood) {
      return {
        drugName: drugName,
        action: "TAKE_NOW",
        badge: "🟢 ทานตอนนี้ได้เลย (รออาหาร 30 นาที)",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        advice: "เนื่องจากยังไม่ได้ทานอาหาร ทานยาลดกรดตอนนี้ได้เลยจ้ะ ดื่มน้ำตาม 1 แก้ว แล้วรอประมาณ 30 นาทีค่อยเริ่มทานอาหารเช้านะจ๊ะ",
        reason: "ยานี้ทำงานได้ดีที่สุดเมื่อทานขณะท้องว่างก่อนอาหาร 30 นาที เพื่อบล็อกการหลั่งกรดเมื่อเริ่มทานอาหาร"
      };
    } else {
      return {
        drugName: drugName,
        action: "SKIP_TO_NEXT",
        badge: "🔴 ข้ามมื้อนี้ไปก่อน",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        advice: "หากทานอาหารไปแล้ว หรือเลยเวลามานาน ยาลดกรด Omeprazole จะทำงานได้ไม่เต็มที่ มื้อนี้ให้ปล่อยผ่านไปเลยจ้ะ พรุ่งนี้เช้าค่อยเริ่มทานใหม่ก่อนอาหาร 30 นาทีนะจ๊ะ",
        reason: "เมื่อมีอาหารในกระเพาะ ยาไม่สามารถจับกับปั๊มผลิตกรดได้อย่างมีประสิทธิภาพ การข้ามมื้อจึงปลอดภัยและเหมาะสมกว่า"
      };
    }
  }

  // 4. Warfarin / ยาต้านการแข็งตัวของเลือด
  if (name.includes("warfarin") || name.includes("coumadin")) {
    if (delayHours <= 4) {
      return {
        drugName: drugName,
        action: "TAKE_NOW",
        badge: "🟢 ทานได้ทันทีตอนนี้",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        advice: "ยาละลายลิ่มเลือด Warfarin มีความสำคัญสูงมาก เพิ่งเลยเวลามาไม่เกิน 4 ชั่วโมง ให้ทานตามขนาดยาปกติทันที ดื่มน้ำตาม 1 แก้ว และจดบันทึกเวลาไว้จ้ะ",
        reason: "ระดับยาในเลือดยังคงรักษาการต้านลิ่มเลือดได้ การทานช่วงนี้ยังปลอดภัย"
      };
    } else {
      return {
        drugName: drugName,
        action: "SKIP_TO_NEXT",
        badge: "🔴 ข้ามมื้อนี้ไปเลย (ห้ามเบิ้ล)",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        advice: "เลยเวลามานานเกิน 4-6 ชั่วโมงแล้ว แนะนำให้ข้ามมื้อนี้ไปเลยจ้ะ พรุ่งนี้ค่อยทานเวลาเดิมตามปกติ ห้ามทาน 2 เม็ดเด็ดขาดเพราะจะทำให้เสี่ยงเลือดออกในร่างกายรุนแรง",
        reason: "ยา Warfarin มีช่วงความปลอดภัยแคบ (Narrow Therapeutic Window) การทานซ้อนทับกันจะทำให้ค่า INR พุ่งสูง เลือดออกไม่หยุด"
      };
    }
  }

  // 5. Atorvastatin / Simvastatin / ยาลดไขมัน
  if (name.includes("statin") || name.includes("lipitor") || name.includes("zocor")) {
    if (delayHours <= 8) {
      return {
        drugName: drugName,
        action: "TAKE_NOW",
        badge: "🟢 ทานได้ทันทีตอนนี้",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        advice: "ยาลดไขมันสามารถหยิบทานตอนนี้ได้เลยจ้ะ ดื่มน้ำตาม 1 แก้ว แล้วมื้อคืนพรุ่งนี้ทานตามเวลาปกติ",
        reason: "ยาลดไขมันรุ่นใหม่ออกฤทธิ์ได้ตลอด 24 ชั่วโมง การทานช้าเล็กน้อยยังให้ผลดี"
      };
    } else {
      return {
        drugName: drugName,
        action: "SKIP_TO_NEXT",
        badge: "🔴 ข้ามมื้อนี้ไปก่อน",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        advice: "หากลืมทานจนถึงช่วงกลางวันของอีกวัน ให้ข้ามมื้อที่ลืมไปเลยจ้ะ รอทานมื้อก่อนนอนคืนถัดไปตามปกติ ห้ามทานเบิ้ลจ้ะ",
        reason: "การทานยาลดไขมันสองมื้อติดกันมากเกินไปอาจทำให้ปวดเมื่อยกล้ามเนื้อจากระดับยาเกิน"
      };
    }
  }

  // 6. Amoxicillin / ยาปฏิชีวนะ / ฆ่าเชื้อ
  if (name.includes("amoxicillin") || name.includes("augmentin") || name.includes("ฆ่าเชื้อ") || name.includes("ปฏิชีวนะ")) {
    if (hoursLeftBeforeNext >= 3.5) {
      return {
        drugName: drugName,
        action: "TAKE_NOW",
        badge: "🟢 ทานทันทีที่นึกได้",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        advice: "ยาฆ่าเชื้อสำคัญมากต่อการควบคุมเชื้อโรค ทานมื้อนี้ทันทีที่นึกได้ และมื้อถัดไปให้เว้นระยะห่างอย่างน้อย 4-6 ชั่วโมงจ้ะ",
        reason: "ต้องรักษาระดับยาในกระแสเลือดให้สูงกว่าระดับฆ่าเชื้อ (MIC) อย่างต่อเนื่อง"
      };
    } else {
      return {
        drugName: drugName,
        action: "SKIP_TO_NEXT",
        badge: "🔴 ข้ามมื้อนี้ไปก่อน",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        advice: "เนื่องจากใกล้ถึงเวลามื้อถัดไปมากแล้ว ให้ข้ามมื้อนี้ไปได้เลยจ้ะ แล้วทานมื้อถัดไปตามเวลาปกติ ห้ามเพิ่มขนาดยาเด็ดขาด",
        reason: "การทานยาฆ่าเชื้อซ้อนกันเร็วเกินไปจะทำให้ระคายเคืองกระเพาะอาหารอย่างรุนแรง"
      };
    }
  }

  // 7. ยาทั่วไป (Default Rule: กฎครึ่งรอบเวลา)
  if (delayHours <= 3 && hoursLeftBeforeNext >= 4) {
    return {
      drugName: drugName,
      action: "TAKE_NOW",
      badge: "🟢 ทานได้ทันทีตอนนี้",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      advice: `เพิ่งเลยเวลามาประมาณ ${Math.round(delayHours)} ชม. หยิบทานตอนนี้ได้ทันทีพร้อมน้ำ 1 แก้วจ้ะ มื้อถัดไปทานเวลาเดิมได้เลย`,
      reason: "เลยเวลามาไม่เกินครึ่งรอบของช่วงเวลากินยา สามารถทานชดเชยในมื้อนี้ได้ปลอดภัย"
    };
  } else {
    return {
      drugName: drugName,
      action: "SKIP_TO_NEXT",
      badge: "🔴 ข้ามมื้อนี้ไปก่อน",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      advice: `เลยเวลามานานพอสมควรหรือใกล้ถึงมื้อถัดไปแล้ว มื้อนี้ให้ข้ามไปได้เลยจ้ะ รอทานมื้อถัดไปตามเวลาปกติ และห้ามทาน 2 เท่าเด็ดขาดนะจ๊ะ`,
      reason: "การข้ามมื้อปลอดภัยกว่า เพื่อป้องกันระดับยาในร่างกายสูงเกินเกณฑ์มาตรฐาน (No Double-Dosing)"
    };
  }
}

/**
 * วิเคราะห์ภาพรวมมื้อยาเมื่อลืมทานยา
 */
export function evaluateSlotMissedDose({ pills, slotName, delayHours = 1, hasEatenFood = true, hoursLeftBeforeNext = 5 }) {
  if (!pills || pills.length === 0) {
    return {
      canTakeNow: true,
      summaryTitle: "มื้อนี้ไม่มีรายการยาจ้ะ",
      summaryAdvice: "ไม่มีรายการยาที่ต้องกังวลในมื้อนี้ พักผ่อนให้สบายใจนะจ๊ะ",
      pillEvaluations: []
    };
  }

  const evaluations = pills.map(p => evaluateMissedDoseForDrug(p.name, p.detail, delayHours, hasEatenFood, hoursLeftBeforeNext));

  const hasSkip = evaluations.some(e => e.action === "SKIP_TO_NEXT");
  const hasSnack = evaluations.some(e => e.action === "TAKE_WITH_SNACK");

  let summaryTitle = "🟢 คุณตาสามารถทานยามื้อนี้ได้ตอนนี้จ้ะ";
  let summaryAdvice = "เลยเวลามาไม่นาน สามารถหยิบทานยาตามคำแนะนำแต่ละตัวด้านล่าง พร้อมน้ำ 1 แก้วได้เลยจ้ะ";

  if (hasSkip) {
    summaryTitle = "⚠️ มีบางรายการยาที่แนะนำให้ข้ามมื้อนี้จ้ะ";
    summaryAdvice = "เนื่องจากเลยเวลามาพอสมควร เพื่อความปลอดภัยสูงสุด กรุณาดูคำแนะนำเฉพาะของยาแต่ละตัวด้านล่างจ้ะ";
  } else if (hasSnack) {
    summaryTitle = "🟡 แนะนำทานของว่างเบาๆ ก่อนทานยานะจ๊ะ";
    summaryAdvice = "มียาเบาหวานหรือยาที่ต้องมีอาหารในกระเพาะ แนะนำดื่มนมหรือทานกล้วยก่อนทานยาจ้ะ";
  }

  return {
    canTakeNow: !hasSkip,
    summaryTitle,
    summaryAdvice,
    pillEvaluations: evaluations
  };
}

/**
 * เรียกใช้ Google Gemini API สำหรับการวิเคราะห์แบบ Deep Reasoning & Conversational (เมื่อมี API Key)
 */
export async function callGeminiMissedDoseAdvice(apiKey, { slotTitle, scheduledTime, pills, delayHours, hasEatenFood }) {
  if (!apiKey) {
    throw new Error("ไม่มี Gemini API Key");
  }

  const pillsDesc = (pills || []).map(p => `• ${p.name}: ${p.detail || ''} (คำเตือนฉลาก: ${p.advice || 'ไม่มี'})`).join("\n");
  const prompt = `คุณคือ "น้องก้อย" ผู้ช่วยดูแลสุขภาพและเภสัชกรใจดีของครอบครัว ให้คำแนะนำแก่ผู้สูงอายุ (คุณตา/คุณยาย) ที่ลืมทานยาหรือทานยาช้ากว่าเวลา
ข้อมูลการกินยา:
- มื้อยา: ${slotTitle} (เวลาปกติที่กำหนดไว้: ${scheduledTime || 'ตามตาราง'} น.)
- รายการยาจริงในมื้อนี้:
${pillsDesc}
- สถานการณ์จริง: เลยเวลามาประมาณ ${delayHours} ชั่วโมง
- สถานะอาหาร: ${hasEatenFood ? 'ทานอาหารในมื้อนี้เรียบร้อยแล้ว' : 'ยังไม่ได้ทานอาหาร (ท้องว่าง)'}

คำสั่ง:
1. วิเคราะห์ยาแต่ละตัวในมื้อนี้อย่างถูกต้องตามหลักเภสัชวิทยา (ควรทานตอนนี้เลย หรือควรทานของว่างก่อน หรือควรข้ามมื้อนี้ไป)
2. ใช้สำเนียงพูดภาษาไทยที่สุภาพ อ่อนโยน อบอุ่น ชัดเจน ให้กำลังใจผู้สูงอายุไม่ให้ตกใจ
3. ย้ำเตือนกฎความปลอดภัยที่ห้ามลืมเด็ดขาด คือ "ห้ามเพิ่มขนาดยาเป็น 2 เท่าเพื่อชดเชยมื้อที่ลืมเด็ดขาด"
เขียนตอบสั้นกระชับเข้าใจง่ายประมาณ 3-5 บรรทัด`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error("ไม่สามารถอ่านข้อความตอบกลับจาก Gemini API ได้");
}
