/**
 * ทดสอบตัวแปลข้อความฉลากยาไทย (Thai Hospital Prescription Parser)
 */

function parsePrescriptionToFields(text) {
  if (!text) return null;
  const clean = text.replace(/\r?\n/g, " ").trim();

  // 1. ตรวจหาชื่อโรงพยาบาล / คลินิก
  let hospital = "ไม่ระบุ";
  const hospMatch = clean.match(/(?:โรงพยาบาล|รพ\.?|คลินิก|Hospital|Clinic)\s*([A-Za-zก-๙\s]{2,30}?)(?=\s+(?:ผู้ป่วย|คนไข้|ชื่อ|ยา|HN|VN|\d|Tab|Cap|[A-Z][a-z])|$)/i);
  if (hospMatch) {
    hospital = hospMatch[0].trim();
  }

  // 2. ตรวจหาชื่อยา (Generic name หรือ Brand name)
  let drugName = "ไม่ระบุ";
  const commonDrugs = [
    "Amlodipine", "Norvasc", "Metformin", "Glucophage", "Omeprazole", "Miracid",
    "Warfarin", "Coumadin", "Atorvastatin", "Lipitor", "Simvastatin", "Zocor",
    "Losartan", "Cozaar", "Enalapril", "Paracetamol", "Amoxicillin", "CPM",
    "Aspirin", "Clopidogrel", "Plavix", "Gabapentin", "Allopurinol"
  ];

  for (const drug of commonDrugs) {
    const regex = new RegExp(`\\b${drug}\\b`, "i");
    if (regex.test(clean)) {
      drugName = drug;
      break;
    }
  }

  if (drugName === "ไม่ระบุ") {
    // หาคำภาษาอังกฤษคำแรกที่มีตัวเลข mg ตามหลัง
    const genericMatch = clean.match(/([A-Za-z]{3,20}(?:\s+[A-Za-z]{3,15})?)\s*(?:\d+(?:\.\d+)?\s*(?:mg|มก))/i);
    if (genericMatch) {
      drugName = genericMatch[1].trim();
    }
  }

  // 3. ตรวจหาขนาดยา (Dosage / Strength)
  let dosage = "ไม่ระบุ";
  const dosageMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:มิลลิกรัม|มก\.?|mg|mcg|ml|มล\.?)/i);
  if (dosageMatch) {
    dosage = `${dosageMatch[1]} mg`;
  }

  // 4. ตรวจหาจำนวนที่ทานต่อครั้ง (Amount per intake)
  let amount = "ครั้งละ 1 เม็ด";
  const amountMatch = clean.match(/(?:ครั้งละ|ละ)\s*(\d+(?:\.\d+)?|\d+\/\d+|ครึ่ง)?\s*(?:เม็ด|แคปซูล|ช้อนชา|tab|cap)/i);
  if (amountMatch) {
    const qty = amountMatch[1] ? (amountMatch[1] === "ครึ่ง" ? "0.5" : amountMatch[1]) : "1";
    amount = `ครั้งละ ${qty} เม็ด`;
  }

  // 5. ตรวจหามื้อยา (Slot: เช้า / เที่ยง / เย็น / ก่อนนอน)
  let slot = "morning";
  if (/(?:ก่อนนอน|ตอนนอน|bedtime|\bhs\b)/i.test(clean)) {
    slot = "bedtime";
  } else if (/(?:เย็น|มื้อเย็น|evening|vesp)/i.test(clean) && !/(?:เช้า|morning)/i.test(clean)) {
    slot = "evening";
  } else if (/(?:เที่ยง|กลางวัน|มื้อเที่ยง|noon|midday)/i.test(clean)) {
    slot = "noon";
  } else if (/(?:เช้า|มื้อเช้า|ตอนเช้า|morning|\bman\b)/i.test(clean)) {
    slot = "morning";
  }

  // 6. ตรวจหาความสัมพันธ์กับอาหาร (Meal Relation)
  let meal = "หลังอาหาร";
  if (/(?:ก่อนอาหาร\s*30\s*นาที|ก่อนอาหาร|\bac\b|before\s*meal)/i.test(clean)) {
    meal = "ก่อนอาหาร 30 นาที";
  } else if (/(?:หลังอาหารทันที|พร้อมอาหาร|with\s*meal)/i.test(clean)) {
    meal = "พร้อมอาหารคำแรก";
  } else if (/(?:ก่อนนอน|\bhs\b|bedtime)/i.test(clean)) {
    meal = "ก่อนนอน";
  } else if (/(?:ตามต้องการ|เมื่อมีอาการ|เวลาปวด|\bprn\b)/i.test(clean)) {
    meal = "ทานเฉพาะเวลาจำเป็น";
  } else if (/(?:หลังอาหาร|\bpc\b|after\s*meal)/i.test(clean)) {
    meal = "หลังอาหาร";
  }

  // 7. ตรวจหาคำเตือนพิเศษ
  let caution = "รับประทานตามที่แพทย์สั่งอย่างเคร่งครัด";
  if (/ส้มโอ|เกรปฟรุต/i.test(clean)) {
    caution = "หลีกเลี่ยงการดื่มน้ำส้มโอหรือเกรปฟรุตร่วมกับยานี้";
  } else if (/นม|ยาลดกรด/i.test(clean)) {
    caution = "ห้ามรับประทานพร้อมนมหรือยาลดกรด ควรเว้นระยะ 2 ชั่วโมง";
  } else if (/ง่วง|ขับรถ/i.test(clean)) {
    caution = "ยานี้อาจทำให้ง่วงซึม ควรหลีกเลี่ยงการขับขี่ยานพาหนะ";
  } else if (/หมด|ติดต่อกัน/i.test(clean)) {
    caution = "รับประทานติดต่อกันจนหมดตามแพทย์สั่ง แม้อาการจะดีขึ้นแล้ว";
  } else if (/แอลกอฮอล์|สุรา/i.test(clean)) {
    caution = "ห้ามดื่มเครื่องดื่มแอลกอฮอล์ร่วมกับยานี้เด็ดขาด";
  }

  return {
    hospital,
    drugName,
    dosage,
    amount,
    slot,
    meal,
    caution
  };
}

