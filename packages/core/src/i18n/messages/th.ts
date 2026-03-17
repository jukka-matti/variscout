import type { MessageCatalog } from '../types';

/** Thai message catalog */
export const th: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'ค่าเฉลี่ย',
  'stats.median': 'มัธยฐาน',
  'stats.stdDev': 'ส่วนเบี่ยงเบน',
  'stats.samples': 'ตัวอย่าง',
  'stats.passRate': 'อัตราผ่าน',
  'stats.range': 'พิสัย',
  'stats.min': 'ต่ำสุด',
  'stats.max': 'สูงสุด',
  'stats.target': 'เป้าหมาย',
  'stats.sigma': 'ซิกมา',

  // Chart labels
  'chart.observation': 'การสังเกต',
  'chart.count': 'จำนวน',
  'chart.frequency': 'ความถี่',
  'chart.value': 'ค่า',
  'chart.category': 'หมวดหมู่',
  'chart.cumulative': 'สะสม %',
  'chart.clickToEdit': 'คลิกเพื่อแก้ไข',
  'chart.median': 'มัธยฐาน',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'ไม่มีข้อมูลช่อง',
  'chart.selectChannel': 'เลือกช่อง',

  // Limit labels (ISO terms used in Thailand)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'ค่าเฉลี่ย',
  'limits.target': 'เป้าหมาย',

  // Navigation
  'nav.newAnalysis': 'การวิเคราะห์ใหม่',
  'nav.backToDashboard': 'กลับไปแดชบอร์ด',
  'nav.settings': 'การตั้งค่า',
  'nav.export': 'ส่งออก',
  'nav.presentation': 'นำเสนอ',
  'nav.menu': 'เมนู',
  'nav.moreActions': 'การดำเนินการเพิ่มเติม',

  // Panel titles
  'panel.findings': 'ข้อค้นพบ',
  'panel.dataTable': 'ตารางข้อมูล',
  'panel.whatIf': 'จะเป็นอย่างไรถ้า',
  'panel.investigation': 'การสอบสวน',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'เส้นทางเจาะลึก',

  // View modes
  'view.list': 'รายการ',
  'view.board': 'บอร์ด',
  'view.tree': 'โครงสร้างต้นไม้',

  // Action buttons
  'action.save': 'บันทึก',
  'action.cancel': 'ยกเลิก',
  'action.delete': 'ลบ',
  'action.edit': 'แก้ไข',
  'action.copy': 'คัดลอก',
  'action.close': 'ปิด',
  'action.learnMore': 'เรียนรู้เพิ่มเติม',
  'action.download': 'ดาวน์โหลด',
  'action.apply': 'นำไปใช้',
  'action.reset': 'รีเซ็ต',
  'action.retry': 'ลองใหม่',
  'action.send': 'ส่ง',
  'action.ask': 'ถาม',
  'action.clear': 'ล้าง',
  'action.copyAll': 'คัดลอกทั้งหมด',
  'action.selectAll': 'เลือกทั้งหมด',

  // CoScout
  'coscout.send': 'ส่ง',
  'coscout.clear': 'ล้างการสนทนา',
  'coscout.stop': 'หยุด',
  'coscout.rateLimit': 'ถึงขีดจำกัดคำขอ กรุณารอสักครู่',
  'coscout.contentFilter': 'เนื้อหาถูกกรองโดยนโยบายความปลอดภัย',
  'coscout.error': 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',

  // Display/settings
  'display.preferences': 'การตั้งค่า',
  'display.chartTextSize': 'ขนาดตัวอักษรแผนภูมิ',
  'display.compact': 'กะทัดรัด',
  'display.normal': 'ปกติ',
  'display.large': 'ใหญ่',
  'display.lockYAxis': 'ล็อกแกน Y',
  'display.filterContext': 'บริบทตัวกรอง',
  'display.showSpecs': 'แสดงข้อกำหนด',

  // Investigation
  'investigation.brief': 'รายงานการสอบสวน',
  'investigation.assignedToMe': 'มอบหมายให้ฉัน',
  'investigation.hypothesis': 'สมมติฐาน',
  'investigation.hypotheses': 'สมมติฐาน',
  'investigation.pinAsFinding': 'ปักหมุดเป็นข้อค้นพบ',
  'investigation.addObservation': 'เพิ่มการสังเกต',

  // Empty states
  'empty.noData': 'ไม่มีข้อมูล',
  'empty.noFindings': 'ยังไม่มีข้อค้นพบ',
  'empty.noResults': 'ไม่พบผลลัพธ์',

  // Error messages
  'error.generic': 'เกิดข้อผิดพลาดบางอย่าง',
  'error.loadFailed': 'ไม่สามารถโหลดข้อมูลได้',
  'error.parseFailed': 'ไม่สามารถแยกวิเคราะห์ไฟล์ได้',

  // Settings labels
  'settings.language': 'ภาษา',
  'settings.theme': 'ธีม',
  'settings.textSize': 'ขนาดตัวอักษร',

  // Finding statuses
  'findings.observed': 'สังเกตแล้ว',
  'findings.investigating': 'กำลังสอบสวน',
  'findings.analyzed': 'วิเคราะห์แล้ว',
  'findings.improving': 'กำลังปรับปรุง',
  'findings.resolved': 'แก้ไขแล้ว',

  // Report labels
  'report.summary': 'สรุป',
  'report.findings': 'ข้อค้นพบ',
  'report.recommendations': 'ข้อแนะนำ',
  'report.evidence': 'หลักฐาน',

  // Data input labels
  'data.pasteData': 'วางข้อมูล',
  'data.uploadFile': 'อัปโหลดไฟล์',
  'data.columnMapping': 'การจับคู่คอลัมน์',
  'data.measureColumn': 'คอลัมน์ค่าวัด',
  'data.factorColumn': 'คอลัมน์ปัจจัย',
  'data.addData': 'เพิ่มข้อมูล',
  'data.editData': 'แก้ไขข้อมูล',
  'data.showDataTable': 'แสดงตารางข้อมูล',
  'data.hideDataTable': 'ซ่อนตารางข้อมูล',

  // Status
  'status.cached': 'แคชแล้ว',
  'status.loading': 'กำลังโหลด',
  'status.ai': 'AI',
};
