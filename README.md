# 🎲 บาลีเศรษฐี (Pali Tycoon)

> เกมกระดานแนวเศรษฐี (Monopoly-inspired) สำหรับเรียนรู้ภาษาบาลี ที่เปลี่ยนจาก "การซื้อที่ดิน" เป็น "การพิชิตวิชาบาลี" พร้อมระบบ Spaced Repetition (SRS) สำหรับทบทวนศัพท์และไวยากรณ์

![Pali Tycoon Screen](src/assets/hero.png)

---

## 🎯 คอนเซ็ปต์และจุดเด่น (Key Features)

1. **🗺️ กระดาน ๔๐ วิชาบาลี (40 Monopoly Board Tiles)**
   - ครอบคลุมวิชาไวยากรณ์บาลีครบถ้วน: นามไวยากรณ์, อัพยยศัพท์, วิภัตติ, สนธิ, สมาส, กิตก์, ตัทธิต, พระสูตร, พระวินัย, อภิธรรม
   - การ์ดบุญ (Boon Cards) & การ์ดกรรม (Karma Cards)
   - สนามสอบย่อย (Midterm Exam) และสนามสอบเปรียญ (Grand Parien Exam)

2. **🧠 ระบบตอบคำถาม & Spaced Repetition (SRS Engine)**
   - คำถามบาลี 5 ระดับความยาก (⭐ ง่าย ➔ ⭐⭐⭐⭐⭐ มหาเปรียญ)
   - เมื่อตอบผิด ข้อสอบจะถูกบันทึกลงใน **"สมุดทบทวนบาลี" (Review Notebook)** เพื่อให้นำกลับมาฝึกฝนซ้ำได้อย่างเป็นระบบ

3. **👤 ตัวละคร & ทักษะติดตัว (Character Passive Skills)**
   - 🧘‍♂️ **พระภิกษุ (Monk)**: สกิล *เมตตาธรรม* (ตอบผิดครั้งแรกในแต่ละตา ไม่เสียแต้มปัญญา)
   - 🧒 **สามเณร (Novice)**: สกิล *พากเพียร* (โบนัส EXP & แต้มปัญญา +20%)
   - 👨‍🏫 **ครูบาลี (Teacher)**: สกิล *เชี่ยวชาญ* (มีโอกาสได้คำถามง่ายขึ้น 1 ระดับ)
   - 🎒 **นักเรียนบาลี (Student)**: สกิล *ขยันเล่าเรียน* (โบนัสแต้มปัญญาเริ่มต้น +500 แต้ม)

4. **🏠 ระบบอัปเกรดสำนักเรียน**
   - ตำรา (Base) ➔ ห้องเรียน ➔ สำนักเรียน ➔ สนามสอบ ➔ มหาวิทยาลัยบาลี

5. **🎵 ระบบเสียงพากย์ & เอฟเฟกต์ (Web Audio API Synthesizer)**
   - เสียงระฆังบาลี (Thai Temple Bell), เสียงฉลองชัย "สาธุ" (Sathu Chime), เสียงทอยลูกเต๋า

---

## 💻 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS (Contemporary Thai Temple Palette - Navy `#0D1B2A` & Gold `#D4AF37`)
- **Icons**: Lucide React
- **Effects**: Web Audio API Sound Synthesizer & Canvas Confetti

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

```bash
# 1. Clone repository
git clone https://github.com/purinut357159-droid/pali.git
cd pali

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```
