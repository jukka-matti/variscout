import type { MessageCatalog } from '../types';

/**
 * Traditional Chinese message catalog
 */
export const zhHant: MessageCatalog = {
  // Statistics labels
  'stats.mean': '平均值',
  'stats.median': '中位數',
  'stats.stdDev': '標準差',
  'stats.samples': '樣本數',
  'stats.passRate': '合格率',
  'stats.range': '全距',
  'stats.min': '最小值',
  'stats.max': '最大值',
  'stats.target': '目標值',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': '觀測值',
  'chart.count': '計數',
  'chart.frequency': '頻率',
  'chart.value': '值',
  'chart.category': '類別',
  'chart.cumulative': '累積 %',
  'chart.clickToEdit': '點擊以編輯',
  'chart.median': '中位數',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': '無通道資料',
  'chart.selectChannel': '選擇通道',

  // Limit labels (CNS standards — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': '平均值',
  'limits.target': '目標值',

  // Navigation
  'nav.newAnalysis': '新增分析',
  'nav.backToDashboard': '返回儀表板',
  'nav.settings': '設定',
  'nav.export': '匯出',
  'nav.presentation': '簡報',
  'nav.menu': '選單',
  'nav.moreActions': '更多操作',

  // Panel titles
  'panel.findings': '發現',
  'panel.dataTable': '資料表',
  'panel.whatIf': '假設分析',
  'panel.investigation': '調查',
  'panel.coScout': 'CoScout',
  'panel.drillPath': '鑽取路徑',

  // View modes
  'view.list': '清單',
  'view.board': '看板',
  'view.tree': '樹狀',

  // Action buttons
  'action.save': '儲存',
  'action.cancel': '取消',
  'action.delete': '刪除',
  'action.edit': '編輯',
  'action.copy': '複製',
  'action.close': '關閉',
  'action.learnMore': '瞭解更多',
  'action.download': '下載',
  'action.apply': '套用',
  'action.reset': '重設',
  'action.retry': '重試',
  'action.send': '傳送',
  'action.ask': '提問',
  'action.clear': '清除',
  'action.copyAll': '複製全部',
  'action.selectAll': '全選',

  // CoScout
  'coscout.send': '傳送',
  'coscout.clear': '清除對話',
  'coscout.stop': '停止',
  'coscout.rateLimit': '已達速率限制，請稍候。',
  'coscout.contentFilter': '內容已被安全政策過濾。',
  'coscout.error': '發生錯誤，請重試。',

  // Display/settings
  'display.preferences': '偏好設定',
  'display.chartTextSize': '圖表文字大小',
  'display.compact': '精簡',
  'display.normal': '標準',
  'display.large': '大',
  'display.lockYAxis': '鎖定 Y 軸',
  'display.filterContext': '篩選上下文',
  'display.showSpecs': '顯示規格',

  // Investigation
  'investigation.brief': '調查摘要',
  'investigation.assignedToMe': '指派給我',
  'investigation.hypothesis': '假設',
  'investigation.hypotheses': '假設清單',
  'investigation.pinAsFinding': '釘選為發現',
  'investigation.addObservation': '新增觀察',

  // Empty states
  'empty.noData': '暫無資料',
  'empty.noFindings': '尚無發現',
  'empty.noResults': '找不到結果',

  // Error messages
  'error.generic': '發生問題',
  'error.loadFailed': '資料載入失敗',
  'error.parseFailed': '檔案解析失敗',

  // Settings labels
  'settings.language': '語言',
  'settings.theme': '佈景主題',
  'settings.textSize': '文字大小',

  // Finding statuses
  'findings.observed': '已觀察',
  'findings.investigating': '調查中',
  'findings.analyzed': '已分析',
  'findings.improving': '改進中',
  'findings.resolved': '已解決',

  // Report labels
  'report.summary': '摘要',
  'report.findings': '發現',
  'report.recommendations': '建議',
  'report.evidence': '證據',

  // Data input labels
  'data.pasteData': '貼上資料',
  'data.uploadFile': '上傳檔案',
  'data.columnMapping': '欄位對應',
  'data.measureColumn': '量測欄位',
  'data.factorColumn': '因子欄位',
  'data.addData': '新增資料',
  'data.editData': '編輯資料',
  'data.showDataTable': '顯示資料表',
  'data.hideDataTable': '隱藏資料表',

  // Status
  'status.cached': '已快取',
  'status.loading': '載入中',
  'status.ai': 'AI',
};
