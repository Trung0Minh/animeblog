import { useState } from "react";
import { Search, Plus, MoreHorizontal, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router";

export function Writers() {
  const writers = [
    { name: "Haruki Tanaka", email: "haruki@example.com", role: "Admin", posts: 42, color: "#0d9488", status: "Active" },
    { name: "Mei Yoshida", email: "mei.yoshida@example.com", role: "Editor", posts: 28, color: "#c2410c", status: "Active" },
    { name: "Sora Nakamura", email: "sora.n@example.com", role: "Writer", posts: 15, color: "#475569", status: "Active" },
    { name: "Kenta Mori", email: "kenta@example.com", role: "Writer", posts: 9, color: "#7e22ce", status: "Active" },
    { name: "Yuki Ishikawa", email: "yuki.i@example.com", role: "Writer", posts: 4, color: "#9f1239", status: "On Leave" },
    { name: "Ren Fujiwara", email: "ren@example.com", role: "Guest", posts: 1, color: "#15803d", status: "Active" },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-text-primary">Writers</h1>
          <p className="text-[14px] text-text-secondary mt-1">Manage your editorial team and permissions</p>
        </div>
        <button className="shrink-0 h-[34px] px-3.5 bg-button-bg text-button-text rounded-[5px] text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 w-full md:w-auto">
          <Plus className="w-3.5 h-3.5" />
          Invite Writer
        </button>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-full md:w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Search writers by name or email..." 
            className="w-full h-[34px] pl-8 pr-2.5 border border-border-default rounded-[5px] text-[13px] bg-transparent outline-none focus:border-accent placeholder:text-text-tertiary transition-colors"
          />
        </div>
      </div>

      {/* Writers Table */}
      <div className="w-full overflow-x-auto border border-border-default rounded-[8px] bg-background">
        <div className="min-w-[700px]">
          {/* Table Header */}
          <div className="h-[40px] flex items-center bg-subtle-bg border-b border-border-default px-4 text-[11px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
            <div className="flex-1 min-w-0 pr-4">Name</div>
            <div className="w-[120px] shrink-0">Role</div>
            <div className="w-[100px] shrink-0 text-right">Posts</div>
            <div className="w-[120px] shrink-0 text-right">Status</div>
            <div className="w-[80px] shrink-0 text-right pr-2">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {writers.map((writer, i) => (
              <div key={i} className="h-[56px] flex items-center px-4 border-b border-border-default last:border-0 hover:bg-subtle-bg transition-colors group">
                {/* Name & Avatar */}
                <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ backgroundColor: writer.color }}>
                    {writer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary truncate">{writer.name}</div>
                    <div className="text-[12px] text-text-tertiary truncate mt-0.5">{writer.email}</div>
                  </div>
                </div>

                {/* Role */}
                <div className="w-[120px] shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium border
                    ${writer.role === 'Admin' ? 'bg-subtle-bg border-border-strong text-text-primary' : 
                      writer.role === 'Editor' ? 'bg-subtle-bg border-border-default text-text-secondary' : 
                      'bg-transparent border-border-default text-text-tertiary'}
                  `}>
                    {writer.role}
                  </span>
                </div>

                {/* Posts */}
                <div className="w-[100px] shrink-0 text-[13px] font-medium text-text-secondary text-right">
                  {writer.posts}
                </div>

                {/* Status */}
                <div className="w-[120px] shrink-0 text-right text-[12px]">
                  <span className={writer.status === 'Active' ? 'text-[#15803d] dark:text-[#4ade80]' : 'text-text-tertiary'}>
                    {writer.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="w-[80px] shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-8 h-8 flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-background border border-transparent hover:border-border-default transition-all" title="Email writer">
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-background border border-transparent hover:border-border-default transition-all" title="More options">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}