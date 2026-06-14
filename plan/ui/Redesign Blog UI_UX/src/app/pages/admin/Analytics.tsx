import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Download } from "lucide-react";

export function Analytics() {
  const data = [
    { date: "Jan 1", views: 2400 },
    { date: "Jan 3", views: 1398 },
    { date: "Jan 5", views: 4800 },
    { date: "Jan 7", views: 3908 },
    { date: "Jan 9", views: 4800 },
    { date: "Jan 11", views: 3800 },
    { date: "Jan 13", views: 5300 },
    { date: "Jan 15", views: 6800 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border-default shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-[6px] p-3">
          <p className="text-[12px] text-text-secondary mb-1">{label}</p>
          <p className="text-[14px] font-bold text-text-primary">
            {payload[0].value.toLocaleString()} <span className="font-normal text-text-tertiary">views</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-text-primary">Analytics</h1>
          <p className="text-[14px] text-text-secondary mt-1">Detailed traffic and engagement data</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-[34px] px-3 border border-border-default rounded-[5px] text-[13px] font-medium text-text-secondary hover:bg-subtle-bg transition-colors flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Last 30 Days
          </button>
          <button className="h-[34px] px-3 border border-border-default rounded-[5px] text-[13px] font-medium text-text-secondary hover:bg-subtle-bg transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-background border border-border-default rounded-[8px] p-5 md:p-6 mb-8">
        <div className="flex items-end gap-3 mb-6">
          <div className="text-[32px] font-bold text-text-primary leading-none">18,420</div>
          <div className="text-[13px] text-text-secondary mb-1">Total page views</div>
          <div className="text-[13px] text-[#15803d] dark:text-[#4ade80] font-medium mb-1 ml-auto">
            ↑ 14% vs previous period
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="var(--accent)" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--accent)' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Data Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Top Referrers */}
        <div className="bg-background border border-border-default rounded-[8px] overflow-hidden">
          <div className="p-4 border-b border-border-default bg-subtle-bg/50">
            <h3 className="text-[13px] font-semibold text-text-primary">Top Referrers</h3>
          </div>
          <div className="flex flex-col">
            {[
              { source: "Direct / None", views: "6,240", percent: "34%" },
              { source: "Google", views: "4,821", percent: "26%" },
              { source: "Twitter / X", views: "3,150", percent: "17%" },
              { source: "Reddit", views: "2,400", percent: "13%" },
              { source: "MyAnimeList", views: "1,809", percent: "10%" },
            ].map((ref, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-border-default last:border-0">
                <span className="text-[13px] font-medium text-text-primary">{ref.source}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-text-secondary">{ref.views}</span>
                  <span className="text-[12px] text-text-tertiary w-8 text-right">{ref.percent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-background border border-border-default rounded-[8px] overflow-hidden">
          <div className="p-4 border-b border-border-default bg-subtle-bg/50">
            <h3 className="text-[13px] font-semibold text-text-primary">Device Breakdown</h3>
          </div>
          <div className="flex flex-col p-5 gap-5">
            {[
              { label: "Desktop", percent: 58, value: "10,683" },
              { label: "Mobile", percent: 38, value: "6,999" },
              { label: "Tablet", percent: 4, value: "738" },
            ].map((device, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-text-primary">{device.label}</span>
                  <span className="text-[13px] text-text-secondary">{device.value} <span className="text-[11px] text-text-tertiary ml-1">({device.percent}%)</span></span>
                </div>
                <div className="w-full h-2 bg-subtle-bg rounded-full overflow-hidden border border-border-default">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${device.percent}%`,
                      backgroundColor: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--text-secondary)' : 'var(--text-tertiary)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}