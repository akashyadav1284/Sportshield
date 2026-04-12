/** SportShield AI — Reports & Export Page */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, BarChart3, Shield, TrendingUp, Clock, FileCheck, Printer, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import jsPDF from 'jspdf';

type ReportType = 'violation_summary' | 'platform_analysis' | 'asset_audit' | 'takedown_log' | 'executive_brief';

interface ReportTemplate {
  type: ReportType;
  name: string;
  description: string;
  icon: React.ElementType;
  frequency: string;
  lastGenerated: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  generatedAt: string;
  size: string;
  period: string;
}

const TEMPLATES: ReportTemplate[] = [
  { type: 'violation_summary', name: 'Violation Summary', description: 'Complete overview of all detected violations with severity breakdown and trends.', icon: Shield, frequency: 'Weekly', lastGenerated: '3 days ago' },
  { type: 'platform_analysis', name: 'Platform Analysis', description: 'Platform-by-platform breakdown of violations, response rates, and infringer profiles.', icon: BarChart3, frequency: 'Monthly', lastGenerated: '2 weeks ago' },
  { type: 'asset_audit', name: 'Asset Audit Report', description: 'Comprehensive audit of all protected assets, scan coverage, and vulnerability scores.', icon: FileCheck, frequency: 'Monthly', lastGenerated: '1 month ago' },
  { type: 'takedown_log', name: 'Takedown Activity Log', description: 'Detailed log of all takedown requests, statuses, and platform response times.', icon: FileText, frequency: 'Weekly', lastGenerated: '5 days ago' },
  { type: 'executive_brief', name: 'Executive Brief', description: 'High-level summary for stakeholders: ROI impact, threat landscape, and strategic recommendations.', icon: TrendingUp, frequency: 'Monthly', lastGenerated: '3 weeks ago' },
];

const RECENT_REPORTS: GeneratedReport[] = [
  { id: 'R-001', name: 'Weekly Violation Summary', type: 'violation_summary', generatedAt: '2026-04-07', size: '2.4 MB', period: 'Mar 31 - Apr 7' },
  { id: 'R-002', name: 'Q1 Platform Analysis', type: 'platform_analysis', generatedAt: '2026-04-01', size: '5.1 MB', period: 'Jan 1 - Mar 31' },
  { id: 'R-003', name: 'Weekly Violation Summary', type: 'violation_summary', generatedAt: '2026-03-31', size: '2.1 MB', period: 'Mar 24 - Mar 31' },
  { id: 'R-004', name: 'March Takedown Log', type: 'takedown_log', generatedAt: '2026-03-31', size: '1.8 MB', period: 'Mar 1 - Mar 31' },
  { id: 'R-005', name: 'Executive Brief - Q1 2026', type: 'executive_brief', generatedAt: '2026-03-31', size: '3.2 MB', period: 'Jan 1 - Mar 31' },
];

export default function Reports() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data } = await api.get('/reports');
      return data;
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (template: ReportTemplate) => {
      const { data } = await api.post('/reports', {
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        report_type: template.type,
        format: 'pdf',
        parameters: { period: 'Last 7 days' }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  const handleGenerate = (template: ReportTemplate) => {
    setGenerating(template.type);

    // Call the backend API to generate and store the report metadata natively
    generateReportMutation.mutate(template);

    // Generate a demo PDF for visual feedback immediately
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(6, 182, 212);
      doc.text('SportShield AI', 20, 25);
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(template.name, 20, 35);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`Report Type: ${template.type}`, 20, 52);
      doc.text(`Frequency: ${template.frequency}`, 20, 59);
      doc.line(20, 65, 190, 65);

      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text('Summary', 20, 75);
      doc.setFontSize(10);

      const summary = [
        'Total Violations Detected: 8',
        'High Severity: 3 | Medium: 3 | Low: 2',
        'Resolution Rate: 50%',
        'Most Targeted Asset: Champions League Final Highlights',
        'Primary Threat Platform: YouTube (37.5%)',
        '',
        'Top Findings:',
        '1. Violation volume increased 23% over previous period',
        '2. YouTube remains the dominant piracy vector',
        '3. Average takedown response time: 52 hours',
        '4. Estimated revenue impact: $2,400/month',
        '',
        'Recommendations:',
        '- Enable real-time scanning for top 5 assets',
        '- File batch Content ID claims on YouTube',
        '- Consider invisible watermarking for new releases',
      ];

      let y = 85;
      summary.forEach(line => { doc.text(line, 20, y); y += 7; });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This report was auto-generated by SportShield AI. Confidential.', 20, 280);

      doc.save(`sportshield-${template.type}-${new Date().toISOString().slice(0, 10)}.pdf`);
      setGenerating(null);
    }, 1500);
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Reports & Export</h1>
          <p className="text-zinc-400">Generate, download, and schedule automated reports.</p>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TEMPLATES.map((template, i) => (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <template.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {template.frequency} • Last: {template.lastGenerated}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-4 flex-1">{template.description}</p>
                <GlowingButton
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={() => handleGenerate(template)}
                >
                  {generating === template.type ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Generate Report
                    </>
                  )}
                </GlowingButton>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <GlassCard noPadding>
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Generated Reports</h3>
          <span className="text-xs text-zinc-500">{reports.length} reports</span>
        </div>
        <div className="divide-y divide-[#1F2937]">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <p>Loading Reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p>No recent reports found. Generate one to get started.</p>
            </div>
          ) : reports.map((report: any, i: number) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`px-6 py-4 flex items-center gap-4 transition-colors group ${report.status === 'processing' ? 'bg-cyan-900/10' : 'hover:bg-[#1F2937]/30'}`}
            >
              <div className={`p-2 rounded-lg border ${report.status === 'processing' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-[#0B0F19] border-[#1F2937]'}`}>
                {report.status === 'processing' ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{report.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{report.report_type.replace('_', ' ')}</span>
                  {report.status === 'processing' && (
                    <span className="text-[10px] font-medium text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">Processing</span>
                  )}
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-zinc-400">{new Date(report.created_at).toLocaleDateString()}</p>
                <p className="text-[10px] text-zinc-500">{report.format.toUpperCase()}</p>
              </div>
              <button 
                className={`p-2 rounded-lg transition-all ${
                  report.status === 'processing' 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border-transparent' 
                  : 'bg-[#0B0F19] border-[#1F2937] text-zinc-400 hover:text-white hover:border-cyan-500/30 opacity-0 group-hover:opacity-100'
                } border`}
                disabled={report.status === 'processing'}
              >
                <Download className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </PageTransition>
  );
}
