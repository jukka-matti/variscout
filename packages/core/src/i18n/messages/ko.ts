import type { MessageCatalog } from '../types';

/**
 * Korean message catalog
 */
export const ko: MessageCatalog = {
  // Statistics labels
  'stats.mean': '평균',
  'stats.median': '중앙값',
  'stats.stdDev': '표준편차',
  'stats.samples': '샘플 수',
  'stats.passRate': '합격률',
  'stats.range': '범위',
  'stats.min': '최솟값',
  'stats.max': '최댓값',
  'stats.target': '목표값',
  'stats.sigma': '시그마',

  // Chart labels
  'chart.observation': '관측값',
  'chart.count': '개수',
  'chart.frequency': '빈도',
  'chart.value': '값',
  'chart.category': '범주',
  'chart.cumulative': '누적 %',
  'chart.clickToEdit': '클릭하여 편집',
  'chart.median': '중앙값',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': '채널 데이터 없음',
  'chart.selectChannel': '채널 선택',

  // Limit labels (KS standards — uses English abbreviations)
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': '평균',
  'limits.target': '목표값',

  // Navigation
  'nav.newAnalysis': '새 분석',
  'nav.backToDashboard': '대시보드로 돌아가기',
  'nav.settings': '설정',
  'nav.export': '내보내기',
  'nav.presentation': '프레젠테이션',
  'nav.menu': '메뉴',
  'nav.moreActions': '추가 작업',

  // Panel titles
  'panel.findings': '발견사항',
  'panel.dataTable': '데이터 테이블',
  'panel.whatIf': '가정 분석',
  'panel.investigation': '조사',
  'panel.coScout': 'CoScout',
  'panel.drillPath': '드릴 경로',

  // View modes
  'view.list': '목록',
  'view.board': '보드',
  'view.tree': '트리',

  // Action buttons
  'action.save': '저장',
  'action.cancel': '취소',
  'action.delete': '삭제',
  'action.edit': '편집',
  'action.copy': '복사',
  'action.close': '닫기',
  'action.learnMore': '자세히 보기',
  'action.download': '다운로드',
  'action.apply': '적용',
  'action.reset': '초기화',
  'action.retry': '재시도',
  'action.send': '전송',
  'action.ask': '질문',
  'action.clear': '지우기',
  'action.copyAll': '모두 복사',
  'action.selectAll': '모두 선택',

  // CoScout
  'coscout.send': '전송',
  'coscout.clear': '대화 지우기',
  'coscout.stop': '중지',
  'coscout.rateLimit': '요청 한도에 도달했습니다. 잠시 기다려 주세요.',
  'coscout.contentFilter': '안전 정책에 의해 콘텐츠가 필터링되었습니다.',
  'coscout.error': '오류가 발생했습니다. 다시 시도해 주세요.',

  // Display/settings
  'display.preferences': '환경설정',
  'display.chartTextSize': '차트 텍스트 크기',
  'display.compact': '간결',
  'display.normal': '보통',
  'display.large': '크게',
  'display.lockYAxis': 'Y축 잠금',
  'display.filterContext': '필터 컨텍스트',
  'display.showSpecs': '규격 표시',

  // Investigation
  'investigation.brief': '조사 개요',
  'investigation.assignedToMe': '나에게 할당됨',
  'investigation.hypothesis': '가설',
  'investigation.hypotheses': '가설 목록',
  'investigation.pinAsFinding': '발견사항으로 고정',
  'investigation.addObservation': '관찰 추가',

  // Empty states
  'empty.noData': '데이터 없음',
  'empty.noFindings': '아직 발견사항이 없습니다',
  'empty.noResults': '결과 없음',

  // Error messages
  'error.generic': '문제가 발생했습니다',
  'error.loadFailed': '데이터 로드 실패',
  'error.parseFailed': '파일 구문 분석 실패',

  // Settings labels
  'settings.language': '언어',
  'settings.theme': '테마',
  'settings.textSize': '텍스트 크기',

  // Finding statuses
  'findings.observed': '관찰됨',
  'findings.investigating': '조사 중',
  'findings.analyzed': '분석 완료',
  'findings.improving': '개선 중',
  'findings.resolved': '해결됨',

  // Report labels
  'report.summary': '요약',
  'report.findings': '발견사항',
  'report.recommendations': '권장사항',
  'report.evidence': '근거',

  // Data input labels
  'data.pasteData': '데이터 붙여넣기',
  'data.uploadFile': '파일 업로드',
  'data.columnMapping': '열 매핑',
  'data.measureColumn': '측정 열',
  'data.factorColumn': '요인 열',
  'data.addData': '데이터 추가',
  'data.editData': '데이터 편집',
  'data.showDataTable': '데이터 테이블 표시',
  'data.hideDataTable': '데이터 테이블 숨기기',

  // Status
  'status.cached': '캐시됨',
  'status.loading': '로딩 중',
  'status.ai': 'AI',
};
