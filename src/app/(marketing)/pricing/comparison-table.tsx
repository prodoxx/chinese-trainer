'use client';

import { CheckCircle, X, Lock, Info } from 'lucide-react';
import { useState } from 'react';

interface FeatureRow {
  feature: string;
  isSection?: boolean;
  indent?: boolean;
  lite: boolean | string | 'locked';
  studentPro: boolean | string;
  pro: boolean | string;
  lifetime: boolean | string;
  team: boolean | string;
}

export default function ComparisonTable() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const renderCell = (value: boolean | string | 'locked', feature: string, plan: string) => {
    if (value === 'locked') {
      return (
        <div 
          className="group relative cursor-pointer inline-block"
          onMouseEnter={() => setHoveredFeature(`${feature}-${plan}`)}
          onMouseLeave={() => setHoveredFeature(null)}
        >
          <Lock className="w-5 h-5 text-red-400 mx-auto" />
          {hoveredFeature === `${feature}-${plan}` && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10">
              Upgrade to unlock this feature
            </div>
          )}
        </div>
      );
    }
    if (typeof value === 'string') {
      return <span className="text-white font-semibold">{value}</span>;
    }
    if (value === true) {
      return <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />;
    }
    return <X className="w-5 h-5 text-[#7d8590] mx-auto" />;
  };

  const features: FeatureRow[] = [
    // Core Learning
    { feature: 'Core Learning', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Review existing cards', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Add new characters', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Characters Limit', indent: true, lite: 'Existing only', studentPro: 'Unlimited', pro: 'Unlimited', lifetime: 'Unlimited', team: 'Unlimited' },
    { feature: 'Dual-Phase Flash Sessions', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Smart Mini-Quizzes', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'SM-2 Spaced Repetition', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Daily Reminders', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Cross-Device Sync', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Interactive Demo', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    
    // AI Features
    { feature: 'AI Enrichment', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Pre-enriched Database', indent: true, lite: '3,000+ chars', studentPro: '3,000+ chars', pro: '3,000+ chars', lifetime: '3,000+ chars', team: '3,000+ chars' },
    { feature: 'Dictionary Lookup (CC-CEDICT)', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'AI-Generated Images', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Taiwan Mandarin Audio (TTS)', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Basic Mnemonics', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Monthly AI Credits (for new chars)', indent: true, lite: '0', studentPro: '100/month', pro: '100/month', lifetime: '200/month', team: '100/user' },
    
    // Character Insights
    { feature: 'Character Insights', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Complexity Analysis', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'AI Etymology & Evolution', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'AI Memory Aids', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Confusion Pattern Analysis', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Personalized Learning Tips', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    
    // Analytics
    { feature: 'Analytics & Progress', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Basic Statistics', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Learning Curve Tracking', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Session Performance Metrics', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Cognitive Load Analysis', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Heat Map Calendar', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Progress Export (PDF)', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    
    // Deck Management
    { feature: 'Deck Management', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'CSV Deck Import', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Multiple Decks', indent: true, lite: 'Existing only', studentPro: 'Unlimited', pro: 'Unlimited', lifetime: 'Unlimited', team: 'Unlimited' },
    { feature: 'Deck Sharing (Coming Soon)', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    
    // Study Modes
    { feature: 'Study Modes', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'New Card Mode (8-card sessions)', indent: true, lite: 'locked', studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Review Mode (SM-2 scheduled)', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Practice Mode (unlimited)', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    
    // Lifetime-Only Perks
    { feature: 'Lifetime-Only Perks', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Exclusive study decks', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'Quarterly content drops', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'Double AI enrichment credits', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'Early access to all features', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'Annual mastery challenge', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'VIP profile badge', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'Lifetime-only community forum', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    
    // Accessibility
    { feature: 'Accessibility', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Dark Theme', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Reduce Motion Option', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Brightness Control', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Mobile Responsive', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    
    // Support
    { feature: 'Support', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Community Support', indent: true, lite: true, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'Priority Email Support', indent: true, lite: false, studentPro: true, pro: true, lifetime: true, team: true },
    { feature: 'VIP Support', indent: true, lite: false, studentPro: false, pro: false, lifetime: true, team: false },
    { feature: 'Dedicated Support Manager', indent: true, lite: false, studentPro: false, pro: false, lifetime: false, team: true },
    
    // Team Features
    { feature: 'Team Features', isSection: true, lite: '', studentPro: '', pro: '', lifetime: '', team: '' },
    { feature: 'Admin Dashboard', indent: true, lite: false, studentPro: false, pro: false, lifetime: false, team: true },
    { feature: 'Student Progress Tracking', indent: true, lite: false, studentPro: false, pro: false, lifetime: false, team: true },
    { feature: 'Shared Team Decks', indent: true, lite: false, studentPro: false, pro: false, lifetime: false, team: true },
    { feature: 'API Access', indent: true, lite: false, studentPro: false, pro: false, lifetime: false, team: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#30363d]">
            <th className="text-left py-4 px-4 text-white font-semibold">Features</th>
            <th className="text-center py-4 px-4 text-white font-semibold">
              Lite<br/>
              <span className="text-xs font-normal text-[#7d8590]">(Post-trial)</span>
            </th>
            <th className="text-center py-4 px-4 text-white font-semibold">
              Student Pro
              <div className="flex items-center justify-center gap-1 mt-1">
                <Info className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-normal text-blue-400">.edu verified</span>
              </div>
            </th>
            <th className="text-center py-4 px-4 text-white font-semibold bg-[#f7cc48]/10">
              Pro
              <div className="text-xs font-normal text-green-400 mt-1">Most Popular</div>
            </th>
            <th className="text-center py-4 px-4 text-white font-semibold">
              Lifetime
              <div className="text-xs font-normal text-purple-400 mt-1">Best Value</div>
            </th>
            <th className="text-center py-4 px-4 text-white font-semibold">Team</th>
          </tr>
        </thead>
        <tbody>
          {/* Pricing Row */}
          <tr className="border-b border-[#30363d]/50">
            <td className="py-4 px-4 text-[#7d8590]">Price</td>
            <td className="text-center py-4 px-4 text-white">Free</td>
            <td className="text-center py-4 px-4 text-white">
              $9/mo
              <div className="text-xs text-[#7d8590]">$99/year</div>
            </td>
            <td className="text-center py-4 px-4 text-white bg-[#f7cc48]/10 font-semibold">
              $14/mo
              <div className="text-xs text-green-400">Save 20% annual</div>
            </td>
            <td className="text-center py-4 px-4 text-white">
              $499 once
              <div className="text-xs text-green-400">Pays for itself</div>
            </td>
            <td className="text-center py-4 px-4 text-white">
              From $9/user
              <div className="text-xs text-[#7d8590]">Volume discounts</div>
            </td>
          </tr>
          
          {/* Feature Rows */}
          {features.map((row, index) => (
            <tr key={index} className={`border-b border-[#30363d]/50 ${row.isSection ? 'bg-[#161b22]/50' : ''}`}>
              <td className={`py-4 px-4 ${row.isSection ? 'text-[#7d8590] font-semibold' : 'text-[#7d8590]'} ${row.indent ? 'pl-8' : ''}`}>
                {row.feature}
              </td>
              {!row.isSection && (
                <>
                  <td className="text-center py-4 px-4">{renderCell(row.lite, row.feature, 'lite')}</td>
                  <td className="text-center py-4 px-4">{renderCell(row.studentPro, row.feature, 'student')}</td>
                  <td className="text-center py-4 px-4 bg-[#f7cc48]/10">{renderCell(row.pro, row.feature, 'pro')}</td>
                  <td className="text-center py-4 px-4">{renderCell(row.lifetime, row.feature, 'lifetime')}</td>
                  <td className="text-center py-4 px-4">{renderCell(row.team, row.feature, 'team')}</td>
                </>
              )}
              {row.isSection && (
                <>
                  <td className="text-center py-4 px-4"></td>
                  <td className="text-center py-4 px-4"></td>
                  <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                  <td className="text-center py-4 px-4"></td>
                  <td className="text-center py-4 px-4"></td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}