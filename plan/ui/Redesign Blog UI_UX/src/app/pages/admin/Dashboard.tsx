import { FileText, Edit2, Users, MessageSquare, Mail, Eye, MousePointerClick, Clock, TrendingUp, TrendingDown, MoreVertical } from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-[24px] font-bold text-text-primary">Dashboard</h1>
        <p className="text-[14px] text-text-secondary mt-1">Overview of your blog's activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:flex md:flex-row gap-4 mb-8">
        <StatCard 
          label="PUBLISHED POSTS" 
          value="47" 
          icon={FileText} 
          trend="↑ 3 this month" 
          trendPositive={true} 
        />
        <StatCard 
          label="DRAFTS" 
          value="8" 
          icon={Edit2} 
        />
        <StatCard 
          label="WRITERS" 
          value="6" 
          icon={Users} 
          trend="↑ 1 new" 
          trendPositive={true} 
        />
        <StatCard 
          label="COMMENTS" 
          value="284" 
          icon={MessageSquare} 
          trend="↑ 12% vs last month" 
          trendPositive={true} 
        />
        <StatCard 
          label="SUBSCRIBERS" 
          value="1,247" 
          icon={Mail} 
          trend="↑ 8% vs last month" 
          trendPositive={true} 
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-text-primary">Analytics</h2>
          <select className="text-[13px] border border-border-default rounded-[5px] px-2.5 py-1.5 bg-transparent outline-none text-text-primary focus:border-accent appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b6b6b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] pr-8">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>This year</option>
          </select>
        </div>
        <div className="w-full h-px bg-border-default mb-4"></div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:flex md:flex-row gap-4 mb-5">
          <AnalyticsCard label="PAGE VIEWS" value="18,420" change="+14% vs prev period" icon={Eye} />
          <AnalyticsCard label="UNIQUE VISITORS" value="6,831" change="+9% vs prev period" icon={Users} />
          <AnalyticsCard label="VISITS" value="9,205" change="+11% vs prev period" icon={MousePointerClick} />
          <AnalyticsCard label="AVG. TIME ON SITE" value="4m 12s" change="+0.3min vs prev period" icon={Clock} />
        </div>

        {/* Top Pages Table - Hidden on Mobile */}
        <div className="hidden md:block mt-5">
          <h3 className="text-[14px] font-semibold text-text-primary mb-3">Top pages — last 30 days</h3>
          <div className="flex flex-col">
            {[
              { path: "/frierens-animation-direction", views: "4,821" },
              { path: "/ufotable-visual-language", views: "3,205" },
              { path: "/vinland-saga-philosophy", views: "2,891" },
              { path: "/mob-psycho-timing", views: "2,440" },
              { path: "/chainsaw-man-sound", views: "1,973" },
            ].map((page, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border-default last:border-0">
                <span className="text-[13px] text-text-secondary font-mono">{page.path}</span>
                <span className="text-[13px] font-semibold text-text-primary">{page.views}</span>
              </div>
            ))}
          </div>
        </div>
        
        <Link to="#" className="inline-block mt-4 text-[13px] text-accent hover:underline font-medium">
          View full analytics dashboard →
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Posts */}
        <div>
          <h3 className="text-[11px] font-semibold text-text-tertiary tracking-[0.1em] uppercase border-b border-border-default pb-2.5 mb-3.5">
            RECENT POSTS
          </h3>
          <div className="flex flex-col">
            <PostRow 
              status="Published" 
              title="The Sound Design of Chainsaw Man" 
              meta="Haruki Tanaka · 2 hours ago" 
            />
            <PostRow 
              status="Draft" 
              title="Blue Eye Samurai: A Western Perspective" 
              meta="Mei Yoshida · Yesterday" 
            />
            <PostRow 
              status="Published" 
              title="Hiroyuki Imaishi's Camera Philosophy" 
              meta="Kenta Mori · Jan 12" 
            />
            <PostRow 
              status="Archived" 
              title="Seasonal Preview: Winter 2024" 
              meta="Yuki Ishikawa · Jan 8" 
            />
            <PostRow 
              status="Draft" 
              title="The Background Art of Made in Abyss" 
              meta="Sora Nakamura · Jan 5" 
              last
            />
          </div>
        </div>

        {/* Recent Comments */}
        <div>
          <h3 className="text-[11px] font-semibold text-text-tertiary tracking-[0.1em] uppercase border-b border-border-default pb-2.5 mb-3.5">
            RECENT COMMENTS
          </h3>
          <div className="flex flex-col">
            <CommentRow 
              author="Sora K." 
              postTitle="The Sound Design of Chainsaw Man" 
              preview="This is exactly the kind of analysis..." 
              time="1 hour ago" 
            />
            <CommentRow 
              author="Anonymous Reader" 
              postTitle="Frieren's Animation Direction" 
              preview="The comparison to Dezaki is..." 
              time="3 hours ago" 
            />
            <CommentRow 
              author="anime_critic_99" 
              postTitle="Ufotable's Visual Language" 
              preview="I'd argue Fate/Zero was actually..." 
              time="Yesterday" 
            />
            <CommentRow 
              author="Yuki I." 
              postTitle="Vinland Saga S2" 
              preview="As someone who worked in production..." 
              time="Jan 13" 
            />
            <CommentRow 
              author="M. Fujita" 
              postTitle="Science SARU's Approach" 
              preview="Yuasa's influence extends beyond..." 
              time="Jan 12" 
              last
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, trendPositive, className = "" }: any) {
  return (
    <div className={`bg-background border border-border-default rounded-[8px] p-4 md:p-5 flex-1 min-w-0 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-text-secondary uppercase tracking-[0.06em] truncate pr-2">{label}</span>
        <Icon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
      </div>
      <div>
        <div className="text-[24px] md:text-[28px] font-bold text-text-primary leading-tight">{value}</div>
        {trend && (
          <div className={`text-[11px] mt-1 truncate ${trendPositive ? 'text-[#15803d] dark:text-[#4ade80]' : 'text-accent'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, change, icon: Icon }: any) {
  return (
    <div className="bg-background border border-border-default rounded-[8px] p-4 md:p-5 flex-1 min-w-0 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-text-secondary uppercase tracking-[0.06em] truncate pr-2">{label}</span>
        <Icon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
      </div>
      <div>
        <div className="text-[24px] md:text-[28px] font-bold text-text-primary leading-tight">{value}</div>
        <div className="text-[11px] mt-1 text-[#15803d] dark:text-[#4ade80] truncate">
          {change}
        </div>
      </div>
    </div>
  );
}

function PostRow({ status, title, meta, last }: any) {
  const isPublished = status === "Published";
  const isDraft = status === "Draft";
  
  return (
    <div className={`flex items-start gap-3 py-2.5 ${last ? '' : 'border-b border-border-default'}`}>
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5
        ${isPublished ? 'bg-[#f0fdf4] text-[#15803d] dark:bg-[#14532d30] dark:text-[#4ade80]' : 
          isDraft ? 'bg-subtle-bg border border-border-default text-text-tertiary' : 
          'bg-[#fff7ed] text-[#c2410c] dark:bg-[#7c2d1230] dark:text-[#fb923c]'}
      `}>
        {status}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-[13px] font-medium text-text-primary truncate hover:text-accent cursor-pointer transition-colors">
          {title}
        </h4>
        <div className="text-[11px] text-text-tertiary mt-0.5">
          {meta}
        </div>
      </div>
    </div>
  );
}

function CommentRow({ author, postTitle, preview, time, last }: any) {
  return (
    <div className={`py-2.5 flex items-start group ${last ? '' : 'border-b border-border-default'}`}>
      <div className="flex-1 min-w-0 pr-2">
        <div className="text-[12px]">
          <span className="font-semibold text-text-primary">{author}</span>
          <span className="text-text-tertiary mx-1">on</span>
          <span className="text-text-tertiary truncate max-w-[120px] inline-block align-bottom hover:underline cursor-pointer">
            {postTitle}
          </span>
        </div>
        <p className="text-[12px] text-text-secondary italic line-clamp-2 leading-[1.4] mt-0.5">
          "{preview}"
        </p>
        <div className="text-[11px] text-text-tertiary mt-1">
          {time}
        </div>
      </div>
      <button className="text-[11px] font-medium text-text-tertiary md:opacity-0 group-hover:opacity-100 hover:text-accent transition-all shrink-0">
        Mark spam
      </button>
    </div>
  );
}