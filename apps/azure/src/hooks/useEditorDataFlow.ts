/**
 * Re-export from new location for backward compatibility.
 * @see ../features/data-flow/useEditorDataFlow.ts
 */
export {
  useEditorDataFlow,
  editorFlowReducer,
  initialFlowState,
} from '../features/data-flow/useEditorDataFlow';
export type {
  EditorFlowState,
  EditorFlowAction,
  UseEditorDataFlowOptions,
  UseEditorDataFlowReturn,
  MatchSummaryPending,
} from '../features/data-flow/useEditorDataFlow';
