import { useState } from "react";
import { Search, Check, X, ShieldAlert, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router";

export function Comments() {
  const [activeTab, setActiveTab] = useState("Pending");

  const comments = [
    { id: 1, author: "Sora K.", email: "sora@example.com", post: "The Sound Design of Chainsaw Man", content: "This is exactly the kind of analysis I've been looking for. The point about accidental silence really reframes how I watch those scenes.", date: "1 hour ago", status: "Pending" },
    { id: 2, author: "Anonymous Reader", email: "anon@example.com", post: "Frieren's Animation Direction", content: "The comparison to Dezaki is a bit of a stretch in my opinion, but I appreciate the detailed breakdown of the shot composition.", date: "3 hours ago", status: "Pending" },
    { id: 3, author: "CryptoKing99", email: "spam@crypto.com", post: "Ufotable's Visual Language", content: "Great post! Check out my new crypto trading bot for guaranteed returns! [LINK]", date: "5 hours ago", status: "Spam" },
    { id: 4, author: "Yuki I.", email: "yuki@example.com", post: "Vinland Saga S2", content: "As someone who worked in production, seeing this level of deep dive into the philosophy rather than just 'good animation' is refreshing.", date: "Jan 13", status: "Approved" },
    { id: 5, author: "M. Fujita", email: "fujita@example.com", post: "Science SARU's Approach", content: "Yuasa's influence extends beyond just the fluid character acting. The background art distortion is equally important.", date: "Jan 12", status: "Approved" },
    { id: 6, author: "CheapMeds", email: "buy@now.com", post: "The Background Art of Made in Abyss", content: "Buy cheap meds online now! Best prices!", date: "Jan 10", status: "Spam" },
  ];

  const filteredComments = comments.filter(c => c.status === activeTab);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-text-primary">Comments</h1>
        <p className="text-[14px] text-text-secondary mt-1">Manage reader discussions</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="inline-flex p-[3px] bg-subtle-bg/50 border border-border-default rounded-[7px] w-fit">
          {["Pending", "Approved", "Spam"].map((tab) => {
            const count = comments.filter(c => c.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[12px] rounded-[5px] transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? "bg-background text-text-primary font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]" 
                    : "text-text-secondary font-medium hover:text-text-primary"
                }`}
              >
                {tab}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-subtle-bg text-text-primary' : 'bg-border-default/50 text-text-tertiary'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Search comments..." 
            className="w-full h-[34px] pl-8 pr-2.5 border border-border-default rounded-[5px] text-[13px] bg-transparent outline-none focus:border-accent placeholder:text-text-tertiary transition-colors"
          />
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-background border border-border-default rounded-[8px] overflow-hidden">
        {filteredComments.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary text-[13px]">
            No {activeTab.toLowerCase()} comments found.
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredComments.map((comment, i) => (
              <div key={comment.id} className="p-4 md:p-5 border-b border-border-default last:border-0 hover:bg-subtle-bg transition-colors group flex flex-col md:flex-row gap-4">
                
                {/* Avatar */}
                <div className="hidden md:block shrink-0 pt-1">
                  <div className="w-9 h-9 rounded-full bg-border-default text-text-secondary flex items-center justify-center text-[13px] font-semibold">
                    {comment.author.charAt(0)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                    <span className="font-semibold text-[14px] text-text-primary">{comment.author}</span>
                    <span className="text-[12px] text-text-tertiary">{comment.email}</span>
                    <span className="text-text-tertiary text-[12px] px-1">·</span>
                    <span className="text-[12px] text-text-tertiary">{comment.date}</span>
                  </div>
                  
                  <div className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                    <span>on</span>
                    <Link to="#" className="font-medium text-text-primary hover:text-accent hover:underline truncate max-w-[200px] md:max-w-[300px]">
                      {comment.post}
                    </Link>
                  </div>

                  <p className="text-[14px] leading-[1.5] text-text-primary break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-start gap-1.5 mt-2 md:mt-0">
                  {activeTab === "Pending" && (
                    <>
                      <button className="h-8 px-3 rounded-[5px] bg-[#f0fdf4] text-[#15803d] dark:bg-[#14532d30] dark:text-[#4ade80] text-[12px] font-semibold hover:opacity-80 transition-opacity flex items-center gap-1.5 border border-[#15803d]/20">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-[5px] text-text-secondary hover:bg-background border border-border-default hover:border-text-tertiary transition-all" title="Mark as spam">
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {activeTab === "Approved" && (
                    <button className="h-8 px-3 rounded-[5px] bg-background border border-border-default text-text-secondary text-[12px] font-medium hover:bg-subtle-bg transition-colors">
                      Reply
                    </button>
                  )}

                  {activeTab === "Spam" && (
                    <button className="h-8 px-3 rounded-[5px] bg-background border border-border-default text-text-secondary text-[12px] font-medium hover:bg-subtle-bg transition-colors flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Not Spam
                    </button>
                  )}

                  <button className="w-8 h-8 flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-[#fef2f2] dark:hover:bg-[#3f0f0f40] hover:text-accent border border-transparent transition-all" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}