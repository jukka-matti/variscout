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

  // Methodology Coach
  'coach.frame': 'Frame',
  'coach.scout': 'Scout',
  'coach.investigate': 'Investigate',
  'coach.improve': 'Improve',
  'coach.frameDesc': 'Define the problem and set boundaries',
  'coach.scoutDesc': 'Gather data and explore patterns',
  'coach.investigateDesc': 'Test hypotheses and find root causes',
  'coach.improveDesc': 'Implement changes and verify results',

  // Report KPIs
  'report.kpi.samples': 'Samples',
  'report.kpi.mean': 'Mean',
  'report.kpi.variation': 'Variation',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Pass Rate',

  // AI Actions
  'ai.propose': 'Propose',
  'ai.applied': 'Applied',
  'ai.dismissed': 'Dismissed',
  'ai.expired': 'Expired',

  // Staged analysis
  'staged.before': 'Before',
  'staged.after': 'After',
  'staged.comparison': 'Comparison',

  // Data input / Column mapping
  'data.mapHeading': 'Map Your Data',
  'data.confirmColumns': 'Confirm Columns',
  'data.selectOutcome': 'Select Outcome',
  'data.selectFactors': 'Select Factors',
  'data.analysisSection': 'Analysis Brief',
  'data.optional': 'optional',
  'data.problemPlaceholder': 'Describe the problem you are investigating…',
  'data.outcomeDesc': 'The measurement you want to analyze',
  'data.factorsDesc': 'Categories that might influence the outcome',
  'data.alreadyOutcome': 'Already selected as outcome',
  'data.showNumericOnly': 'Numeric only',
  'data.showCategoricalOnly': 'Categorical only',
  'data.showAllColumns': 'All columns',
  'data.improvementTarget': 'Improvement target',
  'data.metric': 'Metric',
  'data.startAnalysis': 'Start Analysis',
  'data.applyChanges': 'Apply Changes',
  'data.addHypothesis': 'Add hypothesis',
  'data.removeHypothesis': 'Remove hypothesis',
  'data.back': 'Back',

  // Paste screen
  'data.pasteInstructions': 'Paste your data here',
  'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
  'data.useExample': 'Use example data',
  'data.analyzing': 'Analyzing…',
  'data.tipWithData': 'Tip: Include column headers in the first row',
  'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',

  // Data quality
  'quality.allValid': 'All data valid',
  'quality.rowsReady': '{count} rows ready for analysis',
  'quality.rowsExcluded': '{count} rows excluded',
  'quality.missingValues': 'Missing values',
  'quality.nonNumeric': 'Non-numeric values',
  'quality.noVariation': 'No variation',
  'quality.emptyColumn': 'Empty column',
  'quality.noVariationWarning': 'This column has no variation — all values are identical',
  'quality.viewExcluded': 'View excluded',
  'quality.viewAll': 'View all',

  // Manual entry
  'manual.setupTitle': 'Manual Data Entry',
  'manual.analysisMode': 'Analysis mode',
  'manual.standard': 'Standard',
  'manual.standardDesc': 'Single measurement column with optional factors',
  'manual.performance': 'Performance',
  'manual.performanceDesc': 'Multiple measurement channels (fill heads, cavities)',
  'manual.outcome': 'Outcome column',
  'manual.outcomeExample': 'e.g. Weight, Length, Temperature',
  'manual.factors': 'Factors',
  'manual.addFactor': 'Add factor',
  'manual.measureLabel': 'Measure label',
  'manual.measureExample': 'e.g. Fill Head, Cavity, Nozzle',
  'manual.channelCount': 'Number of channels',
  'manual.channelRange': '{min}–{max} channels',
  'manual.startEntry': 'Start Entry',
  'manual.specs': 'Specifications',
  'manual.specsApplyAll': 'Apply to all channels',
  'manual.specsHelper': 'Set specification limits for the outcome column',

  // Chart legend
  'chart.legend.commonCause': 'Common Cause',
  'chart.legend.specialCause': 'Special Cause',
  'chart.legend.outOfSpec': 'Out-of-Spec',
  'chart.legend.inControl': 'In-Control',
  'chart.legend.randomVariation': 'Random variation',
  'chart.legend.defect': 'Customer defect',

  // Chart violations
  'chart.violation.aboveUsl': 'Above USL ({value})',
  'chart.violation.belowLsl': 'Below LSL ({value})',
  'chart.violation.aboveUcl': 'Above UCL — special cause',
  'chart.violation.belowLcl': 'Below LCL — special cause',
  'chart.violation.aboveUclFavorable': 'Above UCL — favorable shift',
  'chart.violation.belowLclFavorable': 'Below LCL — favorable shift',
  'chart.violation.nelson2': 'Nelson Rule 2 — run of {count}',
  'chart.violation.nelson3': 'Nelson Rule 3 — trend of {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Gather initial observations',
  'investigation.phaseDiverging': 'Explore multiple hypotheses',
  'investigation.phaseValidating': 'Test and validate hypotheses',
  'investigation.phaseConverging': 'Narrow to root cause',
  'investigation.phaseImproving': 'Implement and verify changes',
  'investigation.pdcaTitle': 'Verification Checklist',
  'investigation.verifyChart': 'I-Chart stable after change',
  'investigation.verifyStats': 'Cpk meets target',
  'investigation.verifyBoxplot': 'Boxplot spread reduced',
  'investigation.verifySideEffects': 'No side effects observed',
  'investigation.verifyOutcome': 'Outcome sustained over time',
  'investigation.uninvestigated': 'Uninvestigated Factors',

  // Coach mobile phase titles
  'coach.frameTitle': 'Frame the Problem',
  'coach.scoutTitle': 'Scout the Data',
  'coach.investigateTitle': 'Investigate Causes',
  'coach.improveTitle': 'Improve the Process',

  // AI action tool labels
  'ai.tool.applyFilter': 'Apply filter',
  'ai.tool.clearFilters': 'Clear filters',
  'ai.tool.switchFactor': 'Switch factor',
  'ai.tool.createFinding': 'Create finding',
  'ai.tool.createHypothesis': 'Create hypothesis',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',

  // Report
  'report.kpi.inSpec': 'In Spec',

  // Table
  'table.noData': 'No data to display',
  'table.page': 'Page {page} of {total}',
  'table.rowsPerPage': 'Rows per page',
  'table.editHint': 'Click a cell to edit',
  'table.excluded': 'Excluded',
  'table.deleteRow': 'Delete row',
  'table.addRow': 'Add row',
  'table.unsavedChanges': 'Unsaved changes',

  // Specs
  'specs.title': 'Specification Limits',
  'specs.advancedSettings': 'Advanced settings',
  'specs.apply': 'Apply specifications',
  'specs.noChanges': 'No changes to apply',
  'specs.editTitle': 'Edit Specifications',
  'specs.lslLabel': 'Lower Specification Limit (LSL)',
  'specs.uslLabel': 'Upper Specification Limit (USL)',

  // Upgrade
  'upgrade.title': 'Upgrade Available',
  'upgrade.limitReached': 'You have reached the limit for this feature',
  'upgrade.upgrade': 'Upgrade',
  'upgrade.viewOptions': 'View options',
  'upgrade.featureLimit': '{feature} is limited to {limit} in this plan',

  // Display toggles
  'display.violin': 'Violin plot',
  'display.violinDesc': 'Show distribution shape',
  'display.contribution': 'Contribution',
  'display.contributionDesc': 'Show variation contribution',
  'display.sort': 'Sort',
  'display.ascending': 'Ascending',
  'display.descending': 'Descending',

  // Stats panel
  'stats.summary': 'Summary Statistics',
  'stats.histogram': 'Histogram',
  'stats.probPlot': 'Probability Plot',
  'stats.editSpecs': 'Edit specifications',

  // WhatIf
  'whatif.adjustMean': 'Adjust mean',
  'whatif.reduceVariation': 'Reduce variation',
  'whatif.currentProjected': 'Current vs Projected',
  'whatif.resetAdjustments': 'Reset adjustments',
  'whatif.yield': 'Projected yield',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
