import { Link, Outlet, useLocation } from "react-router";
import { useState } from "react";
import { ChevronDown, BarChart2, Edit3, Users, MessageSquare, Mail, LineChart, Menu, X } from "lucide-react";

export function AdminRoot() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = [
    { label: "Dashboard", path: "/admin", icon: BarChart2, activeOn: ["/admin"] },
    { label: "Posts", path: "/admin/posts", icon: Edit3, activeOn: ["/admin/posts"] },
    { label: "Writers", path: "/admin/writers", icon: Users, activeOn: ["/admin/writers"] },
    { label: "Comments", path: "/admin/comments", icon: MessageSquare, activeOn: ["/admin/comments"] },
    { label: "Newsletter", path: "/admin/newsletter", icon: Mail, activeOn: ["/admin/newsletter"] },
    { label: "Analytics", path: "/admin/analytics", icon: LineChart, activeOn: ["/admin/analytics"] },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-text-primary flex flex-col">
      {/* Admin Navbar */}
      <header className="h-[56px] w-full sticky top-0 bg-background border-b border-border-default z-40">
        <div className="max-w-[1200px] mx-auto h-full px-5 md:px-6 flex items-center justify-between relative">
          
          {/* Left Zone */}
          <div className="flex items-center">
            <Link to="/" className="text-[13px] font-medium text-text-tertiary hover:text-text-secondary transition-colors">
              ← Blog
            </Link>
            <div className="w-px h-4 bg-border-default mx-3 md:mx-4"></div>
            <span className="text-[13px] font-semibold text-text-primary">Admin</span>
          </div>

          {/* Center Zone - Desktop */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {tabs.map(tab => {
              const isActive = tab.activeOn.includes(location.pathname);
              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                    isActive 
                      ? "bg-subtle-bg text-text-primary font-semibold" 
                      : "text-text-secondary font-medium hover:text-text-primary hover:bg-subtle-bg/50"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Zone */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-[30px] h-[30px] rounded-full bg-[#c0392b] text-white flex items-center justify-center text-[14px] font-semibold">
                A
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-1.5 text-text-secondary hover:text-text-primary"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-background border-l border-border-default shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border-default">
              <span className="font-bold text-[16px]">Admin Panel</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {tabs.map(tab => {
                const isActive = tab.activeOn.includes(location.pathname);
                return (
                  <Link
                    key={tab.label}
                    to={tab.path}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] text-[14px] transition-colors ${
                      isActive 
                        ? "bg-subtle-bg text-text-primary font-semibold" 
                        : "text-text-secondary font-medium hover:text-text-primary hover:bg-subtle-bg/50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border-default">
              <Link to="/" className="text-[13px] font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5">
                View blog →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}