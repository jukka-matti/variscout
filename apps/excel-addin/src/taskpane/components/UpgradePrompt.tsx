import React from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Body1,
  Body2,
  Link,
} from '@fluentui/react-components';
import { LockClosed24Regular, Key24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    color: tokens.colorPaletteYellowForeground2,
  },
  featureList: {
    paddingLeft: tokens.spacingHorizontalL,
    margin: 0,
    color: tokens.colorNeutralForeground2,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  price: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  priceNote: {
    color: tokens.colorNeutralForeground2,
  },
});

export interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  onContinueWithoutSaving: () => void;
  feature?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  open,
  onClose,
  onContinueWithoutSaving,
  feature = 'save your configuration',
}) => {
  const styles = useStyles();

  const handleBuyLicense = () => {
    window.open('https://variscout.com/buy', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <div className={styles.iconRow}>
              <LockClosed24Regular />
              Upgrade to VaRiScout Pro
            </div>
          </DialogTitle>
          <DialogContent className={styles.content}>
            <Body1>To {feature}, you need a VaRiScout Pro license.</Body1>

            <Body2>With Pro, you get:</Body2>
            <ul className={styles.featureList}>
              <li>Save configuration to workbook (persists across sessions)</li>
              <li>No branding on exported charts</li>
              <li>Priority support</li>
            </ul>

            <div className={styles.priceRow}>
              <span className={styles.price}>€49</span>
              <span className={styles.priceNote}>/ year</span>
            </div>

            <Body2 style={{ color: tokens.colorNeutralForeground3 }}>
              Already have a license?{' '}
              <Link href="#" onClick={onClose}>
                Enter it in Settings
              </Link>
            </Body2>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onContinueWithoutSaving}>
              Continue without saving
            </Button>
            <Button appearance="primary" icon={<Key24Regular />} onClick={handleBuyLicense}>
              Buy License
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
