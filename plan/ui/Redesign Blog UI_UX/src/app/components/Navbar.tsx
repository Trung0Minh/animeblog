import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 border-b ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-border-default/50"
            : "bg-background border-transparent"
        }`}
      >
        <div className="flex h-[52px] md:h-[56px] items-center justify-between px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-[16px] tracking-tight hover:text-accent transition-colors">
              Anime Blog
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link to="#" className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              Contributors
            </Link>
            <Link to="#" className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <div className="hidden md:flex relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                placeholder="Search posts..."
                className="w-[280px] h-[32px] pl-9 pr-4 rounded-full bg-subtle-bg border border-transparent focus:border-border-default focus:bg-background outline-none text-[13px] text-text-primary placeholder:text-text-tertiary transition-all"
              />
            </div>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-full hover:bg-subtle-bg text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="w-[18px] h-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-[18px] h-[18px] top-[14px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-1.5 text-text-secondary"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-background shadow-2xl flex flex-col p-6 animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-[16px]">Anime Blog</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 text-[16px] font-medium text-text-secondary">
              <Link to="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-text-primary">Contributors</Link>
              <Link to="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-text-primary">About</Link>
              
              <div className="h-px bg-border-default my-2" />
              
              <Link to="/editor" onClick={() => setMobileMenuOpen(false)} className="hover:text-text-primary">My Posts</Link>
              <Link to="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-text-primary">Edit Profile</Link>
              <Link to="#" onClick={() => setMobileMenuOpen(false)} className="text-accent mt-auto">Sign out</Link>
            </nav>

            <div className="mt-auto pt-8">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-subtle-bg border border-border-default outline-none text-[14px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}