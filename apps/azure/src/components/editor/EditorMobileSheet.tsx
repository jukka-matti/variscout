import React from 'react';
import {
  FileText,
  Beaker,
  Maximize2,
  Plus,
  Pencil,
  Download,
  Table2,
  ClipboardList,
} from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

interface EditorMobileSheetProps {
  onAction: (action: string) => void;
  onClose: () => void;
}

export const EditorMobileSheet: React.FC<EditorMobileSheetProps> = ({ onAction, onClose }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Bottom sheet */}
      <div className="fixed bottom-[50px] left-0 right-0 bg-surface-primary border-t border-edge rounded-t-2xl z-50 animate-slide-up safe-area-bottom max-h-[60vh] overflow-y-auto">
        <div className="py-2">
          <button
            onClick={() => onAction('report')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <FileText size={18} />
            {t('report.scouting') || 'Scouting Report'}
          </button>
          <button
            onClick={() => onAction('whatif')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <Beaker size={18} />
            {t('panel.whatIf') || 'What-If'}
          </button>
          <button
            onClick={() => onAction('survey')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <ClipboardList size={18} />
            Survey
          </button>
          <button
            onClick={() => onAction('presentation')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <Maximize2 size={18} />
            {t('nav.presentationMode') || 'Presentation'}
          </button>
          <div className="border-t border-edge my-1" />
          <button
            onClick={() => onAction('addpaste')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <Plus size={18} />
            {t('toolbar.addMore') || 'Add More Data'}
          </button>
          <button
            onClick={() => onAction('editdata')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <Pencil size={18} />
            {t('data.editData') || 'Edit Data'}
          </button>
          <button
            onClick={() => onAction('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <Download size={18} />
            {t('export.asCsv') || 'Export CSV'}
          </button>
          <button
            onClick={() => onAction('datatable')}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
          >
            <Table2 size={18} />
            {t('panel.dataTable') || 'Data Table'}
          </button>
        </div>
      </div>
    </>
  );
};
