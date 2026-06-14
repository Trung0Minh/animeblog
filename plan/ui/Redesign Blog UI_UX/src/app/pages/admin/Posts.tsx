import { useState } from "react";
import { Search, Plus, ExternalLink, Archive, ArchiveRestore, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";

export function Posts() {
  const [activeTab, setActiveTab] = useState("All");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const posts = [
    { title: "The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes", slug: "/chainsaw-man-sound", author: "Haruki Tanaka", color: "#0d9488", status: "Published", date: "Jan 14, 2025", comments: "24" },
    { title: "Blue Eye Samurai and the Western Gaze on Japanese Animation", slug: "/blue-eye-samurai-western", author: "Mei Yoshida", color: "#c2410c", status: "Draft", date: "Updated Jan 13", comments: "—" },
    { title: "How Ufotable Redefined the Visual Language of Shonen Action", slug: "/ufotable-visual-language", author: "Haruki Tanaka", color: "#0d9488", status: "Published", date: "Jan 12, 2025", comments: "41" },
    { title: "Reigen Arataka and the Art of Comedic Timing in Animation", slug: "/reigen-comedic-timing", author: "Kenta Mori", color: "#7e22ce", status: "Published", date: "Jan 10, 2025", comments: "8" },
    { title: "Vinland Saga Season 2: When Animation Becomes Philosophy", slug: "/vinland-saga-s2-philosophy", author: "Sora Nakamura", color: "#475569", status: "Published", date: "Jan 8, 2025", comments: "16" },
    { title: "The Background Art of Made in Abyss", slug: "/made-in-abyss-backgrounds", author: "Sora Nakamura", color: "#475569", status: "Draft", date: "Updated Jan 5", comments: "—" },
    { title: "Science SARU's Fluid Approach to Human Emotion", slug: "/science-saru-fluid", author: "Ren Fujiwara", color: "#15803d", status: "Published", date: "Dec 29, 2024", comments: "7" },
    { title: "Satoshi Kon's Influence on Contemporary Directors", slug: "/satoshi-kon-influence", author: "Mei Yoshida", color: "#c2410c", status: "Published", date: "Dec 22, 2024", comments: "33" },
    { title: "Seasonal Preview: Winter 2024 Animation", slug: "/seasonal-winter-2024", author: "Yuki Ishikawa", color: "#9f1239", status: "Archived", date: "Dec 15, 2024", comments: "5" },
    { title: "The Intimate Scale of Mushishi's World-Building", slug: "/mushishi-world-building", author: "Haruki Tanaka", color: "#0d9488", status: "Published", date: "Dec 10, 2024", comments: "12" },
  ];

  const filteredPosts = activeTab === "All" ? posts : posts.filter(p => p.status.startsWith(activeTab));

  const openDeleteModal = (post: any) => {
    setSelectedPost(post);
    setDeleteModalOpen(true);
  };

  const openArchiveModal = (post: any) => {
    setSelectedPost(post);
    setArchiveModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-text-primary">Posts</h1>
        <p className="text-[14px] text-text-secondary mt-1">47 published · 8 drafts · 2 archived</p>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-[3px] bg-subtle-bg/50 border border-border-default rounded-[7px] w-fit">
          {["All (57)", "Published (47)", "Drafts (8)", "Archived (2)"].map((tab) => {
            const label = tab.split(" ")[0];
            const isActive = activeTab === label;
            return (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`px-3 py-1.5 text-[12px] rounded-[5px] transition-all ${
                  isActive 
                    ? "bg-background text-text-primary font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]" 
                    : "text-text-secondary font-medium hover:text-text-primary"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search posts..." 
              className="w-full h-[34px] pl-8 pr-2.5 border border-border-default rounded-[5px] text-[13px] bg-transparent outline-none focus:border-accent placeholder:text-text-tertiary transition-colors"
            />
          </div>
          <Link to="/editor" className="shrink-0 h-[34px] px-3.5 bg-button-bg text-button-text rounded-[5px] text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New post
          </Link>
        </div>
      </div>

      {/* Posts Table */}
      <div className="w-full overflow-x-auto border border-border-default rounded-[8px] bg-background">
        <div className="min-w-[700px]">
          {/* Table Header */}
          <div className="h-[40px] flex items-center bg-subtle-bg border-b border-border-default px-4 text-[11px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
            <div className="flex-1 min-w-0 pr-4">Title</div>
            <div className="w-[140px] shrink-0 hidden md:block">Author</div>
            <div className="w-[100px] shrink-0">Status</div>
            <div className="w-[120px] shrink-0 hidden lg:block">Date</div>
            <div className="w-[80px] shrink-0 hidden lg:block text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {filteredPosts.map((post, i) => {
              const isPublished = post.status === "Published";
              const isDraft = post.status === "Draft";
              const isArchived = post.status === "Archived";

              return (
                <div key={i} className="h-[52px] flex items-center px-4 border-b border-border-default last:border-0 hover:bg-subtle-bg transition-colors group">
                  {/* Title */}
                  <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                    <Link to="/editor" className="text-[13px] font-medium text-text-primary truncate hover:text-accent cursor-pointer transition-colors block">
                      {post.title}
                    </Link>
                    <div className="text-[11px] text-text-tertiary font-mono truncate mt-0.5">
                      {post.slug}
                    </div>
                  </div>

                  {/* Author */}
                  <div className="w-[140px] shrink-0 hidden md:flex items-center gap-2">
                    <div className="w-[22px] h-[22px] rounded-full text-white flex items-center justify-center text-[10px] font-semibold" style={{ backgroundColor: post.color }}>
                      {post.author.charAt(0)}
                    </div>
                    <span className="text-[12px] text-text-secondary truncate">{post.author}</span>
                  </div>

                  {/* Status */}
                  <div className="w-[100px] shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                      ${isPublished ? 'bg-[#f0fdf4] text-[#15803d] dark:bg-[#14532d30] dark:text-[#4ade80]' : 
                        isDraft ? 'bg-subtle-bg border border-border-default text-text-tertiary' : 
                        'bg-[#fff7ed] text-[#c2410c] dark:bg-[#7c2d1230] dark:text-[#fb923c]'}
                    `}>
                      {post.status}
                    </span>
                  </div>

                  {/* Date */}
                  <div className={`w-[120px] shrink-0 hidden lg:block text-[12px] ${isPublished || isArchived ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                    {post.date}
                  </div>

                  {/* Comments */}
                  <div className="w-[80px] shrink-0 hidden lg:block text-[12px] font-medium text-text-secondary text-right">
                    {post.comments}
                  </div>

                  {/* Actions */}
                  <div className="w-[80px] shrink-0 flex items-center justify-end gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPublished && (
                      <button className="w-[28px] h-[28px] flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-subtle-bg hover:text-text-primary transition-colors" title="View post">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isArchived ? (
                      <button 
                        className="w-[28px] h-[28px] flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-subtle-bg hover:text-[#15803d] dark:hover:text-[#4ade80] transition-colors" 
                        title="Restore"
                        onClick={() => openArchiveModal(post)}
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        className="w-[28px] h-[28px] flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-subtle-bg hover:text-orange-500 transition-colors" 
                        title="Archive"
                        onClick={() => openArchiveModal(post)}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      className="w-[28px] h-[28px] flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-subtle-bg hover:text-accent transition-colors" 
                      title="Delete"
                      onClick={() => openDeleteModal(post)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-5 pb-2 flex items-center justify-center gap-1.5">
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-subtle-bg transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-subtle-bg transition-colors">1</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-primary bg-subtle-bg font-semibold">2</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-subtle-bg transition-colors">3</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-subtle-bg transition-colors">4</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-subtle-bg transition-colors">5</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-subtle-bg transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModalOpen(false)}></div>
          <div className="relative w-full max-w-[400px] bg-background border border-border-default rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-[28px] animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#fef2f2] dark:bg-[#3f0f0f40] flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-[17px] font-bold text-text-primary mb-2">Delete post?</h2>
            <p className="text-[13px] text-text-secondary leading-[1.6]">
              This will permanently delete <span className="font-semibold text-text-primary">"{selectedPost.title}"</span>. This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="h-[36px] px-4 rounded-[5px] border border-border-default text-text-primary text-[13px] font-medium hover:bg-subtle-bg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="h-[36px] px-4 rounded-[5px] bg-[#c0392b] dark:bg-[#e05c4a] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                Delete post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setArchiveModalOpen(false)}></div>
          <div className="relative w-full max-w-[400px] bg-background border border-border-default rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-[28px] animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-[#7c2d1230] flex items-center justify-center mb-4">
              <Archive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-[17px] font-bold text-text-primary mb-2">
              {selectedPost.status === "Archived" ? "Restore post?" : "Archive post?"}
            </h2>
            <p className="text-[13px] text-text-secondary leading-[1.6]">
              {selectedPost.status === "Archived" 
                ? <>This will restore <span className="font-semibold text-text-primary">"{selectedPost.title}"</span>. It will be moved back to its original state.</>
                : <>This will hide <span className="font-semibold text-text-primary">"{selectedPost.title}"</span> from public view. You can restore it anytime from the Archived filter.</>}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button 
                onClick={() => setArchiveModalOpen(false)}
                className="h-[36px] px-4 rounded-[5px] border border-border-default text-text-primary text-[13px] font-medium hover:bg-subtle-bg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setArchiveModalOpen(false)}
                className="h-[36px] px-4 rounded-[5px] bg-[#c47f5a] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                {selectedPost.status === "Archived" ? "Restore post" : "Archive post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}