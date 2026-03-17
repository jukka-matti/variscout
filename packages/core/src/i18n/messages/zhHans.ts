import type { MessageCatalog } from '../types';

/**
 * Simplified Chinese message catalog
 */
export const zhHans: MessageCatalog = {
  // Statistics labels
  'stats.mean': '均值',
  'stats.median': '中位数',
  'stats.stdDev': '标准差',
  'stats.samples': '样本数',
  'stats.passRate': '合格率',
  'stats.range': '极差',
  'stats.min': '最小值',
  'stats.max': '最大值',
  'stats.target': '目标值',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': '观测值',
  'chart.count': '计数',
  'chart.frequency': '频率',
  'chart.value': '值',
  'chart.category': '类别',
  'chart.cumulative': '累积 %',
  'chart.clickToEdit': '点击编辑',
  'chart.median': '中位数',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': '无通道数据',
  'chart.selectChannel': '选择通道',

  // Limit labels (GB standards — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': '均值',
  'limits.target': '目标值',

  // Navigation
  'nav.newAnalysis': '新建分析',
  'nav.backToDashboard': '返回仪表板',
  'nav.settings': '设置',
  'nav.export': '导出',
  'nav.presentation': '演示',
  'nav.menu': '菜单',
  'nav.moreActions': '更多操作',

  // Panel titles
  'panel.findings': '发现',
  'panel.dataTable': '数据表',
  'panel.whatIf': '假设分析',
  'panel.investigation': '调查',
  'panel.coScout': 'CoScout',
  'panel.drillPath': '钻取路径',

  // View modes
  'view.list': '列表',
  'view.board': '看板',
  'view.tree': '树形',

  // Action buttons
  'action.save': '保存',
  'action.cancel': '取消',
  'action.delete': '删除',
  'action.edit': '编辑',
  'action.copy': '复制',
  'action.close': '关闭',
  'action.learnMore': '了解更多',
  'action.download': '下载',
  'action.apply': '应用',
  'action.reset': '重置',
  'action.retry': '重试',
  'action.send': '发送',
  'action.ask': '提问',
  'action.clear': '清除',
  'action.copyAll': '复制全部',
  'action.selectAll': '全选',

  // CoScout
  'coscout.send': '发送',
  'coscout.clear': '清除对话',
  'coscout.stop': '停止',
  'coscout.rateLimit': '已达到速率限制，请稍候。',
  'coscout.contentFilter': '内容已被安全策略过滤。',
  'coscout.error': '发生错误，请重试。',

  // Display/settings
  'display.preferences': '偏好设置',
  'display.chartTextSize': '图表文字大小',
  'display.compact': '紧凑',
  'display.normal': '标准',
  'display.large': '大',
  'display.lockYAxis': '锁定 Y 轴',
  'display.filterContext': '筛选上下文',
  'display.showSpecs': '显示规格',

  // Investigation
  'investigation.brief': '调查简报',
  'investigation.assignedToMe': '分配给我',
  'investigation.hypothesis': '假设',
  'investigation.hypotheses': '假设列表',
  'investigation.pinAsFinding': '固定为发现',
  'investigation.addObservation': '添加观察',

  // Empty states
  'empty.noData': '暂无数据',
  'empty.noFindings': '暂无发现',
  'empty.noResults': '未找到结果',

  // Error messages
  'error.generic': '出现问题',
  'error.loadFailed': '数据加载失败',
  'error.parseFailed': '文件解析失败',

  // Settings labels
  'settings.language': '语言',
  'settings.theme': '主题',
  'settings.textSize': '文字大小',

  // Finding statuses
  'findings.observed': '已观察',
  'findings.investigating': '调查中',
  'findings.analyzed': '已分析',
  'findings.improving': '改进中',
  'findings.resolved': '已解决',

  // Report labels
  'report.summary': '摘要',
  'report.findings': '发现',
  'report.recommendations': '建议',
  'report.evidence': '证据',

  // Data input labels
  'data.pasteData': '粘贴数据',
  'data.uploadFile': '上传文件',
  'data.columnMapping': '列映射',
  'data.measureColumn': '测量列',
  'data.factorColumn': '因子列',
  'data.addData': '添加数据',
  'data.editData': '编辑数据',
  'data.showDataTable': '显示数据表',
  'data.hideDataTable': '隐藏数据表',

  // Status
  'status.cached': '已缓存',
  'status.loading': '加载中',
  'status.ai': 'AI',
};
