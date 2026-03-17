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
};
