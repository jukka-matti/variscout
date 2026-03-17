import type { MessageCatalog } from '../types';

/**
 * Japanese message catalog
 */
export const ja: MessageCatalog = {
  // Statistics labels
  'stats.mean': '平均',
  'stats.median': '中央値',
  'stats.stdDev': '標準偏差',
  'stats.samples': 'サンプル数',
  'stats.passRate': '合格率',
  'stats.range': '範囲',
  'stats.min': '最小',
  'stats.max': '最大',
  'stats.target': '目標値',
  'stats.sigma': 'シグマ',

  // Chart labels
  'chart.observation': '観測値',
  'chart.count': '件数',
  'chart.frequency': '頻度',
  'chart.value': '値',
  'chart.category': 'カテゴリ',
  'chart.cumulative': '累積 %',
  'chart.clickToEdit': 'クリックして編集',
  'chart.median': '中央値',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'チャネルデータなし',
  'chart.selectChannel': 'チャネルを選択',

  // Limit labels (JIS standards — uses ISO abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': '平均',
  'limits.target': '目標値',

  // Navigation
  'nav.newAnalysis': '新規分析',
  'nav.backToDashboard': 'ダッシュボードに戻る',
  'nav.settings': '設定',
  'nav.export': 'エクスポート',
  'nav.presentation': 'プレゼンテーション',
  'nav.menu': 'メニュー',
  'nav.moreActions': 'その他の操作',

  // Panel titles
  'panel.findings': '所見',
  'panel.dataTable': 'データテーブル',
  'panel.whatIf': 'What If',
  'panel.investigation': '調査',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'ドリルパス',

  // View modes
  'view.list': 'リスト',
  'view.board': 'ボード',
  'view.tree': 'ツリー',

  // Action buttons
  'action.save': '保存',
  'action.cancel': 'キャンセル',
  'action.delete': '削除',
  'action.edit': '編集',
  'action.copy': 'コピー',
  'action.close': '閉じる',
  'action.learnMore': '詳細を見る',
  'action.download': 'ダウンロード',
  'action.apply': '適用',
  'action.reset': 'リセット',
  'action.retry': '再試行',
  'action.send': '送信',
  'action.ask': '質問する',
  'action.clear': 'クリア',
  'action.copyAll': 'すべてコピー',
  'action.selectAll': 'すべて選択',

  // CoScout
  'coscout.send': '送信',
  'coscout.clear': '会話をクリア',
  'coscout.stop': '停止',
  'coscout.rateLimit': 'レート制限に達しました。しばらくお待ちください。',
  'coscout.contentFilter': '安全ポリシーによりコンテンツがフィルタリングされました。',
  'coscout.error': 'エラーが発生しました。もう一度お試しください。',

  // Display/settings
  'display.preferences': '表示設定',
  'display.chartTextSize': 'グラフの文字サイズ',
  'display.compact': 'コンパクト',
  'display.normal': '標準',
  'display.large': '大',
  'display.lockYAxis': 'Y軸を固定',
  'display.filterContext': 'フィルターコンテキスト',
  'display.showSpecs': '規格を表示',

  // Investigation
  'investigation.brief': '調査概要',
  'investigation.assignedToMe': '自分に割り当て',
  'investigation.hypothesis': '仮説',
  'investigation.hypotheses': '仮説一覧',
  'investigation.pinAsFinding': '所見として固定',
  'investigation.addObservation': '観察を追加',

  // Empty states
  'empty.noData': 'データがありません',
  'empty.noFindings': '所見はまだありません',
  'empty.noResults': '結果が見つかりません',

  // Error messages
  'error.generic': 'エラーが発生しました',
  'error.loadFailed': 'データの読み込みに失敗しました',
  'error.parseFailed': 'ファイルの解析に失敗しました',

  // Settings labels
  'settings.language': '言語',
  'settings.theme': 'テーマ',
  'settings.textSize': '文字サイズ',

  // Finding statuses
  'findings.observed': '観察済み',
  'findings.investigating': '調査中',
  'findings.analyzed': '分析済み',
  'findings.improving': '改善中',
  'findings.resolved': '解決済み',

  // Report labels
  'report.summary': '概要',
  'report.findings': '所見',
  'report.recommendations': '推奨事項',
  'report.evidence': '証拠',

  // Data input labels
  'data.pasteData': 'データを貼り付け',
  'data.uploadFile': 'ファイルをアップロード',
  'data.columnMapping': '列のマッピング',
  'data.measureColumn': '測定列',
  'data.factorColumn': '要因列',
  'data.addData': 'データを追加',
  'data.editData': 'データを編集',
  'data.showDataTable': 'データテーブルを表示',
  'data.hideDataTable': 'データテーブルを非表示',

  // Status
  'status.cached': 'キャッシュ済み',
  'status.loading': '読み込み中',
  'status.ai': 'AI',
};
