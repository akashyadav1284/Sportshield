/** SportShield AI — Severity Tag component */
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { GradientBadge } from './GradientBadge';

interface SeverityTagProps {
  severity: 'high' | 'medium' | 'low';
  className?: string;
  showIcon?: boolean;
}

export function SeverityTag({ severity, className, showIcon = true }: SeverityTagProps) {
  const config = {
    high: {
      label: 'HIGH',
      variant: 'red' as const,
      icon: AlertTriangle,
    },
    medium: {
      label: 'MEDIUM',
      variant: 'amber' as const,
      icon: AlertCircle,
    },
    low: {
      label: 'LOW',
      variant: 'cyan' as const,
      icon: Info,
    },
  };

  const { label, variant, icon: Icon } = config[severity];

  return (
    <GradientBadge variant={variant} className={className} dot={true}>
      {label}
    </GradientBadge>
  );
}
