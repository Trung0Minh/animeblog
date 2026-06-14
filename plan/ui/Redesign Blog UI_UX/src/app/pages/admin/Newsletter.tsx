import { useState } from "react";
import { Users, MailOpen, MousePointerClick, Plus, Search, MoreHorizontal, ArrowUpRight } from "lucide-react";

export function Newsletter() {
  const broadcasts = [
    { subject: "The Evolution of Shonen Sound Design", date: "Jan 14, 2025", recipients: "1,247", opens: "68%", clicks: "14%", status: "Sent" },
    { subject: "New Essay: Vinland Saga's Philosophy", date: "Jan 8, 2025", recipients: "1,220", opens: "71%", clicks: "18%", status: "Sent" },
    { subject: "End of Year Review: 2024 in Animation", date: "Dec 30, 2024", recipients: "1,185", opens: "65%", clicks: "12%", status: "Sent" },
    { subject: "Satoshi Kon Retrospective", date: "Dec 22, 2024", recipients: "1,150", opens: "74%", clicks: "22%", status: "Sent" },
    { subject: "Winter 2024 Preview", date: "Dec 15, 2024", recipients: "1,120", opens: "62%", clicks: "9%", status: "Sent" },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-text-primary">Newsletter</h1>
          <p className="text-[14px] text-text-secondary mt-1">Manage subscribers and email broadcasts</p>
        </div>
        <button className="shrink-0 h-[34px] px-3.5 bg-button-bg text-button-text rounded-[5px] text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 w-full md:w-auto">
          <Plus className="w-3.5 h-3.5" />
          New Email
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-background border border-border-default rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-[0.06em]">TOTAL SUBSCRIBERS</span>
            <Users className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
          <div className="text-[28px] font-bold text-text-primary">1,247</div>
          <div className="text-[11px] mt-1 text-[#15803d] dark:text-[#4ade80]">↑ 8% vs last month</div>
        </div>
        <div className="bg-background border border-border-default rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-[0.06em]">AVG OPEN RATE</span>
            <MailOpen className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
          <div className="text-[28px] font-bold text-text-primary">68.4%</div>
          <div className="text-[11px] mt-1 text-[#15803d] dark:text-[#4ade80]">↑ 2.1% vs last month</div>
        </div>
        <div className="bg-background border border-border-default rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-[0.06em]">AVG CLICK RATE</span>
            <MousePointerClick className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
          <div className="text-[28px] font-bold text-text-primary">14.2%</div>
          <div className="text-[11px] mt-1 text-text-tertiary">— No change</div>
        </div>
      </div>

      {/* Broadcasts List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-text-primary">Recent Broadcasts</h2>
          <div className="relative w-[180px] hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              className="w-full h-[30px] pl-8 pr-2.5 border border-border-default rounded-[5px] text-[12px] bg-transparent outline-none focus:border-accent placeholder:text-text-tertiary transition-colors"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto border border-border-default rounded-[8px] bg-background">
          <div className="min-w-[700px]">
            {/* Table Header */}
            <div className="h-[40px] flex items-center bg-subtle-bg border-b border-border-default px-4 text-[11px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
              <div className="flex-1 min-w-0 pr-4">Subject</div>
              <div className="w-[120px] shrink-0">Date</div>
              <div className="w-[100px] shrink-0 text-right">Recipients</div>
              <div className="w-[80px] shrink-0 text-right">Opens</div>
              <div className="w-[80px] shrink-0 text-right">Clicks</div>
              <div className="w-[80px] shrink-0 text-right pr-2">Actions</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {broadcasts.map((b, i) => (
                <div key={i} className="h-[52px] flex items-center px-4 border-b border-border-default last:border-0 hover:bg-subtle-bg transition-colors group">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[13px] font-medium text-text-primary hover:text-accent cursor-pointer truncate block">{b.subject}</span>
                  </div>
                  <div className="w-[120px] shrink-0 text-[12px] text-text-secondary">{b.date}</div>
                  <div className="w-[100px] shrink-0 text-[13px] font-medium text-text-secondary text-right">{b.recipients}</div>
                  <div className="w-[80px] shrink-0 text-[13px] font-medium text-text-secondary text-right">{b.opens}</div>
                  <div className="w-[80px] shrink-0 text-[13px] font-medium text-text-secondary text-right">{b.clicks}</div>
                  <div className="w-[80px] shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-background border border-transparent hover:border-border-default transition-all" title="View report">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-background border border-transparent hover:border-border-default transition-all" title="More">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}