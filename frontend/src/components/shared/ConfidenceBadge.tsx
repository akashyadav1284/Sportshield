/** SportShield AI — Confidence Badge component */
import { GradientBadge } from './GradientBadge';

interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  let variant: 'cyan' | 'purple' | 'red' | 'amber' | 'emerald' | 'zinc' = 'zinc';
  
  if (score >= 90) variant = 'red';
  else if (score >= 75) variant = 'amber';
  else if (score >= 60) variant = 'cyan';

  return (
    <GradientBadge variant={variant} className={className}>
      {score.toFixed(0)}%
    </GradientBadge>
  );
}
