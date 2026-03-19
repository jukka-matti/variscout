import type { MessageCatalog } from '../types';

/** Vietnamese message catalog */
export const vi: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Trung bình',
  'stats.median': 'Trung vị',
  'stats.stdDev': 'Độ lệch chuẩn',
  'stats.samples': 'Mẫu',
  'stats.passRate': 'Tỷ lệ đạt',
  'stats.range': 'Khoảng biến thiên',
  'stats.min': 'Nhỏ nhất',
  'stats.max': 'Lớn nhất',
  'stats.target': 'Mục tiêu',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Quan sát',
  'chart.count': 'Số lượng',
  'chart.frequency': 'Tần suất',
  'chart.value': 'Giá trị',
  'chart.category': 'Danh mục',
  'chart.cumulative': 'Tích lũy %',
  'chart.clickToEdit': 'Nhấn để chỉnh sửa',
  'chart.median': 'Trung vị',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Không có dữ liệu kênh',
  'chart.selectChannel': 'Chọn kênh',

  // Limit labels (ISO terms used in Vietnam)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Trung bình',
  'limits.target': 'Mục tiêu',

  // Navigation
  'nav.newAnalysis': 'Phân tích mới',
  'nav.backToDashboard': 'Quay lại bảng điều khiển',
  'nav.settings': 'Cài đặt',
  'nav.export': 'Xuất',
  'nav.presentation': 'Trình bày',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Thao tác khác',

  // Panel titles
  'panel.findings': 'Phát hiện',
  'panel.dataTable': 'Bảng dữ liệu',
  'panel.whatIf': 'Giả định',
  'panel.investigation': 'Điều tra',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Đường phân tích chi tiết',

  // View modes
  'view.list': 'Danh sách',
  'view.board': 'Bảng',
  'view.tree': 'Cây',

  // Action buttons
  'action.save': 'Lưu',
  'action.cancel': 'Hủy',
  'action.delete': 'Xóa',
  'action.edit': 'Chỉnh sửa',
  'action.copy': 'Sao chép',
  'action.close': 'Đóng',
  'action.learnMore': 'Tìm hiểu thêm',
  'action.download': 'Tải xuống',
  'action.apply': 'Áp dụng',
  'action.reset': 'Đặt lại',
  'action.retry': 'Thử lại',
  'action.send': 'Gửi',
  'action.ask': 'Hỏi',
  'action.clear': 'Xóa',
  'action.copyAll': 'Sao chép tất cả',
  'action.selectAll': 'Chọn tất cả',

  // CoScout
  'coscout.send': 'Gửi',
  'coscout.clear': 'Xóa cuộc trò chuyện',
  'coscout.stop': 'Dừng',
  'coscout.rateLimit': 'Đã đạt giới hạn yêu cầu. Vui lòng chờ.',
  'coscout.contentFilter': 'Nội dung đã được lọc theo chính sách an toàn.',
  'coscout.error': 'Đã xảy ra lỗi. Vui lòng thử lại.',

  // Display/settings
  'display.preferences': 'Tùy chọn',
  'display.chartTextSize': 'Cỡ chữ biểu đồ',
  'display.compact': 'Thu gọn',
  'display.normal': 'Bình thường',
  'display.large': 'Lớn',
  'display.lockYAxis': 'Khóa trục Y',
  'display.filterContext': 'Ngữ cảnh bộ lọc',
  'display.showSpecs': 'Hiển thị thông số kỹ thuật',

  // Investigation
  'investigation.brief': 'Báo cáo điều tra',
  'investigation.assignedToMe': 'Được giao cho tôi',
  'investigation.hypothesis': 'Giả thuyết',
  'investigation.hypotheses': 'Các giả thuyết',
  'investigation.pinAsFinding': 'Ghim làm phát hiện',
  'investigation.addObservation': 'Thêm quan sát',

  // Empty states
  'empty.noData': 'Không có dữ liệu',
  'empty.noFindings': 'Chưa có phát hiện nào',
  'empty.noResults': 'Không tìm thấy kết quả',

  // Error messages
  'error.generic': 'Đã xảy ra lỗi',
  'error.loadFailed': 'Không thể tải dữ liệu',
  'error.parseFailed': 'Không thể phân tích tệp',

  // Settings labels
  'settings.language': 'Ngôn ngữ',
  'settings.theme': 'Giao diện',
  'settings.textSize': 'Cỡ chữ',

  // Finding statuses
  'findings.observed': 'Đã quan sát',
  'findings.investigating': 'Đang điều tra',
  'findings.analyzed': 'Đã phân tích',
  'findings.improving': 'Đang cải thiện',
  'findings.resolved': 'Đã giải quyết',

  // Report labels
  'report.summary': 'Tóm tắt',
  'report.findings': 'Phát hiện',
  'report.recommendations': 'Khuyến nghị',
  'report.evidence': 'Bằng chứng',

  // Data input labels
  'data.pasteData': 'Dán dữ liệu',
  'data.uploadFile': 'Tải lên tệp',
  'data.columnMapping': 'Ánh xạ cột',
  'data.measureColumn': 'Cột đo lường',
  'data.factorColumn': 'Cột yếu tố',
  'data.addData': 'Thêm dữ liệu',
  'data.editData': 'Chỉnh sửa dữ liệu',
  'data.showDataTable': 'Hiển thị bảng dữ liệu',
  'data.hideDataTable': 'Ẩn bảng dữ liệu',

  // Status
  'status.cached': 'Đã lưu bộ nhớ đệm',
  'status.loading': 'Đang tải',
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

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Quy tắc Nelson 2 — chuỗi {count} {side} trung bình (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Quy tắc Nelson 3 — xu hướng {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'trên',
  'chart.violation.side.below': 'dưới',
  'chart.violation.direction.increasing': 'tăng',
  'chart.violation.direction.decreasing': 'giảm',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',
};
