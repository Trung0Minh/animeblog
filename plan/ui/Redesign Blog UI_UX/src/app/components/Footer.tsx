export function Footer() {
  return (
    <footer className="border-t border-border-default mt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="font-bold text-[16px] tracking-tight">Anime Blog</span>
            <p className="text-[13px] text-text-secondary mt-2">
              Serious analysis for passionate fans.
            </p>
          </div>
          <div className="flex gap-6 text-[13px] text-text-secondary">
            <a href="#" className="hover:text-text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-text-primary transition-colors">RSS</a>
            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}