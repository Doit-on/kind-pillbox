# ตลับยาใจดี (Kind Pillbox)
> **Senior-Friendly Medication Intelligence & Gentle Adherence System**  
> *ดูแลด้วยรักและเข้าใจ ปลอดภัยทางการแพทย์ ไร้กลิ่นอายความเย็นชาของ AI*

---

## 🌟 จุดเด่นสำคัญ (Key Highlights)

1. **UX/UI นุ่มนวล อบอุ่น เพื่อผู้สูงอายุโดยเฉพาะ:**
   - ไร้คำศัพท์เทคนิคและคำว่า AI (เปลี่ยนเป็นการพูดคุยเหมือนลูกหลานดูแล)
   - 4 ช่วงเวลาคุ้นเคย: เช้า 🌅, เที่ยง ☀️, เย็น 🌇, ก่อนนอน 🌙
   - ปุ่มยักษ์ขนาดใหญ่ แตะง่าย ไม่ต้องเล็ง
   - ระบบอ่านเสียงแนะนำด้วยน้ำเสียงนุ่มนวล (Text-to-Speech)

2. **ระบบสแกนซองยาความปลอดภัยสองชั้น (Zero-Error Prescription Scanner):**
   - รองรับฉลากยาโรงพยาบาลรัฐ, เอกชน, คลินิกในไทย (`ac`, `pc`, `bid`, `tid`, `hs`, `prn`)
   - ระบบตรวจจับตัวเลขขนาดยาผิดปกติ (Out-of-Range Guard) เช่น สแกนผิดเป็น 500mg แทน 5mg จะล็อกไม่ให้บันทึกเด็ดขาด
   - แจ้งเตือนลูกหลานอัตโนมัติเมื่อพบยากลุ่มเสี่ยงสูง (High-Alert เช่น Warfarin)

3. **เข้าใจผลของการกินยาไม่ตรงเวลา (Pharmacokinetics & Missed-Dose Reasoning):**
   - แปลงสมการ Half-Life เป็น "ความสดชื่นและความสบายใจของร่างกาย"
   - คำแนะนำเมื่อลืมกินยา: เลยเวลาเล็กน้อยทานได้ทันที หรือ ควรทานของว่างก่อน หรือ ข้ามไปมื้อถัดไป
   - กฎเหล็ก: เน้นย้ำเสมอว่า **ห้ามกินยาเบิ้ล 2 เท่าเพื่อชดเชย**

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```
kind_pillbox/
├── package.json                    # การตั้งค่าโปรเจกต์
├── server.js                       # เซิร์ฟเวอร์ Node.js (Zero-dependency)
├── src/
│   ├── core/
│   │   ├── pharmacology/
│   │   │   ├── pharmacokinetics.js # คำนวณระดับยาในร่างกายและเกราะสุขภาพ
│   │   │   ├── missed_dose_advisor.js # กฎการให้คำแนะนำเมื่อลืมกินยา
│   │   │   └── safety_validator.js # ตรวจจับขนาดยาผิดปกติและยาอันตราย
│   │   └── ocr/
│   │       └── prescription_scanner.js # ถอดรหัสฉลากซองยาไทย
│   ├── data/
│   │   └── master_drugs.js         # ฐานข้อมูลยาอ้างอิงทางการแพทย์สำหรับผู้สูงอายุ
│   └── presentation/
│       └── index.html              # หน้าเว็บแอปพลิเคชันหลัก UX/UI อบอุ่น
└── tests/
    ├── test_pharmacology_engine.js # ทดสอบระบบคำนวณและกฎความปลอดภัย
    └── test_prescription_scanner.js# ทดสอบการอ่านฉลากซองยาไทยจริง
```

---

## 🚀 วิธีการทดสอบและเปิดใช้งาน

### 1. ทดสอบระบบความปลอดภัยและเภสัชวิทยา (Test Suite)
```powershell
cd C:\Users\nipon\.gemini\antigravity\scratch\kind_pillbox
node tests/test_pharmacology_engine.js
node tests/test_prescription_scanner.js
```

### 2. รันแอปพลิเคชัน (Start Web App)
```powershell
cd C:\Users\nipon\.gemini\antigravity\scratch\kind_pillbox
node server.js
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 📱 แนวทางการนำไปสร้างแอปมือถือ (Mobile App Deployment)

* **Progressive Web App (PWA):** สามารถกด "Add to Home Screen" บน Safari/Chrome ในมือถือผู้สูงอายุได้ทันที
* **Flutter Integration:** โมดูล Logic ในโฟลเดอร์ `src/core/` สามารถแปลงเป็น Dart Classes ได้ 1:1 เพื่อทำแอปพลิเคชัน iOS/Android แบบ Native
