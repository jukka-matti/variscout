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
  'display.chartTextSize': 'Chart text size',
  'display.compact': 'Compact',
  'display.normal': 'Normal',
  'display.large': 'Large',
  'display.lockYAxis': 'Lock Y-axis',
  'display.filterContext': 'Filter context',
  'display.showSpecs': 'Show specifications',

  // Investigation
  'investigation.brief': 'Investigation Brief',
  'investigation.assignedToMe': 'Assigned to me',
  'investigation.hypothesis': 'Hypothesis',
  'investigation.hypotheses': 'Hypotheses',
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
  'ai.tool.suggestIdea': 'Suggest improvement idea',

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

  // Coaching text (scenario \u00d7 phase)
  'coach.problem.frame': 'Set up your data to start investigating the problem.',
  'coach.problem.scout': 'Look for variation patterns that could explain the problem.',
  'coach.problem.investigate': 'Build evidence linking factors to the problem.',
  'coach.problem.improve':
    'Brainstorm ideas using the Four Directions (Prevent, Detect, Simplify, Eliminate), then plan and execute via PDCA.',
  'coach.hypothesis.frame': 'Set up your data to test your hypothesis.',
  'coach.hypothesis.scout': 'Look for evidence that supports or refutes your hypothesis.',
  'coach.hypothesis.investigate': 'Gather statistical evidence to confirm the suspected cause.',
  'coach.hypothesis.improve':
    'Confirmed cause \u2014 brainstorm ideas (Prevent, Detect, Simplify, Eliminate), assess feasibility, then execute via PDCA.',
  'coach.routine.frame': 'Set up your data for a routine process check.',
  'coach.routine.scout': 'Scan for new signals, drift, or unexpected patterns.',
  'coach.routine.investigate': 'A signal was found \u2014 drill into potential causes.',
  'coach.routine.improve':
    'Signal confirmed \u2014 brainstorm preventive actions and sustaining controls via PDCA.',

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
  'feature.maxRows': 'Up to 100K rows',
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
  'improve.selectedCount': '{count} selected',
  'improve.effortBreakdown': '{low} low \u00b7 {medium} med \u00b7 {high} high',
  'improve.projectedCpk': 'Projected Cpk: {value}',
  'improve.targetDelta': '\u0394 {delta} to target',
  'improve.convertedToAction': '\u2192 Action',

  // Effort labels
  'effort.low': 'Low',
  'effort.medium': 'Medium',
  'effort.high': 'High',
  'effort.label': 'Effort',

  // Idea direction labels (Four Ideation Directions)
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',

  // Projected vs actual
  'outcome.projectedVsActual': 'Projected {projected} \u2192 Actual {actual}',
  'outcome.delta': '({sign}{delta})',

  // Improvement convergence
  'improve.convergenceNudge':
    'Your evidence is converging \u2014 summarize what you\u2019ve learned in the Improvement Plan.',
};
