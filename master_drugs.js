/**
 * ฐานข้อมูลยาอ้างอิงทางการแพทย์ (Master Drug Knowledge Base)
 * สำหรับผู้สูงอายุในประเทศไทย อ้างอิงตามแนวทางเวชปฏิบัติและเภสัชวิทยา
 */

export const MASTER_DRUGS = {
  amlodipine: {
    id: "med_amlodipine",
    genericName: "Amlodipine",
    thaiCategory: "ยาลดความดันโลหิตสูง",
    typicalDosageMg: { min: 2.5, max: 10, common: 5 },
    unit: "mg",
    halfLifeHours: 35, // ออกฤทธิ์ยาวนานมาก
    onsetHours: 2,
    safeDelayWindowHours: 12, // เลยเวลาได้ถึง 12 ชม.
    skipIfHoursLeftBeforeNext: 4,
    highAlert: false,
    foodCautions: ["น้ำส้มโอ", "เกรปฟรุต"], // ยับยั้ง CYP3A4 ทำให้ยาเกินขนาด
    sideEffectFriendly: "อาจทำให้มีอาการข้อเท้าบวมเล็กน้อย หรือหน้าแดง หากมีอาการให้แจ้งคุณหมอนะครับ",
    routineAdvice: "ทานมื้อเช้าเป็นประจำ จะช่วยควบคุมความดันให้คงที่ตลอดทั้งวันครับ ดื่มน้ำตามปกติ",
    mealTiming: "after_meal",
    dailySlots: ["morning"]
  },

  metformin: {
    id: "med_metformin",
    genericName: "Metformin",
    thaiCategory: "ยาควบคุมระดับน้ำตาลในเลือด (เบาหวาน)",
    typicalDosageMg: { min: 500, max: 2000, common: 500 },
    unit: "mg",
    halfLifeHours: 6.5,
    onsetHours: 1.5,
    safeDelayWindowHours: 4,
    skipIfHoursLeftBeforeNext: 3,
    highAlert: false,
    foodCautions: ["เครื่องดื่มแอลกอฮอล์"],
    requiresFood: true, // สำคัญมาก: ต้องมีอาหารในกระเพาะ
    sideEffectFriendly: "อาจมีอาการแน่นท้องหรือถ่ายเหลวในช่วงแรก ทานพร้อมข้าวจะช่วยลดอาการได้ดีครับ",
    routineAdvice: "แนะนำทานพร้อมอาหารคำแรก หรือหลังอาหารทันที เพื่อให้ตัวยาช่วยคุมน้ำตาลและไม่ระคายเคืองกระเพาะครับ",
    mealTiming: "with_meal",
    dailySlots: ["morning", "evening"]
  },

  atorvastatin: {
    id: "med_atorvastatin",
    genericName: "Atorvastatin",
    thaiCategory: "ยาลดไขมันในเลือด",
    typicalDosageMg: { min: 10, max: 80, common: 20 },
    unit: "mg",
    halfLifeHours: 14,
    onsetHours: 3,
    safeDelayWindowHours: 8,
    skipIfHoursLeftBeforeNext: 4,
    highAlert: false,
    foodCautions: ["น้ำส้มโอ", "เกรปฟรุต"],
    sideEffectFriendly: "หากมีอาการปวดเมื่อยกล้ามเนื้อมากผิดปกติ หรือปัสสาวะสีชาเข้ม ให้แจ้งคุณหมอทราบนะครับ",
    routineAdvice: "ทานก่อนนอนเป็นประจำ ร่างกายสร้างไขมันช่วงกลางคืน ยานี้จะช่วยดูแลหลอดเลือดให้สะอาดแข็งแรงครับ",
    mealTiming: "bedtime",
    dailySlots: ["bedtime"]
  },

  omeprazole: {
    id: "med_omeprazole",
    genericName: "Omeprazole",
    thaiCategory: "ยาลดกรดและรักษาแผลในกระเพาะอาหาร",
    typicalDosageMg: { min: 20, max: 40, common: 20 },
    unit: "mg",
    halfLifeHours: 1, // ยาออกฤทธิ์ผูกกับปั๊มกรดยาวนานกว่าครึ่งชีวิต
    onsetHours: 1,
    safeDelayWindowHours: 3,
    skipIfHoursLeftBeforeNext: 3,
    highAlert: false,
    foodCautions: ["นมสด", "ยาลดกรดชนิดน้ำ"], // ควรเว้นระยะห่าง 1-2 ชม.
    sideEffectFriendly: "กลืนทั้งเม็ดพร้อมน้ำ ไม่ควรเคี้ยวหรือบดเม็ดยานะครับ",
    routineAdvice: "ทานก่อนอาหารเช้า 30 นาที จะออกฤทธิ์ป้องกันกรดไหลย้อนได้มีประสิทธิภาพสูงสุดครับ",
    mealTiming: "before_meal",
    dailySlots: ["morning"]
  },

  warfarin: {
    id: "med_warfarin",
    genericName: "Warfarin",
    thaiCategory: "ยาต้านการแข็งตัวของเลือด (ยาละลายลิ่มเลือด)",
    typicalDosageMg: { min: 1, max: 10, common: 3 },
    unit: "mg",
    halfLifeHours: 40,
    onsetHours: 24,
    safeDelayWindowHours: 6,
    skipIfHoursLeftBeforeNext: 6,
    highAlert: true, // ยาความเสี่ยงสูงระดับสูงสุด!
    foodCautions: ["ผักใบเขียวเข้มปริมาณมากผิดปกติ", "ใบแปะก๊วย", "กระเทียมสกัด", "โสม"],
    sideEffectFriendly: "หากมีเลือดออกผิดปกติ เช่น เลือดกำเดาไหลไม่หยุด ถ่ายดำ หรือรอยช้ำขนาดใหญ่ ควรรีบพบแพทย์ทันทีครับ",
    routineAdvice: "ต้องทานเวลาเดิมเป๊ะทุกวัน และไปตรวจเลือดตามนัด ห้ามปรับขนาดยาเองโดยเด็ดขาดครับ",
    mealTiming: "evening",
    dailySlots: ["evening"]
  },

  amoxicillin: {
    id: "med_amoxicillin",
    genericName: "Amoxicillin",
    thaiCategory: "ยาฆ่าเชื้อแบคทีเรีย / ยาปฏิชีวนะ",
    typicalDosageMg: { min: 250, max: 1000, common: 500 },
    unit: "mg",
    halfLifeHours: 1.2,
    onsetHours: 1,
    safeDelayWindowHours: 3,
    skipIfHoursLeftBeforeNext: 2,
    highAlert: false,
    foodCautions: [],
    sideEffectFriendly: "หากมีผื่นคัน แน่นหน้าอก ตาบวม ให้หยุดยาทันทีและไปพบแพทย์",
    routineAdvice: "ต้องทานติดต่อกันจนหมดตามที่แพทย์สั่ง แม้อาการจะดีขึ้นแล้ว เพื่อป้องกันเชื้อดื้อยานะครับ",
    mealTiming: "after_meal",
    dailySlots: ["morning", "noon", "evening"]
  }
};