// ทดสอบกับซองยาไทยรูปแบบต่างๆ
const testCases = [
  "โรงพยาบาลศิริราช ผู้ป่วย: นายประเสริฐ ยา: Amlodipine 5 mg รับประทานครั้งละ 1 เม็ด วันละ 1 ครั้ง หลังอาหาร เช้า หลีกเลี่ยงน้ำส้มโอ",
  "รพ.จุฬาลงกรณ์ Warfarin 3mg รับประทานครั้งละ 1 เม็ด วันละ 1 ครั้ง ตอนเย็น หลังอาหาร ทานเวลาเดิมทุกวัน",
  "คลินิกหมอสมชาย Omeprazole 20 mg ครั้งละ 1 แคปซูล ก่อนอาหาร 30 นาที เช้า ห้ามทานพร้อมนม",
  "Bangkok Hospital Metformin 500mg take 1 tab with meal morning and evening",
  "รพ.รามาธิบดี Atorvastatin 20 mg รับประทานครั้งละ 1 เม็ด ก่อนนอน"
];

console.log("==========================================================");
console.log("🧪 ทดสอบการแปลข้อความจากฉลากซองยาลงในแต่ละช่องข้อมูล");
console.log("==========================================================\n");

testCases.forEach((t, i) => {
  console.log(`[Test ${i+1}] ข้อความดิบ: "${t}"`);
  const res = parsePrescriptionToFields(t);
  console.log(`   🏥 โรงพยาบาล: ${res.hospital}`);
  console.log(`   💊 ชื่อยา: ${res.drugName}`);
  console.log(`   ⚖️ ขนาดยา: ${res.dosage}`);
  console.log(`   🔢 จำนวน: ${res.amount}`);
  console.log(`   ⏰ มื้อยา: ${res.slot}`);
  console.log(`   🍽️ เวลาอาหาร: ${res.meal}`);
  console.log(`   ⚠️ คำเตือน: ${res.caution}`);
  console.log("----------------------------------------------------------\n");
});
