import React from 'react';
import { makeStyles, tokens, Tooltip, Link, mergeClasses } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import { getTerm, type GlossaryTerm } from '@variscout/core';

const useStyles = makeStyles({
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'help',
  },
  icon: {
    color: tokens.colorNeutralForeground3,
    ':hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxWidth: '260px',
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  definition: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
  link: {
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export interface HelpTooltipProps {
  /** The term ID to look up in the glossary */
  termId?: string;
  /** Direct term object (takes precedence over termId lookup) */
  term?: GlossaryTerm;
  /** Base URL for the website (e.g., 'https://variscout.com') */
  websiteUrl?: string;
  /** Additional CSS class name */
  className?: string;
  /** Custom content to wrap (if not provided, shows info icon) */
  children?: React.ReactNode;
  /** Whether to show the "Learn more" link */
  showLearnMore?: boolean;
}

/**
 * HelpTooltip - Fluent UI variant for Excel Add-in
 *
 * Uses Fluent UI Tooltip component with darkTheme-compatible styling.
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  termId,
  term: termProp,
  websiteUrl = 'https://variscout.com',
  className,
  children,
  showLearnMore = true,
}) => {
  const styles = useStyles();

  // Look up term if only termId provided
  const term = termProp || (termId ? getTerm(termId) : undefined);

  // No term data - render nothing or just children
  if (!term) {
    return children ? <>{children}</> : null;
  }

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      <span className={styles.label}>{term.label}</span>
      <span className={styles.definition}>{term.definition}</span>
      {showLearnMore && term.learnMorePath && (
        <Link href={`${websiteUrl}${term.learnMorePath}`} target="_blank" className={styles.link}>
          Learn more →
        </Link>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} relationship="description" positioning="above" withArrow>
      <span className={mergeClasses(styles.wrapper, className)}>
        {children || <Info16Regular className={styles.icon} />}
      </span>
    </Tooltip>
  );
};

export default HelpTooltip;
