import type { MessageCatalog } from '../types';

/**
 * English message catalog — source of truth.
 * All other locale catalogs must satisfy the same interface.
 */
export const en: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Mean',
  'stats.median': 'Median',
  'stats.stdDev': 'Std Dev',
  'stats.samples': 'Samples',
  'stats.passRate': 'Pass Rate',
  'stats.range': 'Range',
  'stats.min': 'Min',
  'stats.max': 'Max',
  'stats.target': 'Target',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observation',
  'chart.count': 'Count',
  'chart.frequency': 'Frequency',
  'chart.value': 'Value',
  'chart.category': 'Category',
  'chart.cumulative': 'Cumulative %',
  'chart.clickToEdit': 'Click to edit',
  'chart.median': 'Median',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'No channel performance data available',
  'chart.selectChannel': 'Select a channel or load performance data',

  // Limit labels
  'limits.usl': 'USL',
  'limits.lsl': 'LSL',
  'limits.ucl': 'UCL',
  'limits.lcl': 'LCL',
  'limits.mean': 'Mean',
  'limits.target': 'Target',

  // Navigation
  'nav.newAnalysis': 'New Analysis',
  'nav.backToDashboard': 'Back to Dashboard',
  'nav.settings': 'Settings',
  'nav.export': 'Export',
  'nav.presentation': 'Presentation',
  'nav.menu': 'Menu',
  'nav.moreActions': 'More actions',

  // Panel titles
  'panel.findings': 'Findings',
  'panel.dataTable': 'Data Table',
  'panel.whatIf': 'What If',
  'panel.analyze': 'Analyze',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Drill Path',

  // View modes
  'view.list': 'List',
  'view.board': 'Board',
  'view.tree': 'Tree',

  // Action buttons
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.edit': 'Edit',
  'action.copy': 'Copy',
  'action.close': 'Close',
  'action.learnMore': 'Learn more',
  'action.download': 'Download',
  'action.apply': 'Apply',
  'action.reset': 'Reset',
  'action.retry': 'Retry',
  'action.send': 'Send',
  'action.ask': 'Ask',
  'action.clear': 'Clear',
  'action.copyAll': 'Copy all',
  'action.selectAll': 'Select all',

  // CoScout
  'coscout.send': 'Send',
  'coscout.clear': 'Clear conversation',
  'coscout.stop': 'Stop',
  'coscout.rateLimit': 'Rate limit reached. Please wait.',
  'coscout.contentFilter': 'Content filtered by safety policy.',
  'coscout.error': 'An error occurred. Please try again.',

  // Display/settings
  'display.preferences': 'Preferences',
  'display.density': 'Display density',
  'display.lockYAxis': 'Lock Y-axis',
  'display.filterContext': 'Filter context',
  'display.showSpecs': 'Show specifications',

  // Analyze
  'analyze.brief': 'Analyze Brief',
  'analyze.assignedToMe': 'Assigned to me',
  'analyze.pinAsFinding': 'Pin as finding',
  'analyze.addObservation': 'Add observation',

  // Empty states
  'empty.noData': 'No data available',
  'empty.noFindings': 'No findings yet',
  'empty.noResults': 'No results found',

  // Error messages
  'error.generic': 'Something went wrong',
  'error.loadFailed': 'Failed to load data',
  'error.parseFailed': 'Failed to parse file',

  // Settings labels
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.textSize': 'Text Size',
  'settings.improvementEvaluation': 'Improvement Evaluation',
  'settings.riskAxis1': 'Risk Axis 1',
  'settings.riskAxis2': 'Risk Axis 2',
  'settings.improvementBudget': 'Improvement Budget',

  // Finding statuses
  'findings.observed': 'Observed',
  'findings.investigating': 'Investigating',
  'findings.analyzed': 'Analyzed',
  'findings.improving': 'Improving',
  'findings.resolved': 'Resolved',

  // Report labels
  'report.summary': 'Summary',
  'report.findings': 'Findings',
  'report.recommendations': 'Recommendations',
  'report.evidence': 'Evidence',

  // Data input labels
  'data.pasteData': 'Paste Data',
  'data.uploadFile': 'Upload File',
  'data.columnMapping': 'Column Mapping',
  'data.measureColumn': 'Measure Column',
  'data.factorColumn': 'Factor Column',
  'data.addData': 'Add data',
  'data.editData': 'Edit data',
  'data.showDataTable': 'Show data table',
  'data.hideDataTable': 'Hide data table',

  // Status
  'status.cached': 'Cached',
  'status.loading': 'Loading',
  'status.ai': 'AI',

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
  'data.issueStatementPlaceholder': 'Describe what you want to investigate…',
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

  // Analyze sidebar
  'analyze.phaseInitial': 'Gather initial observations',
  'analyze.phaseDiverging': 'Explore multiple questions',
  'analyze.phaseValidating': 'Test and validate questions',
  'analyze.phaseConverging': 'Narrow to contribution',
  'analyze.phaseImproving': 'Implement and verify changes',
  'analyze.pdcaTitle': 'Verification Checklist',
  'analyze.verifyChart': 'I-Chart stable after change',
  'analyze.verifyStats': 'Cpk meets target',
  'analyze.verifyBoxplot': 'Boxplot spread reduced',
  'analyze.verifySideEffects': 'No side effects observed',
  'analyze.verifyOutcome': 'Outcome sustained over time',
  'analyze.unanalyzed': 'Unanalyzed Factors',

  // AI action tool labels
  'ai.tool.applyFilter': 'Apply filter',
  'ai.tool.clearFilters': 'Clear filters',
  'ai.tool.switchFactor': 'Switch factor',
  'ai.tool.createFinding': 'Create finding',
  'ai.tool.createQuestion': 'Create question',
  'ai.tool.suggestAction': 'Suggest action',
  'ai.tool.shareFinding': 'Share finding',
  'ai.tool.publishReport': 'Publish report',
  'ai.tool.notifyOwners': 'Notify owners',
  'ai.tool.suggestIdea': 'Suggest improvement idea',
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestHypothesis': 'Suggest hypothesis',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

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
  'table.showAll': 'Show all',

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
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Show η² (effect size)',
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
  'chart.violation.nelson2.detail': 'Nelson Rule 2 — run of {count} {side} mean (#{start}–{end})',
  'chart.violation.nelson3.detail': 'Nelson Rule 3 — trend of {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'above',
  'chart.violation.side.below': 'below',
  'chart.violation.direction.increasing': 'increasing',
  'chart.violation.direction.decreasing': 'decreasing',

  // Parameterized messages
  'data.rowsLoaded': '{count} rows loaded',
  'findings.countLabel': '{count} findings',

  // Chart limit labels (colon-suffixed for SVG rendering)
  'chart.label.ucl': 'UCL:',
  'chart.label.lcl': 'LCL:',
  'chart.label.mean': 'Mean:',
  'chart.label.tgt': 'Tgt:',
  'chart.label.usl': 'USL:',
  'chart.label.lsl': 'LSL:',
  'chart.label.value': 'Value:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Target:',

  // Chart status & empty states
  'chart.status.inControl': 'In control',
  'chart.status.outOfControl': 'Out of control (beyond UCL/LCL)',
  'chart.noDataProbPlot': 'No data available for probability plot',

  // Chart edit affordances
  'chart.edit.spec': 'Click to edit {spec}',
  'chart.edit.axisLabel': 'Click to edit axis label',
  'chart.edit.yAxis': 'Click to edit Y-axis scale',
  'chart.edit.saveCancel': 'Enter to save \u00b7 Esc to cancel',

  // Performance table headers
  'chart.table.channel': 'Channel',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Copy chart to clipboard',
  'chart.maximize': 'Maximize chart',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '\u2193 drill here',
  'chart.percent': 'Percent',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Y-Axis Scale',
  'validation.minLessThanMax': 'Min must be less than Max',
  'action.noChanges': 'No Changes',

  // Create factor modal
  'factor.create': 'Create Factor from Selection',
  'factor.name': 'Factor Name',
  'factor.nameEmpty': 'Factor name cannot be empty',
  'factor.nameExists': 'A factor with this name already exists',
  'factor.example': 'e.g., High Temperature Events',
  'factor.pointsMarked': '{count} points will be marked as:',
  'factor.createAndFilter': 'Create & Filter',
  'factor.filterExplanation':
    'The view will automatically filter to show only the selected points.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Target-centered (e.g. fill weight)',
  'charType.smaller': 'Smaller is better',
  'charType.smallerDesc': 'Lower is better (e.g. defects)',
  'charType.larger': 'Larger is better',
  'charType.largerDesc': 'Higher is better (e.g. yield)',

  // Analyze prompt
  'analyze.trackingPrompt':
    'Tracking your analysis \u2014 open the Analyze panel to see the full picture.',

  // Mobile category sheet
  'chart.highlight': 'Highlight:',
  'chart.highlightRed': 'Red',
  'chart.highlightAmber': 'Amber',
  'chart.highlightGreen': 'Green',
  'chart.clearHighlight': 'Clear highlight',
  'chart.drillDown': 'Drill down into \u201c{category}\u201d',
  'ai.askCoScout': 'Ask CoScout about this',

  // Settings descriptions
  'display.lockYAxisDesc': 'Maintains scale for visual comparison',
  'display.filterContextDesc': 'Display active filter summary below chart headers',

  // Performance detected modal
  'performance.detected': 'Performance Mode Detected',
  'performance.columnsFound': '{count} measurement columns found',
  'performance.labelQuestion': 'What do these measurement channels represent?',
  'performance.labelExample': 'e.g., Fill Head, Cavity, Nozzle',
  'performance.enable': 'Enable Performance Mode',

  // Finding editor & data types
  'finding.placeholder': 'What did you find?',
  'finding.note': 'Finding note',
  'data.typeNumeric': 'Numeric',
  'data.typeCategorical': 'Categorical',
  'data.typeDate': 'Date',
  'data.typeText': 'Text',
  'outcomeNoMatch.noColumn': 'No column called "{name}". Available numeric columns: {columns}.',
  'outcomeNoMatch.nonNumeric': '"{name}" is not numeric, so it cannot be a Y.',
  'outcomeNoMatch.noNumericColumns': 'no numeric columns',
  'data.categories': 'categories',

  // PWA HomeScreen
  'home.heading': 'Explore Variation Analysis',
  'home.description':
    'Free variation analysis training tool. Visualize variability, calculate capability, and find where to focus \u2014 right in your browser.',
  'home.divider': 'or use your own data',
  'home.pasteHelper': 'Copy rows and paste \u2014 we\u2019ll detect columns automatically',
  'home.manualEntry': 'Or enter data manually',
  'home.upgradeHint': 'Need team features, file upload, or saved projects?',

  // PWA navigation
  'nav.presentationMode': 'Presentation Mode',
  'nav.hideFindings': 'Hide Findings',

  // Export
  'export.asImage': 'Export as Image',
  'export.asCsv': 'Export as CSV',
  'export.imageDesc': 'PNG screenshot for presentations',
  'export.csvDesc': 'Spreadsheet-compatible data file',

  // Sample section
  'sample.heading': 'Try a Sample Dataset',
  'sample.allSamples': 'All Sample Datasets',
  'sample.featured': 'Featured',
  'sample.caseStudies': 'Case Studies',
  'sample.journeys': 'Learning Journeys',
  'sample.industry': 'Industry Examples',

  // View modes (additional)
  'view.stats': 'Stats',

  // Display (additional)
  'display.appearance': 'Appearance',

  // Azure toolbar
  'data.manualEntry': 'Manual Entry',
  'data.editTable': 'Edit Data Table',
  'toolbar.saveAs': 'Save As\u2026',
  'toolbar.saving': 'Saving\u2026',
  'toolbar.saved': 'Saved',
  'toolbar.saveFailed': 'Save Failed',
  'toolbar.addMore': 'Add Data',
  'report.scouting': 'Scouting Report',
  'export.csvFiltered': 'Export filtered data as CSV',
  'error.auth': 'Auth error',

  // File browse
  'file.browseLocal': 'Browse this device',
  'file.browseSharePoint': 'Browse SharePoint',
  'file.open': 'Open File',

  // Admin hub
  'admin.title': 'Admin',
  'admin.status': 'Status',
  'admin.teams': 'Teams Setup',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Troubleshooting',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Capability analysis (Cp/Cpk)',
  'feature.performance': 'Performance Mode (multi-channel)',
  'feature.anova': 'ANOVA & factor analysis',
  'feature.findingsWorkflow': 'Findings & analysis workflow',
  'feature.whatIf': 'What-If simulation',
  'feature.csvImport': 'CSV/Excel import',
  'feature.reportExport': 'Report export (PDF)',
  'feature.indexedDb': 'IndexedDB local storage',
  'feature.maxFactors': 'Up to 6 factors',
  'feature.maxRows': 'Up to 250K rows',
  'feature.onedriveSync': 'OneDrive project sync',
  'feature.sharepointPicker': 'SharePoint file picker',
  'feature.teamsIntegration': 'Microsoft Teams integration',
  'feature.channelCollab': 'Channel-based collaboration',
  'feature.mobileUi': 'Mobile-optimized UI',
  'feature.coScoutAi': 'CoScout AI assistant',
  'feature.narrativeBar': 'NarrativeBar insights',
  'feature.chartInsights': 'Chart insight chips',
  'feature.knowledgeBase': 'Knowledge Base (SharePoint search)',
  'feature.aiActions': 'AI-suggested actions',

  // Admin Teams setup
  'admin.teams.heading': 'Add VariScout to Microsoft Teams',
  'admin.teams.description':
    'Generate a Teams app package for your deployment and upload it to your Teams admin center.',
  'admin.teams.running': 'Running inside Microsoft Teams',
  'admin.teams.step1': 'App Registration Client ID (Optional)',
  'admin.teams.step1Desc':
    'Enter your Azure AD App Registration Client ID to enable Teams SSO in the manifest.',
  'admin.teams.step2': 'Download the Teams App Package',
  'admin.teams.step2Desc':
    'This .zip contains the manifest and icons pre-configured for your deployment.',
  'admin.teams.step3': 'Upload to Teams Admin Center',
  'admin.teams.step4': 'Add VariScout to a Channel',
  'admin.teams.download': 'Download Teams App Package',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} checks passed',
  'admin.runChecks': 'Run All Checks',
  'admin.notApplicable': 'Not applicable to your plan',
  'admin.managePortal': 'Manage in Azure Portal',
  'admin.portalAccessNote':
    'These items require Azure Portal access and cannot be checked from the browser.',
  'admin.fixInPortal': 'Fix in Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Common issues and how to fix them. Click an issue to see step-by-step instructions.',
  'admin.runCheck': 'Run Check',
  'admin.checkPassed': 'Check passed \u2014 this may not be the issue.',
  'admin.checkFailed': 'Check failed \u2014 follow the steps below.',
  'admin.issue.signin': 'Users can\u2019t sign in',
  'admin.issue.signinDesc': 'Azure AD authentication is not working or users see a blank page.',
  'admin.issue.signinSteps':
    'Verify App Service Authentication is enabled in Azure Portal.\nCheck the Azure AD app registration has the correct redirect URIs.\nEnsure the app registration has \u201cID tokens\u201d enabled under Authentication.\nVerify the tenant allows user sign-in to the app (Enterprise Applications \u2192 Properties \u2192 Enabled for users to sign-in).',
  'admin.issue.onedrive': 'OneDrive sync not working',
  'admin.issue.onedriveDesc':
    'Projects are not syncing to OneDrive or users see permission errors.',
  'admin.issue.onedriveSteps':
    'Verify the app registration has \u201cFiles.ReadWrite\u201d delegated permission.\nCheck that admin consent has been granted for the Graph permissions.\nEnsure the user has a OneDrive license assigned.\nTry signing out and signing back in to refresh the token.',
  'admin.issue.coscout': 'CoScout not responding',
  'admin.issue.coscoutDesc': 'The AI assistant is not generating responses or shows errors.',
  'admin.issue.coscoutSteps':
    'Verify the AI endpoint is configured in the ARM template / App Service settings.\nCheck that the Azure AI Services resource is deployed and running.\nVerify the model deployment exists (e.g. gpt-4o) in the AI Services resource.\nCheck Azure AI Services quotas \u2014 the deployment may have hit rate limits.',
  'admin.issue.kbEmpty': 'Knowledge Base returns no results',
  'admin.issue.kbEmptyDesc':
    'CoScout\u2019s \u201cSearch Knowledge Base\u201d finds nothing despite documents existing.',
  'admin.issue.kbEmptySteps':
    'Verify the AI Search endpoint is configured in App Service settings.\nCheck that the Remote SharePoint knowledge source has been created in AI Search.\nEnsure \u22651 Microsoft 365 Copilot license is active in the tenant.\nVerify the user has SharePoint access to the documents being searched.\nCheck that the Knowledge Base preview toggle is enabled (Admin \u2192 Knowledge Base tab).',
  'admin.issue.teamsTab': 'Teams tab not showing',
  'admin.issue.teamsTabDesc': 'VariScout does not appear in Teams or the tab fails to load.',
  'admin.issue.teamsTabSteps':
    'Verify the Teams app package (.zip) was uploaded to Teams Admin Center.\nCheck that the manifest.json contentUrl matches your App Service URL.\nEnsure the app is approved in Teams Admin Center (not blocked by policy).\nTry removing and re-adding the tab in the channel.\nIf using a custom domain, verify it\u2019s in the manifest\u2019s validDomains array.',
  'admin.issue.newUser': 'New user can\u2019t access the app',
  'admin.issue.newUserDesc': 'A newly added user sees an access denied or blank page.',
  'admin.issue.newUserSteps':
    'In Azure AD, go to Enterprise Applications \u2192 VariScout \u2192 Users and groups.\nAdd the user or their security group to the app.\nIf using \u201cUser assignment required\u201d, ensure the user has an assignment.\nCheck Conditional Access policies that might block the user.',
  'admin.issue.aiSlow': 'AI responses are slow',
  'admin.issue.aiSlowDesc': 'CoScout takes a long time to respond or frequently times out.',
  'admin.issue.aiSlowSteps':
    'Check the Azure AI Services deployment region \u2014 latency increases with distance.\nVerify the model deployment has sufficient TPM (tokens per minute) quota.\nConsider upgrading to a provisioned throughput deployment for consistent latency.\nCheck if the AI Search index is large \u2014 consider optimizing the knowledge source.',
  'admin.issue.forbidden': '\u201cForbidden\u201d errors',
  'admin.issue.forbiddenDesc': 'Users see 403 errors when accessing certain features.',
  'admin.issue.forbiddenSteps':
    'Check that all required Graph API permissions have admin consent.\nVerify the App Service Authentication token store is enabled.\nEnsure the user\u2019s token hasn\u2019t expired \u2014 try signing out and back in.\nCheck Conditional Access policies for the tenant.',
  'admin.issue.kbPartial': 'KB fails for some users',
  'admin.issue.kbPartialDesc': 'Knowledge Base search works for admins but not for other users.',
  'admin.issue.kbPartialSteps':
    'Remote SharePoint knowledge sources use per-user permissions. Each user must have SharePoint access to the documents.\nCheck if the affected users are blocked by Conditional Access policies.\nVerify admin consent was granted for the Sites.Read.All delegated permission.\nAsk the affected users to sign out and sign back in to refresh their token.',

  // Workspace navigation
  'workspace.process': 'Process',
  'workspace.explore': 'Explore',
  'workspace.analyze': 'Analyze',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
  'workspace.improve': 'Improve',
  'workspace.project': 'Project',
  'workspace.report': 'Report',

  // Synthesis card
  'synthesis.title': 'Suspected Cause',
  'synthesis.placeholder': 'The evidence points to\u2026',
  'synthesis.coachNudge': 'Ready to summarize your understanding?',
  'synthesis.maxLength': 'Max 500 characters',

  // Improvement workspace
  'improve.title': 'Improvement Plan',
  'improve.backToAnalysis': 'Back to Analysis',
  'improve.fourDirections': 'Think: Prevent \u00b7 Detect \u00b7 Simplify \u00b7 Eliminate',
  'improve.convertToActions': 'Convert selected \u2192 Actions',
  'improve.noIdeas': 'No improvement ideas yet',
  'improve.emptyNoFindings':
    'Pin findings from the Analysis view, then brainstorm improvement ideas here.',
  'improve.emptyNoSupported':
    'Answer your questions in Analyze. Answered questions unlock improvement brainstorming.',
  'improve.selectedCount': '{count} selected',
  'improve.timeframeBreakdown':
    '{justDo} just do \u00b7 {days} days \u00b7 {weeks} wks \u00b7 {months} mo',
  'improve.projectedCpk': 'Best projected Cpk: {value}',
  'improve.targetDelta': '\u0394 {delta} to target',
  'improve.convertedToAction': '\u2192 Action',
  'improve.maxRisk': 'Max risk: {level}',
  'improve.totalCost': '\u20ac{amount}',
  'improve.budgetStatus': '\u20ac{spent} / \u20ac{budget}',
  'improve.actionsDone': 'actions done',
  'improve.overdue': 'overdue',
  'improve.addVerification': 'Add verification',
  'improve.assessOutcome': 'Assess outcome',
  'improve.viewActions': 'View Actions',
  'improve.actions': 'actions',
  'improve.done': 'done',

  // Brainstorm modal
  'brainstorm.title': 'Brainstorm',
  'brainstorm.subtitle': 'No judging yet — just ideas',
  'brainstorm.selectSubtitle': 'Tap ideas to select',
  'brainstorm.inputPlaceholder': '+ type an idea...',
  'brainstorm.doneBrainstorming': 'Done brainstorming →',
  'brainstorm.addToPlan': 'Add {count} to plan →',
  'brainstorm.back': '← Back',
  'brainstorm.sparkMore': 'Spark more',
  'brainstorm.inviteTeam': 'Invite team',
  'brainstorm.copyLink': 'Copy link',
  'brainstorm.ideaCount': '{count} ideas · {directions} directions',
  'brainstorm.selectedCount': '{selected} of {total} selected',
  'brainstorm.parkedLabel': 'Parked ideas',
  'brainstorm.triggerButton': 'Brainstorm',
  'brainstorm.joinToast.title': 'Brainstorm session started',
  'brainstorm.joinToast.body': '{name} started brainstorming ideas for {cause}',
  'brainstorm.joinToast.join': 'Join session',
  'brainstorm.joinToast.later': 'Later',

  // Timeframe labels (replaces effort)
  'timeframe.label': 'Timeframe',
  'timeframe.justDo': 'Just do',
  'timeframe.days': 'Days',
  'timeframe.weeks': 'Weeks',
  'timeframe.months': 'Months',
  'timeframe.justDo.description': 'Right now, existing resources, no approval needed',
  'timeframe.days.description': 'Minor coordination, can be done this week',
  'timeframe.weeks.description': 'Requires planning, moderate resources',
  'timeframe.months.description': 'Investment, cross-team, significant planning',

  // Cost labels
  'cost.label': 'Cost',
  'cost.none': 'None',
  'cost.low': 'Low',
  'cost.medium': 'Medium',
  'cost.high': 'High',
  'cost.amount': '\u20ac{amount}',
  'cost.budget': '\u20ac{spent} / \u20ac{budget}',

  // Risk labels
  'risk.label': 'Risk',
  'risk.low': 'Low',
  'risk.medium': 'Medium',
  'risk.high': 'High',
  'risk.veryHigh': 'Very high',
  'risk.notSet': 'Not set',
  'risk.axis1Label': '{axis} Impact',
  'risk.small': 'Small',
  'risk.significant': 'Significant',
  'risk.severe': 'Severe',
  'risk.none': 'None',
  'risk.possible': 'Possible',
  'risk.immediate': 'Immediate',
  'risk.preset.process': 'Process',
  'risk.preset.safety': 'Safety',
  'risk.preset.environmental': 'Environmental',
  'risk.preset.quality': 'Quality',
  'risk.preset.regulatory': 'Regulatory',
  'risk.preset.brand': 'Brand',

  // Prioritization matrix
  'matrix.title': 'Prioritization Matrix',
  'matrix.listView': 'List',
  'matrix.matrixView': 'Matrix',
  'matrix.yAxis': 'Y-Axis',
  'matrix.xAxis': 'X-Axis',
  'matrix.color': 'Color',
  'matrix.preset.bangForBuck': 'Bang for Buck',
  'matrix.preset.quickImpact': 'Quick Impact',
  'matrix.preset.riskReward': 'Risk-Reward',
  'matrix.preset.budgetView': 'Budget View',
  'matrix.quickWins': 'Quick Wins',
  'matrix.clickToSelect': 'Click to select',
  'matrix.selected': 'Selected',
  'matrix.axis.benefit': 'Benefit',
  'matrix.axis.timeframe': 'Timeframe',
  'matrix.axis.cost': 'Cost',
  'matrix.axis.risk': 'Risk',
  'benefit.low': 'Low',
  'benefit.medium': 'Medium',
  'benefit.high': 'High',

  // Idea direction labels (Four Ideation Directions)
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',
  'idea.whatIfSimulator': 'What-If Simulator',
  'idea.askCoScout': 'Ask CoScout',
  'idea.delete': 'Delete idea',
  'idea.addPlaceholder': 'Add improvement idea...',
  'idea.addButton': 'Add',
  'idea.askCoScoutForIdeas': 'Ask CoScout for ideas',
  'idea.moreOptions': 'More options',
  'idea.riskAssessment': 'Risk assessment',

  // Question role labels
  'question.primary': 'Primary',
  'question.contributing': 'Contributing',

  // Projected vs actual
  'outcome.projectedVsActual': 'Projected {projected} \u2192 Actual {actual}',
  'outcome.delta': '({sign}{delta})',

  // Improvement convergence
  'improve.convergenceNudge':
    'Your evidence is converging \u2014 summarize what you\u2019ve learned in the Improvement Plan.',

  // Defect detected modal
  'defect.detected.title': 'Defect Data Detected',
  'defect.detected.confidence': 'confidence',
  'defect.detected.dataShape': 'Data shape',
  'defect.detected.defectType': 'Defect type',
  'defect.detected.count': 'Count',
  'defect.detected.result': 'Result',
  'defect.detected.unitsProduced': 'Units produced',
  'defect.detected.aggregationUnit': 'Group defects by',
  'defect.detected.dismiss': 'Use Standard Mode',
  'defect.detected.enable': 'Enable Defect Mode',
  'defect.detected.stepOfOrigin': 'Step of origin',
  'defect.detected.stepOfOriginHint':
    'Identifies which step caught each defect. Optional — defects anchor to outcome when not set.',

  // ── DefectDispatchBanner (ER-5b) ──
  'defect.dispatch.banner.label': '⌖ Detected count data — analyzing defect rates',
  'defect.dispatch.banner.adjust': 'adjust columns ▾',
  'defect.dispatch.banner.useStandard': 'use as standard data',

  // Report workspace view
  'report.cpkLearningLoop': 'Cpk Learning Loop',
  'report.verdict.effective': 'Effective',
  'report.verdict.partiallyEffective': 'Partially effective',
  'report.verdict.notEffective': 'Not effective',
  'report.cpk.before': 'Before',
  'report.cpk.projected': 'Projected',
  'report.cpk.actual': 'Actual',
  'report.cpk.pendingVerification': 'Pending verification',
  'report.cpk.metProjection': 'Met projection',
  'report.cpk.fromProjection': '{delta} from projection',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.analyzeReport': 'Analyze Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.selectedCount': '{count} selected',
  'report.bestProjectedCpk': 'Best projected Cpk: {value}',
  'report.meetsTarget': '(meets target)',
  'report.costCategory': '{category} cost',
  'report.noCost': 'No cost',
  'report.riskLevel': '{level} risk',

  // Factor Intelligence
  'fi.title': 'Factor Intelligence',
  'fi.ranking': 'Factor ranking (R² adjusted)',
  'fi.layer2': 'Layer 2 · Main Effects',
  'fi.layer3': 'Layer 3 · Factor Interactions',
  'fi.investigate': 'Investigate →',
  'fi.notSignificant': 'not significant (p={value})',
  'fi.explainsSingle': '{factor} explains {pct}% of variation alone.',
  'fi.explainsMultiple': '{factors} together explain {pct}% of variation.',
  'fi.layer2Locked': 'Layer 2 (Main Effects) unlocks when R²adj > {threshold}%',
  'fi.layer2Current': ' — currently {value}%',
  'fi.layer3Locked': 'Layer 3 (Interactions) unlocks when ≥2 factors are significant',
  'fi.layer3Current': ' — currently {count} significant',
  'fi.best': 'Best',
  'fi.range': 'Range',
  'fi.interactionDetected': "Interaction detected: {factorA}'s effect depends on {factorB} level.",
  'fi.noInteraction': 'No significant interaction — effects are approximately additive.',

  // Capability suggestion modal
  'capability.suggestion.title': 'Specification limits set',
  'capability.suggestion.description':
    'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?',
  'capability.suggestion.whatYouSee': "What you'll see:",
  'capability.suggestion.bullet1': 'I-Chart plotting Cp and Cpk per subgroup',
  'capability.suggestion.bullet2': 'Whether subgroups consistently meet your target',
  'capability.suggestion.bullet3': 'Centering loss (gap between Cp and Cpk)',
  'capability.suggestion.startCapability': 'Start with Capability View',
  'capability.suggestion.standardView': 'Standard View',
  'capability.suggestion.footer': 'You can switch anytime using the toggle in the I-Chart header.',

  // Annotations
  'annotations.redHighlight': 'Red highlight',
  'annotations.amberHighlight': 'Amber highlight',
  'annotations.greenHighlight': 'Green highlight',
  'annotations.active': 'active',

  // Subgroup
  'subgroup.method': 'Subgroup Method',
  'subgroup.fixedSize': 'Fixed size',
  'subgroup.byColumn': 'By column',
  'subgroup.configuration': 'Subgroup Configuration',
  'subgroup.configureSubgroups': 'Configure subgroups',

  // Capability
  'capability.specsDetected': 'Specification limits detected',
  'capability.startCapabilityView': 'Start Capability View',
  'capability.cpkTrendSubgroup': 'Cpk trend per subgroup',
  'capability.standardView': 'Standard View',
  'capability.individualValuesChart': 'Individual values chart',
  'capability.switchAnytime': 'You can switch anytime using the toggle in the I-Chart header.',
  'capability.type': 'Type:',
  'capability.cpkTarget': 'Cpk target:',
  'capability.insufficientData': 'Insufficient data',
  'capability.meetsTarget': 'Meets target',
  'capability.marginal': 'Marginal',
  'capability.belowTarget': 'Below target',

  // Quality (additional)
  'quality.dataFile': 'Data File',

  // Finding (additional)
  'finding.addObservation': 'Add observation',

  // Action (additional)
  'action.continue': 'Continue',
  'action.drillDown': 'Drill Down',
  'action.viewDetails': 'View Details',

  // Canvas Wall overlay
  'canvas.wall.shortcutLabel': 'Open Wall',

  // Analyze Wall
  'wall.status.proposed': 'Suspected',
  'wall.status.evidenced': 'Suspected',
  // Catalog key is kept as `wall.status.confirmed` for stability; the status
  // CODE is now `'evidence-survived-test'` (CS-10). Falsification logic never
  // *confirms* a hypothesis — it can only fail to break it. The L-2 display
  // vocabulary maps that stored value to "Supported".
  'wall.status.confirmed': 'Supported',
  'wall.status.refuted': 'Ruled out',
  'wall.status.needsDisconfirmation': 'Suspected',
  // CS-10 — analyst-owned status. The suggestion chip is advisory only; the
  // analyst decides. "mark Supported?" never auto-applies.
  'wall.status.suggestSupported': '2 evidence types + a survived test — mark Supported?',
  'wall.status.setLabel': 'Set status',
  'wall.card.hypothesisLabel': 'Suspected cause',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
  'wall.card.oneStepAway':
    '1 step away — running a disconfirmation test would let you mark this Supported',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events',
  'wall.problem.noSpecs': 'no specs set',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events',
  'wall.scope.whatIf': 'If fixed: Cpk {value}',
  'wall.scope.coverage': 'Covers {value}%',
  'wall.evidence.supports': 'Supports',
  'wall.evidence.countsAgainst': 'Counts against',
  'wall.evidence.contributingFactors': 'Contributing factors',
  'wall.factorGlyph.aria': 'Focus factor {factor}',
  'wall.exploreJump.aria': 'Open {factor} in Explore',
  'wall.disconfirm.prompt': 'We tried to break this — did it hold?',
  'wall.disconfirm.descriptionLabel': 'What did you try?',
  'wall.disconfirm.verdictLabel': 'Did it hold?',
  'wall.disconfirm.verdictPending': 'Still checking',
  'wall.disconfirm.verdictSurvived': 'Held up (survived)',
  'wall.disconfirm.verdictRefuted': 'Broke it (refuted)',
  'wall.disconfirm.record': 'Record',
  'wall.disconfirm.cancel': 'Cancel',
  // FE-2b — the fused "Try to break it" premortem (spec §4.2)
  'wall.disconfirm.tryToBreakIt': 'Try to break it',
  'wall.disconfirm.tryToBreakItHint':
    'Predict what would prove this WRONG — the test grades the verdict.',
  'wall.disconfirm.predictLabel': 'What would you expect to see if this is wrong?',
  'wall.disconfirm.predictPlaceholder':
    'e.g. if the night shift drives it, day-shift runs should run cool…',
  'wall.disconfirm.predictHint': 'Optional, but a sharp prediction makes the test severe.',
  'wall.disconfirm.manualFallback': 'Log a gemba or expert disconfirmation (no data)',
  'wall.disconfirm.verdictSurvivedToast': 'Survived — the cause withstood the attempt.',
  'wall.disconfirm.verdictRefutedToast': 'Refuted — the predicted relationship was absent.',
  // FE-2b — the §4.1 soft caveat for an unbacked survived attempt
  'wall.caveat.unbackedSurvived': 'Supported — disconfirmation has no attached evidence',
  'wall.caveat.backWithTest': 'back it with a test →',
  // FE-2b — refute → respawn-sharper (spec §4.2)
  'wall.respawn.sharpenCta': 'Sharpen → propose a new hypothesis',
  'wall.respawn.nameLabel': 'New hypothesis',
  'wall.respawn.namePlaceholder': 'e.g. it’s the spindle, regardless of shift',
  'wall.respawn.carryNote':
    'The refuting finding carries forward as supporting evidence for the new hypothesis.',
  'wall.respawn.confirm': 'Create sharpened hypothesis',
  'wall.respawn.cancel': 'Cancel',
  'wall.respawn.supersededBy': 'superseded by →',
  // FE-2b — the confound sign-prompt + side-by-side What-If (spec §4.2)
  'wall.confound.heading': 'This factor is also cited by a rival cause',
  'wall.confound.prompt': 'Mark the opposite sign on “{rival}”?',
  'wall.confound.markOpposite': 'Counts against the rival',
  'wall.confound.notAdditive':
    'These projections are not additive — each cause is its own What-If.',
  'wall.confound.whatIfFor': 'If you control “{hypothesis}”',
  // FE-2b — the activated affordances (spec §4.2)
  'wall.affordance.tryDisconfirmation': 'Try disconfirmation',
  'wall.affordance.oneStepAwayAction': 'Open the test plan with “Try to break it” ready',
  // ActionItem tasks on hypotheses (IM-4b Task 3)
  'wall.task.addButton': '+ Add Task',
  'wall.task.taskLabel': 'Task description',
  'wall.task.save': 'Save',
  'wall.task.cancel': 'Cancel',
  'wall.task.markDone': 'Mark Done',
  // Plan-owner data-collection task surface (IM-4b Task 4)
  'wall.collect.assigned': 'Assigned: collect {primaryFactor}',
  'wall.collect.status.planned': 'planned',
  'wall.collect.status.inProgress': 'in-progress',
  'wall.collect.status.complete': 'complete',
  'wall.collect.status.skipped': 'skipped',
  'wall.collect.due': 'Due: {date}',
  // L-3 suspected-cause activity layer
  'wall.activity.inFlightHeading': 'In flight - evidence being collected',
  'wall.activity.pendingAttempt': 'Break attempt pending:',
  'wall.activity.stalledHeading': 'Nothing in flight for {days} working days',
  'wall.activity.planCheck': 'Plan a check',
  'wall.activity.goLook': 'Go look',
  'wall.activity.ruleOut': 'Rule it out',
  // PR-CS-11 — analyst-owned plan-status select + re-ingest pending-match prompt (Task 5)
  'wall.collect.setStatusLabel': 'Set plan status',
  'wall.collect.pending.prompt': 'Factor “{column}” arrived — needed by this plan',
  'wall.collect.pending.linkFinding': 'Link finding…',
  'wall.collect.pending.markInProgress': 'Mark in-progress',
  'wall.collect.pending.dismiss': 'Dismiss matched factor',
  'wall.scope.archive': 'Archive scope {condition}',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Suspected cause empty state',
  'wall.empty.title': 'Start a suspected cause',
  'wall.empty.subtitle': 'Start from a suspected cause, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Add a suspected cause',
  'wall.empty.seedFromFactorIntel': 'Seed 3 largest contributors',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': "Evidence you haven't checked yet ({count})",
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.missing.collapsed': 'Show details',
  'wall.missing.expanded': 'Hide details',
  'wall.canvas.ariaLabel': 'Suspected cause workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected cause from this finding',
  // Model-builder band (Factors & Evaluation Increment 1)
  'wall.model.bandAriaLabel': 'Vital-few model builder',
  'wall.model.title': 'What accounts for the spread in this data',
  'wall.model.keptHeading': 'Vital few',
  'wall.model.candidatesHeading': 'Other factors',
  'wall.model.vitalFewLine': 'vital-few line',
  'wall.model.rSquaredAdj': 'R²adj {value}',
  'wall.model.factorP': 'p {value}',
  'wall.model.associationStrength': 'Association strength',
  'wall.model.deltaR2': 'ΔR² {value}',
  'wall.model.notAVerdict':
    'Associated with the spread in this scope — a clue to investigate, not a verdict.',
  'wall.model.deltaR2Caption':
    'Each bar is a factor’s unique share of the spread; correlated factors overlap, so they need not sum to the model fit.',
  'wall.model.useSuggested': '↩ Use suggested model',
  'wall.model.addToModel': 'Add {factor} to the model',
  'wall.model.removeFromModel': 'Remove {factor} from the model',
  'wall.model.fitOnlyDot': 'Fit-only estimate',
  'wall.model.fitOnlyTooltip':
    'Few observations per factor — treat this as a fit-only estimate, not a confirmed result.',
  'wall.model.redundancy':
    'Removing {factor} barely changed the model — it is correlated with another factor, redundant not irrelevant.',
  'wall.model.redundancyDismiss': 'Dismiss',
  'wall.model.vifTooltip': 'VIF {value}',
  'wall.model.tooFewRows': 'Too few rows to re-rank — showing parent scope.',
  'wall.model.constantInScope': 'constant in scope',
  'wall.model.captureModel': 'Capture model as Finding',
  'wall.model.empty': 'Set an outcome and factors to build a model.',
  'wall.model.capturedText':
    'Model: {factors} accounts for the spread (R²adj {rSquaredAdj}) in {scope}',
  // ── Model drawer (ER-3 — "The model behind the ranking") ──
  'modelDrawer.title': 'The model behind the ranking',
  'modelDrawer.subtitle': '{outcome} ~ {terms} · fitted on {scope}',
  'modelDrawer.closeAria': 'Close the model drawer',
  'modelDrawer.empty': 'Set an outcome and factors to build a model.',
  'modelDrawer.summaryHeading': 'Model summary',
  'modelDrawer.summaryS': 'S (residual σ)',
  'modelDrawer.summaryR2': 'R²',
  'modelDrawer.summaryR2adj': 'R²adj',
  'modelDrawer.summaryN': 'n',
  'modelDrawer.summaryCaption':
    'S is the everyday variation left after the model — the same number family as the residual chip on the strip.',
  'modelDrawer.equationHeading': 'Equation (largest terms)',
  'modelDrawer.equationCaption':
    'Reference levels: {references}. Coefficients are group contrasts vs reference — read them as "how much this condition adds", not as causes.',
  'modelDrawer.coefficientsHeading': 'Coefficients',
  'modelDrawer.coefTerm': 'Term',
  'modelDrawer.coefCoef': 'Coef',
  'modelDrawer.coefSE': 'SE',
  'modelDrawer.coefT': 't',
  'modelDrawer.coefP': 'p',
  'modelDrawer.anovaHeading': 'ANOVA',
  'modelDrawer.anovaSource': 'Source',
  'modelDrawer.anovaDF': 'DF',
  'modelDrawer.anovaSS': 'SS',
  'modelDrawer.anovaF': 'F',
  'modelDrawer.anovaP': 'p',
  'modelDrawer.anovaError': 'Error',
  'modelDrawer.anovaTotal': 'Total',
  'modelDrawer.anovaCaption':
    'Type III (model-comparison) SS. η² on the strip = adjusted share per factor — see the strip subtitle.',
  'modelDrawer.ladderHeading': 'Best subsets (how the model was chosen)',
  'modelDrawer.ladderModel': 'Candidate model',
  'modelDrawer.ladderTerms': 'terms',
  'modelDrawer.ladderR2': 'R²',
  'modelDrawer.ladderR2adj': 'R²adj',
  'modelDrawer.ladderShown': '✓ shown',
  'modelDrawer.ladderNote':
    'Each candidate is its own least-squares fit; higher R²adj = the added terms pay their degrees-of-freedom rent. Interactions are screened only among surviving main effects (hierarchical, two-pass). The drawer shows the model behind the ranking you are looking at.',
  'modelDrawer.predictHeading': 'Check the equation — predict a condition',
  'modelDrawer.predictResult': '→ fitted {fitted} ± {s} · observed x̄ {observed} (n={n})',
  'modelDrawer.predictNoCell': '→ fitted {fitted} ± {s} · no observed rows for this condition',
  'modelDrawer.predictCaption':
    "Fitted mean ± S. Compare with the observed cell mean to feel the model's honesty.",
  'modelDrawer.constantInScope': 'constant in scope',
  'modelDrawer.captureModel': 'Capture model as Finding',
  'modelDrawer.warningRankDeficient':
    'Collinear or single-level factor — affected coefficients are shown as 0.',
  'modelDrawer.allData': 'All data',
  // Hypothesis test-plan triad (Factors & Evaluation Increment 2a)
  'wall.testplan.heading': 'How do I test this?',
  'wall.testplan.toolTwoSample': 'Boxplot + 2-sample',
  'wall.testplan.toolRegression': 'Scatter + regression',
  'wall.testplan.toolCapability': 'Capability (Cp/Cpk)',
  'wall.testplan.evaluate': 'Evaluate',
  'wall.testplan.evaluateAria': 'Evaluate whether {factor} accounts for the spread',
  'wall.testplan.addPlan': '+ Measurement Plan',
  'wall.testplan.addPlanAria': 'Plan how to collect {factor}',
  'wall.testplan.gapLabel': 'no data yet',
  'wall.testplan.resultSupports': '{factor} accounts for the spread (p {p})',
  'wall.testplan.resultInconclusive': '{factor} — inconclusive (p {p})',
  'wall.testplan.resultContradicts': '{factor} counts against this cause (p {p})',
  'wall.testplan.empty': 'No factors yet — capture a finding or set this cause’s condition.',
  // Per-hypothesis What-If (Factors & Evaluation Increment 2a, §5)
  'wall.whatif.heading': 'If you control this cause',
  'wall.whatif.projection': 'Projected Cpk {cpk}, covers {coverage}% of the data',
  'wall.whatif.noProjection': 'Set specs + a condition to project the gain.',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',
  // Brush-to-finding confirmation flow (RPS V1 PR4 Task 17)
  'wall.brush.confirmIChart': 'Pin indices {start}-{end} on {factor} as finding?',
  'wall.brush.confirmIChartNoFactor': 'Pin range as finding?',
  'wall.brush.confirmBoxplot': 'Pin category "{category}" on {factor} as finding?',
  'wall.brush.confirmBoxplotNoFactor': 'Pin category "{category}" as finding?',
  'wall.brush.pin': 'Pin',
  'wall.brush.cancel': 'Cancel',
  'wall.brush.dialogAriaLabel': 'Pin selection as finding',

  // FRAME b0 lightweight render
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.q2.bridge': 'These are the same candidate factors Explore will rank from the data.',
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.',
  'frame.b0.q1.emptyRanked':
    "Couldn't auto-rank an outcome. Type the numeric column name in the manual outcome field.",
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.',
  'frame.b0.aria.yCandidates': 'Y candidate chips',
  'frame.b0.aria.selectedXs': 'Selected X chips',
  'frame.b0.aria.availableXs': 'Available X chips',
  'frame.canvasOverlay.cta.control.notReady':
    "Available after you've implemented a process change to monitor",
  'frame.canvasOverlay.cta.handoff.notReady': 'Available after control monitoring confirms gains',
  'frame.b1.heading': 'Frame the analysis',
  'frame.b1.description':
    'Build your process map so the analysis has context. The map drives mode selection and a measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at least one rational-subgroup axis.',
  'frame.spec.notSet': 'spec: not set',
  'frame.spec.set': 'spec: set',
  'frame.spec.add': '+ add spec',
  'frame.spec.editor.title': 'Set spec for {measure}',
  'frame.spec.editor.usl': 'USL',
  'frame.spec.editor.lsl': 'LSL',
  'frame.spec.editor.target': 'Target',
  'frame.spec.editor.cpkTarget': 'Cpk target',
  'frame.spec.editor.suggestedFromData': 'Suggested from data: mean ± 3σ. Confirm to save.',
  'frame.spec.editor.confirm': 'Save',
  'frame.spec.editor.cancel': 'Cancel',
  'frame.spec.editor.invalidRange': 'USL must be greater than LSL.',
  'capability.noSpec.prompt': 'Set a target / spec on {measure} to see Cp/Cpk.',

  // Verify card segmented tabs
  'verify.tabs.label': 'Verify view',
  'verify.tab.probability': 'Probability',
  'verify.tab.distribution': 'Distribution',
  'verify.tab.capability': 'Capability',
  'verify.tab.pareto': 'Pareto',

  // ProcessHealthBar generic labels

  'healthBar.rows': 'rows',

  // Factor strip (ER-2 — "What explains the variation?")
  'factorStrip.title': 'What does explain it?',
  'factorStrip.title.scoped': 'What does explain it within this condition?',
  'factorStrip.subtitle':
    "how much of the row-to-row differences each factor accounts for (η²) — shares overlap, won't sum to 100%",
  'factorStrip.bridge': 'Same candidate factors as Frame; ranked here from the data.',
  'factorStrip.modelLink': 'How these % are computed (model & ANOVA) →',
  'factorStrip.modelLink.stub': 'coming with the model drawer',
  'factorStrip.star.title': 'largest share',
  'factorStrip.stepBadge.title': 'Process step: {step}',
  'factorStrip.binned': '(binned)',
  'factorStrip.examined': 'examined',
  'factorStrip.chip.hover': 'p={p} · df={dfB},{dfW} · joint n={n}',
  'factorStrip.residual': 'everyday variation · ~{n}% — not tied to these factors',
  'factorStrip.residual.hover':
    'Residual of the joint model — mostly routine row-to-row variation, plus factors not yet measured. A large residual is typical for service data.',
  'factorStrip.alsoScreened': '+{n} also screened',
  'factorStrip.whatif.label': 'what-if · everyone matched the best group',
  'factorStrip.whatif.matched': 'If all {factor} groups matched {bestLevel}:',
  'factorStrip.whatif.average': 'average {outcome}, all {n} rows: {current} → {projected}',
  'factorStrip.whatif.average.scoped': 'average {outcome}, this condition: {current} → {projected}',
  'factorStrip.whatif.cpk': 'Cpk {current} → {projected} (reference {target})',
  'factorStrip.whatif.bridge':
    'the gap is bigger per group — this is the overall average across {k} groups',
  // Boxplot card (factor dropdown absorbed by the strip)
  'boxplot.title.by': '{outcome} by {factor}',
  'boxplot.factor.hint': 'click a factor above to compare its groups here',

  // Time lens (ProcessHealthBar)
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',

  // Canvas — SystemLevelView
  'canvas.system.activeAnalyzes': 'Active analyses',
  'canvas.system.conformance': 'Conformance',
  'canvas.system.inbox': 'Inbox',
  'canvas.system.lensLabel': 'Lens: {lens}',
  'canvas.system.noNumericOutcome': 'No numeric outcome',
  'canvas.system.noOutcomePrompts': 'No outcome prompts',
  'canvas.system.noOutcomeTrend': 'No outcome trend',
  'canvas.system.openScout': 'Open SCOUT',
  'canvas.system.outcomeDistribution': 'Outcome distribution',
  'canvas.system.outcomeDrift': 'Outcome drift',
  'canvas.system.outOfSpecMessage': '{outcome} has {pct} readings outside spec.',
  'canvas.system.reviewAction': 'Review',

  // Canvas — CanvasLensPicker (toolbar aria + per-lens aria)
  'canvas.lensPicker.ariaLabel': 'Canvas lenses',
  'canvas.lensPicker.lensAriaLabel': '{label} lens',
  'canvas.lensPicker.invalidAtLevel':
    "{lens} isn't available at {currentLevel} \u2014 try {suggestedLevel}.",

  // Canvas — lens labels & descriptions (used by CanvasLensPicker)
  'canvas.lens.capability.description': 'Capability, Cpk trust, and step health.',
  'canvas.lens.capability.label': 'Capability',
  'canvas.lens.default.description': 'Step metrics, specs, and current card state.',
  'canvas.lens.default.label': 'Default',
  'canvas.lens.defect.description': 'Defect counts projected onto process steps.',
  'canvas.lens.defect.label': 'Defect',
  'canvas.lens.performance.description': 'Future within-step channel lens.',
  'canvas.lens.performance.label': 'Performance',
  'canvas.lens.processFlow.description': 'Plain process structure without per-card analytics.',
  'canvas.lens.processFlow.label': 'Process flow',

  // Canvas — NoFocalStepPrompt
  'canvas.noFocalStep.ariaLabel': 'Choose a process step',
  'canvas.noFocalStep.description': 'Local mechanism view needs a focal process step.',
  'canvas.noFocalStep.heading': 'Choose a step for L3',
  'canvas.noFocalStep.noStepsHint': 'Add a process step before opening the local mechanism view.',
  'canvas.noFocalStep.openStepAria': 'Open {stepName} local mechanism',

  // Canvas — MobileLevelPicker
  'canvas.mobile.ariaLabel': 'Canvas levels',
  'canvas.mobile.process': 'Process',
  'canvas.mobile.step': 'Step',
  'canvas.mobile.system': 'System',

  // Canvas — AuthorL3View
  'canvas.authorL3.assignedColumns': 'Assigned columns',
  'canvas.authorL3.ctqHeading': 'CTQ',
  'canvas.authorL3.dropHint': 'Drop columns here to assign them to this process step.',
  'canvas.authorL3.dropTargetAria': '{stepName} assignment target',
  'canvas.authorL3.dropTargetAriaWithChip':
    '{stepName} assignment target, press Enter to place {chipLabel}',
  'canvas.authorL3.noAssignedColumns': 'No assigned columns yet',
  'canvas.authorL3.noCtqContext': 'No unassigned CTQ context',
  'canvas.authorL3.noTributaryContext': 'No unassigned tributary context',
  'canvas.authorL3.selectedStep': 'Selected step',
  'canvas.authorL3.tributaryColumns': 'Tributary columns',
  'canvas.authorL3.unassignedColumns': 'Unassigned columns',

  // Canvas — LocalMechanismView
  'canvas.localMechanism.actionButton': 'Action',
  'canvas.localMechanism.etaSquaredLabel': 'eta² {value}',
  'canvas.localMechanism.factorContribution': 'Factor contribution evidence',
  'canvas.localMechanism.logActionAria': 'Log action for {column}',
  'canvas.localMechanism.noNumericValues': 'No numeric values',
  'canvas.localMechanism.openChartAria': 'Open {column} details mini chart',
  'canvas.localMechanism.openColumnAria': 'Open {column} details',
  'canvas.localMechanism.quickActionTitle': '{column} quick action',
  'canvas.localMechanism.control': 'Control',
  'canvas.localMechanism.handoff': 'Handoff',
  'canvas.localMechanism.controlAria': 'Open control for {column}',
  'canvas.localMechanism.handoffAria': 'Open handoff for {column}',
  // ── Condition pill (ER-4) ──
  'conditionPill.statDefault': 'x̄',
  'conditionPill.summaryWithMeans':
    '{gesture}{summary} · n={n} · {statLabel} {meanIn} vs {meanOut}',
  'conditionPill.summaryNoMeans': '{gesture}{summary} · n={n}',
  'conditionPill.capture': '✚ Capture finding',
  'conditionPill.apply': 'view as condition →',
  'conditionPill.ariaLabel': 'Condition: {summary}',
  // ── Scope bar (ER-4) ──
  'scopeBar.viewing': '⌖ Viewing condition:',
  'scopeBar.rows': '{nIn} of {nTotal} rows',
  'scopeBar.clear': '× back to all data',
  'scopeBar.analyze': 'Take it to Analyze →',
  'scopeBar.ariaLabel': 'Viewing condition: {label}',

  // ── Membership strip variant (ER-5a — "What distinguishes these rows?") ──
  'factorStrip.title.membership': 'What distinguishes these rows?',
  'factorStrip.membership.subtitle':
    'how strongly each factor distinguishes the rows in this condition from the rest (separation — not % of variation)',
  'factorStrip.membership.separation': 'separation',
  'factorStrip.membership.chip.hover': 'p={p} · χ² df={df} · n={n}',
  'factorStrip.membership.chip.topLevel': '{level} ×{lift}',
  'factorStrip.membership.chip.onlyInCondition': 'only in condition',

  // ── Defect-rate-share strip variant (ER-5b) ──
  'factorStrip.title.defectRate': 'What drives the defect rate?',
  'factorStrip.defectRate.subtitle':
    'how strongly each factor concentrates the defect rate across its levels (rate concentration — not % of variation)',
  'factorStrip.defectRate.chip.topLevel': '{level} {rate}%',
  'factorStrip.defectRate.chip.topLevelCount': '{level} {count}',
  'factorStrip.defectRate.chip.concentration': 'concentration {value}',
  'factorStrip.defectRate.star.title': 'largest share',

  // ── Strip v2: in-model ΔR² upgrade (ER-6) ──
  'factorStrip.inModel.subtitle':
    'how much each factor adds to the fitted model (in-model ΔR² — semipartial, factors overlap less once jointly fitted)',
  'factorStrip.inModel.residual': 'unexplained · ~{n}% — not in this model',
  'factorStrip.interaction.chip.ordinal':
    '⚡ {factorA} × {factorB} +{deltaR2Pct}% — {factorA} differences vary in magnitude across {factorB}',
  'factorStrip.interaction.chip.disordinal':
    '⚡ {factorA} × {factorB} +{deltaR2Pct}% — {factorA} relationship reverses across {factorB}',

  // ── Composition view (ER-5a) ──
  'compositionView.title': 'Composition by {factor}',
  'compositionView.toggle.lift': 'lift',
  'compositionView.toggle.count': 'count',
  'compositionView.shareIn': 'share in condition',
  'compositionView.shareOut': 'share outside',
  'compositionView.lift': '×{lift}',
  'compositionView.liftOnlyInCondition': 'only in condition',
  'compositionView.addAria': 'Add {level} to condition',
  'compositionView.empty': 'No composition data — condition may be degenerate.',
  'compositionView.countIn': 'in condition',
};
