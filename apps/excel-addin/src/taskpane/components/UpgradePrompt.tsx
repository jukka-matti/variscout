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
import { Sparkle24Regular, Key24Regular } from '@fluentui/react-icons';

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
    color: tokens.colorBrandForeground1,
  },
  freeNote: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
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
              <Sparkle24Regular />
              Upgrade to Licensed Edition
            </div>
          </DialogTitle>
          <DialogContent className={styles.content}>
            <div className={styles.freeNote}>
              <Body2>
                You're using the <strong>free Community Edition</strong>. All charts and analysis
                features work fully - just with VariScout branding.
              </Body2>
            </div>

            <Body1>To {feature}, upgrade to the Licensed Edition:</Body1>

            <ul className={styles.featureList}>
              <li>Save configuration to workbook (persists across sessions)</li>
              <li>Remove VariScout branding from charts</li>
              <li>Priority support</li>
            </ul>

            <div className={styles.priceRow}>
              <span className={styles.price}>€99</span>
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
              Continue with Community Edition
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
