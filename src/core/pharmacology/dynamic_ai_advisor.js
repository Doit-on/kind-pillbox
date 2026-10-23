/**
 * ตัวสร้างคำแนะนำ AI อัจฉริยะที่สอดคล้องกับตัวยาจริงในมื้อนั้นๆ (Dynamic Clinical AI Advisor)
 */

export function generateDynamicAdviceForPills(pills, mealSlotName) {
  if (!pills || pills.length === 0) {
    return "มื้อนี้ยังไม่มีรายการยาตามแพทย์สั่งจ้ะ พักผ่อนให้สบายใจนะจ๊ะ";
  }

  const adviceParts = [];
  const cautionParts = [];
  let requiresWaterGlass = true;

  pills.forEach(pill => {
    const nameLower = (pill.name || "").toLowerCase();
    const cautionText = pill.advice || "";

    // 1. คำแนะนำเฉพาะตัวยาตามเภสัชวิทยา
    if (nameLower.includes("amlodipine") || nameLower.includes("norvasc")) {
      adviceParts.push("ยาลดความดันจะช่วยคุมความดันให้คงที่ตลอดวัน");
      cautionParts.push("หลีกเลี่ยงการดื่มน้ำส้มโอหรือเกรปฟรุตเพราะจะทำให้ตัวยาตกค้างเกินขนาดจ้ะ");
    } else if (nameLower.includes("metformin") || nameLower.includes("glucophage")) {
      adviceParts.push("ยาเบาหวานแนะนำทานพร้อมข้าวคำแรก เพื่อช่วยลดน้ำตาลและป้องกันอาการแสบท้องจ้ะ");
      cautionParts.push("ห้ามดื่มเครื่องดื่มแอลกอฮอล์ร่วมด้วยเด็ดขาดจ้ะ");
    } else if (nameLower.includes("omeprazole") || nameLower.includes("miracid")) {
      adviceParts.push("ยาลดกรดควรกลืนทั้งเม็ดพร้อมน้ำ ก่อนอาหาร 30 นาที");
      cautionParts.push("ห้ามเคี้ยวเม็ดยา และเว้นระยะห่างจากนมสดอย่างน้อย 2 ชั่วโมงจ้ะ");
    } else if (nameLower.includes("warfarin") || nameLower.includes("coumadin")) {
      adviceParts.push("ยาละลายลิ่มเลือดมีความสำคัญสูงมาก ต้องทานเวลาเดิมเป๊ะทุกวัน");
      cautionParts.push("หลีกเลี่ยงผักใบเขียวเข้มปริมาณมากผิดปกติ และระวังอย่าให้เกิดแผลฟกช้ำจ้ะ");
    } else if (nameLower.includes("atorvastatin") || nameLower.includes("simvastatin")) {
      adviceParts.push("ยาลดไขมันในเลือดจะออกฤทธิ์ดูแลหลอดเลือดได้ดีที่สุดช่วงเวลานอนพักผ่อน");
    } else if (nameLower.includes("amoxicillin") || nameLower.includes("ฆ่าเชื้อ") || nameLower.includes("ปฏิชีวนะ")) {
      adviceParts.push("ยาฆ่าเชื้อต้องรับประทานติดต่อกันจนหมดตามที่แพทย์สั่งเพื่อป้องกันเชื้อดื้อยาจ้ะ");
    } else if (cautionText && cautionText !== "ทานตามแพทย์สั่ง" && cautionText !== "รับประทานตามที่แพทย์สั่งอย่างเคร่งครัด") {
      adviceParts.push(`ยา ${pill.name}: ${cautionText}`);
    } else {
      adviceParts.push(`ยา ${pill.name} ทานตามฉลากยา ${pill.detail || 'หลังอาหาร'}`);
    }
  });

  let combined = `มื้อ${mealSlotName}นี้มียาตามแพทย์สั่ง ${pills.length} ชนิด: ` + adviceParts.join(", ") + " นะจ๊ะ";
  if (cautionParts.length > 0) {
    combined += " ⚠️ ข้อควรระวัง: " + cautionParts.join(" และ ");
  }
  if (requiresWaterGlass) {
    combined += " ดื่มน้ำตามแก้วใหญ่ๆ 1 แก้วเพื่อช่วยให้ยาดูดซึมได้ดีจ้ะ";
  }

  return combined;
}
