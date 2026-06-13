import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Home() {
  const posts = [
    {
      id: "1",
      category: "ANIMATION ANALYSIS",
      title: "The Quiet Revolution of Frieren's Animation Direction",
      excerpt: "When Frieren: Beyond Journey's End premiered, few expected it to become one of the most visually ambitious productions of the decade. Yet episode after episode, director Atsushi Ookubo and his team...",
      author: "Haruki Tanaka",
      date: "Mar 14",
      comments: 24,
      tags: ["Frieren", "Madhouse", "2023 Fall", "Seinen"],
      image: "https://images.unsplash.com/photo-1706076463257-20b41d9519f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllcmVuJTIwYW5pbWUlMjBzY3JlZW5zaG90fGVufDF8fHx8MTc4MTMzMzMyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "2",
      category: "ACTION CHOREOGRAPHY",
      title: "How Ufotable Redefined the Visual Language of Action Anime",
      excerpt: "The integration of 3D backgrounds with 2D character animation has been a holy grail for studios. Ufotable's approach in Demon Slayer doesn't just solve the technical challenge—it changes how fights are directed.",
      author: "Mei Yoshida",
      date: "Feb 28",
      comments: 56,
      tags: ["Ufotable", "Sakuga", "Demon Slayer", "Action"],
      image: "https://images.unsplash.com/photo-1762359853028-e9b61ed96114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW1vbiUyMHNsYXllciUyMGFuaW1lJTIwZmlnaHQlMjBzY2VuZXxlbnwxfHx8fDE3ODEzMzMzMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "3",
      category: "EXPRESSIONISM",
      title: "Visual Anarchy and Emotional Truth in Mob Psycho 100",
      excerpt: "Where most shows strive for on-model consistency, Mob Psycho 100 finds its emotional resonance in deliberate distortion. A look at how breaking the rules of character design communicates profound interior states.",
      author: "Yuki Ishikawa",
      date: "Jan 12",
      comments: 18,
      tags: ["Bones", "Character Design", "Shounen"],
      image: "https://images.unsplash.com/photo-1717196665638-43a6b92a7b10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2IlMjBwc3ljaG8lMjAxMDAlMjBhbmltZXxlbnwxfHx8fDE3ODEzMzMzMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 flex flex-col lg:flex-row gap-12 xl:gap-[48px]">
      
      {/* Left Column - Post List */}
      <div className="flex-1 lg:w-[calc(100%-288px)] xl:w-[calc(100%-288px)] flex flex-col gap-10 md:gap-14">
        {posts.map(post => (
          <article key={post.id} className="group flex flex-col">
            <Link to={`/post/${post.id}`} className="block overflow-hidden rounded-[6px] mb-4">
              <div className="relative aspect-video w-full bg-subtle-bg overflow-hidden dark:brightness-[0.9]">
                <ImageWithFallback
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              </div>
            </Link>
            
            <div className="text-[11px] font-semibold text-accent tracking-[0.08em] uppercase mb-2">
              {post.category}
            </div>
            
            <Link to={`/post/${post.id}`}>
              <h2 className="text-[20px] font-bold text-text-primary leading-[1.3] mb-3 line-clamp-2 transition-colors duration-200 group-hover:text-accent">
                {post.title}
              </h2>
            </Link>
            
            <p className="hidden md:block font-serif text-[14px] text-text-secondary leading-[1.65] mb-4 line-clamp-3">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between text-[13px] text-text-secondary mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-subtle-bg border border-border-default flex items-center justify-center text-[10px] font-medium text-text-primary">
                  {post.author.charAt(0)}
                </div>
                <span>{post.author}</span>
                <span className="opacity-50">·</span>
                <span>{post.date}</span>
              </div>
              <div>{post.comments} comments</div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-subtle-bg text-text-secondary text-[11px] hover:bg-border-default transition-colors cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-text-primary text-background text-[13px] font-medium">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-subtle-bg text-[13px] font-medium transition-colors">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-subtle-bg text-[13px] font-medium transition-colors">3</button>
          <span className="text-text-tertiary">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-subtle-bg text-[13px] font-medium transition-colors">8</button>
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <aside className="w-full lg:w-[240px] flex-shrink-0 flex flex-col gap-12 lg:sticky lg:top-[104px] lg:h-fit">
        
        {/* Newsletter */}
        <section>
          <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest mb-3">Newsletter</h3>
          <p className="text-[13px] text-text-secondary mb-4">Get notified when new posts are published.</p>
          <form className="flex flex-col gap-3" onSubmit={e => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="w-full h-10 px-3 border border-border-default rounded-[4px] bg-transparent text-[13px] outline-none focus:border-accent transition-colors"
            />
            <button className="w-full h-10 bg-button-bg text-button-text font-medium text-[13px] rounded-[4px] hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </form>
        </section>

        {/* Categories */}
        <section>
          <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest mb-4">Categories</h3>
          <ul className="flex flex-col text-[14px]">
            <li className="flex flex-col py-1.5 border-b border-border-default last:border-0 group cursor-pointer">
              <div className="flex justify-between items-center group-hover:text-accent transition-colors">
                <span>Analysis</span>
                <span className="text-[12px] text-text-tertiary">24</span>
              </div>
              <ul className="pl-3 mt-2 border-l border-border-default flex flex-col gap-2">
                <li className="flex justify-between items-center text-[13px] text-text-secondary hover:text-accent transition-colors">
                  <span>Animation Analysis</span>
                  <span className="text-[12px] text-text-tertiary">12</span>
                </li>
                <li className="flex justify-between items-center text-[13px] text-text-secondary hover:text-accent transition-colors">
                  <span>Narrative Analysis</span>
                  <span className="text-[12px] text-text-tertiary">8</span>
                </li>
              </ul>
            </li>
            <li className="flex justify-between items-center py-2.5 border-b border-border-default last:border-0 group cursor-pointer hover:text-accent transition-colors">
              <span>Reviews</span>
              <span className="text-[12px] text-text-tertiary">18</span>
            </li>
            <li className="flex justify-between items-center py-2.5 group cursor-pointer hover:text-accent transition-colors">
              <span>Essays</span>
              <span className="text-[12px] text-text-tertiary">7</span>
            </li>
          </ul>
        </section>

        {/* Recent Posts */}
        <section>
          <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest mb-4">Recent Posts</h3>
          <div className="flex flex-col gap-4">
            {[
              { t: "The Architectural Approach to Storytelling in Vinland Saga", d: "Mar 10" },
              { t: "Understanding the Pacing of Slow-Life Fantasy", d: "Mar 5" },
              { t: "Color Theory in Kyoto Animation's Golden Era", d: "Feb 22" },
              { t: "Why We Need More Mid-Budget Mecha Shows", d: "Feb 18" },
              { t: "The Sound Design Philosophy of Chainsaw Man", d: "Feb 10" },
            ].map((post, i) => (
              <div key={i} className="group cursor-pointer">
                <h4 className="text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                  {post.t}
                </h4>
                <div className="text-[12px] text-text-tertiary mt-1">{post.d}</div>
              </div>
            ))}
          </div>
        </section>

      </aside>

    </main>
  );
}