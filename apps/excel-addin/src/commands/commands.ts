/**
 * Ribbon command handlers for Excel Add-in
 */

import { getSelectedRangeData } from '../lib/excelData';
import { calculateStats } from '@variscout/core';

// Register the analyze function with Office
Office.onReady(() => {
  // Commands are registered via the manifest
});

/**
 * Analyze the currently selected range
 * This is called from the ribbon button
 */
async function analyzeSelection(event: Office.AddinCommands.Event) {
  try {
    const data = await getSelectedRangeData();

    if (!data || data.values.length === 0) {
      showNotification('No Data', 'Please select a range with numeric data.');
      event.completed();
      return;
    }

    const stats = calculateStats(data.values);

    // Show results in a notification
    const message = [
      `n = ${data.values.length}`,
      `Mean: ${stats.mean.toFixed(2)}`,
      `Std Dev: ${stats.stdDev.toFixed(2)}`,
      `UCL: ${stats.ucl.toFixed(2)}`,
      `LCL: ${stats.lcl.toFixed(2)}`,
    ].join('\n');

    showNotification('Analysis Results', message);
  } catch (error) {
    console.error('Analysis error:', error);
    showNotification('Error', 'Failed to analyze selection.');
  }

  event.completed();
}

/**
 * Show a notification message
 */
function showNotification(title: string, message: string) {
  // Log to console - in production, this could open a dialog or task pane
  console.log(`${title}: ${message}`);
}

// Register commands globally for Office.js
(globalThis as any).analyzeSelection = analyzeSelection;
