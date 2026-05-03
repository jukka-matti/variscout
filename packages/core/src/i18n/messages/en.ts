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
  'panel.investigation': 'Investigation',
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

  // Investigation
  'investigation.brief': 'Investigation Brief',
  'investigation.assignedToMe': 'Assigned to me',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
  'investigation.pinAsFinding': 'Pin as finding',
  'investigation.addObservation': 'Add observation',

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
  'data.addQuestion': 'Add question',
  'data.removeQuestion': 'Remove question',
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
  'investigation.phaseDiverging': 'Explore multiple questions',
  'investigation.phaseValidating': 'Test and validate questions',
  'investigation.phaseConverging': 'Narrow to contribution',
  'investigation.phaseImproving': 'Implement and verify changes',
  'investigation.pdcaTitle': 'Verification Checklist',
  'investigation.verifyChart': 'I-Chart stable after change',
  'investigation.verifyStats': 'Cpk meets target',
  'investigation.verifyBoxplot': 'Boxplot spread reduced',
  'investigation.verifySideEffects': 'No side effects observed',
  'investigation.verifyOutcome': 'Outcome sustained over time',
  'investigation.uninvestigated': 'Uninvestigated Factors',

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
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
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

  // Investigation prompt
  'investigation.trackingPrompt':
    'Tracking your investigation \u2014 open the Investigation panel to see the full picture.',

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
  'admin.plan': 'Plan & Features',
  'admin.teams': 'Teams Setup',
  'admin.knowledge': 'Knowledge Base',
  'admin.troubleshooting': 'Troubleshooting',

  // Admin plan tab
  'admin.currentPlan': 'Current',
  'admin.feature': 'Feature',
  'admin.manageSubscription': 'Manage Subscription in Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '\u20ac79/mo',
  'admin.planTeamPrice': '\u20ac199/mo',
  'admin.planStandardDesc': 'Full analysis with CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, Knowledge Base',

  // Feature names (plan matrix)
  'feature.charts': 'I-Chart, Boxplot, Pareto, Stats',
  'feature.capability': 'Capability analysis (Cp/Cpk)',
  'feature.performance': 'Performance Mode (multi-channel)',
  'feature.anova': 'ANOVA & factor analysis',
  'feature.findingsWorkflow': 'Findings & investigation workflow',
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
  'workspace.analysis': 'Analysis',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',

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
    'Answer your questions in the investigation. Answered questions unlock improvement brainstorming.',
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

  // Yamazumi (Time Study)
  'yamazumi.detected.title': 'Time Study Data Detected',
  'yamazumi.detected.confidence': 'confidence',
  'yamazumi.detected.description':
    'Your data contains activity type classifications and cycle times suitable for Yamazumi analysis.',
  'yamazumi.detected.activityType': 'Activity Type',
  'yamazumi.detected.cycleTime': 'Cycle Time',
  'yamazumi.detected.step': 'Process Step',
  'yamazumi.detected.reason': 'Waste Reason',
  'yamazumi.detected.taktTime': 'Takt Time (optional)',
  'yamazumi.detected.taktPlaceholder': 'e.g., 120 seconds',
  'yamazumi.detected.decline': 'Use Standard Mode',
  'yamazumi.detected.enable': 'Enable Yamazumi Mode',

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

  'yamazumi.metric.total': 'Total',
  'yamazumi.metric.va': 'VA',
  'yamazumi.metric.nva': 'NVA',
  'yamazumi.metric.waste': 'Waste',
  'yamazumi.metric.wait': 'Wait',
  'yamazumi.pareto.steps-total': 'Steps by Total Time',
  'yamazumi.pareto.steps-waste': 'Steps by Waste Time',
  'yamazumi.pareto.steps-nva': 'Steps by NVA Time',
  'yamazumi.pareto.activities': 'Activities by Time',
  'yamazumi.pareto.reasons': 'Waste Reasons',
  'yamazumi.summary.vaRatio': 'VA Ratio',
  'yamazumi.summary.efficiency': 'Process Efficiency',
  'yamazumi.summary.leadTime': 'Total Lead Time',
  'yamazumi.summary.takt': 'Takt Time',
  'yamazumi.summary.setTakt': 'Set',
  'yamazumi.summary.overTakt': 'steps over takt',
  'yamazumi.takt': 'Takt',
  'yamazumi.mode.label': 'Yamazumi',
  'yamazumi.mode.switch': 'Switch to Yamazumi',

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
  'report.questionTree': 'Question Tree',
  'report.question.answered': 'Answered',
  'report.question.investigating': 'Investigating',
  'report.question.ruledOut': 'Ruled Out',
  'report.question.open': 'Open',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.investigationReport': 'Investigation Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.action.shareReport': 'Share Report',
  'report.action.publishToSharePoint': 'Publish to SharePoint',
  'report.action.publishedToSharePoint': 'Published to SharePoint',
  'report.publish.rendering': 'Rendering report\u2026',
  'report.publish.uploading': 'Uploading\u2026',
  'report.publish.exists': 'Report already exists in SharePoint.',
  'report.publish.replace': 'Replace',
  'report.publish.failed': 'Publish failed',
  'report.publish.tryAgain': 'Try again',
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

  // Upgrade (additional)
  'upgrade.freeTierLimitation': 'Free tier limitation',
  'upgrade.fromPrice': 'From €79/month',

  // Investigation Wall
  'wall.status.proposed': 'Proposed',
  'wall.status.evidenced': 'Evidenced',
  'wall.status.confirmed': 'Confirmed',
  'wall.status.refuted': 'Refuted',
  'wall.card.hypothesisLabel': 'Mechanism Branch',
  'wall.card.findings': '{count} findings',
  'wall.card.questions': '{count} questions',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Mechanism Branch {name}, {status}, {count} supporting clues',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events/wk',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.question.ariaLabel': 'Question: {text}, {status}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Mechanism Branch empty state',
  'wall.empty.title': 'Start a Mechanism Branch',
  'wall.empty.subtitle': 'Start from a suspected mechanism, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Write a suspected mechanism',
  'wall.empty.promoteFromQuestion': 'Promote from a question',
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': 'Missing evidence · the detective move nobody ships ({count})',
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.canvas.ariaLabel': 'Mechanism Branch workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected mechanism from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.question': 'QUESTION',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',

  // FRAME b0 lightweight render
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.',
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.',
  'frame.b0.aria.yCandidates': 'Y candidate chips',
  'frame.b0.aria.selectedXs': 'Selected X chips',
  'frame.b0.aria.availableXs': 'Available X chips',
  'frame.b1.heading': 'Frame the investigation',
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

  // Time lens (ProcessHealthBar)
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',
};
