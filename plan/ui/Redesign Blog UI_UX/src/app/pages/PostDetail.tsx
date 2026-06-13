import { useEffect } from "react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function PostDetail() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex justify-center pt-8 md:pt-[48px] pb-[80px] px-4 md:px-6">
      {/* 
        Container setup:
        Mobile: single column 100% width.
        Tablet: max 720px centered.
        Desktop (xl+): 720px content + 48px gap + 200px TOC
      */}
      <div className="flex flex-col xl:flex-row w-full max-w-[720px] xl:max-w-[968px] relative gap-[48px]">
        
        {/* Main Article Content */}
        <article className="flex-1 min-w-0 max-w-[720px]">
          {/* Post Header */}
          <header className="mb-10 md:mb-12">
            <div className="text-[11px] font-semibold text-accent tracking-[0.1em] uppercase mb-[10px]">
              ANIMATION ANALYSIS
            </div>
            
            <h1 className="text-[26px] md:text-[36px] font-bold text-text-primary leading-[1.25] md:leading-[1.2] tracking-[-0.02em] mb-5">
              The Quiet Revolution of Frieren's Animation Direction
            </h1>
            
            <div className="flex items-center gap-3 mt-5">
              <div className="flex -space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#2d6e7e] text-white flex items-center justify-center text-sm font-medium border-2 border-background z-10">
                  H
                </div>
                <div className="w-9 h-9 rounded-full bg-[#c47f5a] text-white flex items-center justify-center text-sm font-medium border-2 border-background">
                  M
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <Link to="#" className="font-medium text-[14px] text-text-primary hover:underline">
                  Haruki Tanaka & Mei Yoshida
                </Link>
                <span className="text-text-secondary hidden md:inline">·</span>
                <span className="text-text-secondary w-full md:w-auto">March 14, 2025</span>
                <span className="text-text-secondary hidden md:inline">·</span>
                <span className="text-text-tertiary">12 min read</span>
              </div>
            </div>

            <div className="mt-7 relative w-screen md:w-full -ml-4 md:ml-0 md:rounded-[8px] overflow-hidden">
              <div className="aspect-video w-full bg-subtle-bg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1706076463257-20b41d9519f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllcmVuJTIwYW5pbWUlMjBzY3JlZW5zaG90fGVufDF8fHx8MTc4MTMzMzMyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Frieren with white hair and pointed ears surrounded by magical sparkles"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-4 md:px-0">
                <div className="text-right text-[11px] text-text-tertiary mt-1.5 italic">
                  © Madhouse / Frieren: Beyond Journey's End, Episode 4
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {["Frieren", "Animation Analysis", "Madhouse", "2023 Fall", "Seinen"].map(tag => (
                <span key={tag} className="flex-shrink-0 px-2.5 py-1 rounded-full bg-subtle-bg text-text-secondary text-[11px] font-medium border border-border-default whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Post Body Container - Limited to 68ch */}
          <div className="max-w-[68ch] mx-auto text-[16px] md:text-[17.5px] leading-[1.75] md:leading-[1.8] font-serif text-text-primary">
            
            <p className="mb-[1.2em]">
              What makes Frieren so visually striking is not any single technical achievement, but rather a sustained philosophy about what anime can communicate without dialogue. Director Atsushi Ookubo and animation supervisor Reiko Nagasawa have built a visual language around negative space — the emptiness between characters, the pause before a spell is cast, the moment after it resolves.
            </p>

            <p className="mb-[1.2em]">
              In most action-oriented fantasy anime, magic functions as a visual spectacle. Explosions, light beams, elaborate transformation sequences. The audience measures quality by density — how much is happening per second. Frieren inverts this entirely. Its most significant magical moments are often the quietest ones. A flower blooming in an instant. A flame dying on a fingertip. The choice to show these events at a pace that respects their duration rather than dramatizing them is, in itself, a directorial statement.
            </p>

            <p className="mb-[1.2em]">
              This approach descends directly from Yoshiyuki Tomino's work on early Gundam, filtered through the quieter sensibilities of Satoshi Kon and later Masaaki Yuasa. What Ookubo adds is a kind of temporal honesty — a willingness to let real time pass on screen without filling it with incident. It is an act of trust in the audience, and in the medium itself.
            </p>

            <h2 className="font-sans text-[22px] font-bold mt-[2.5em] mb-[0.6em] text-text-primary border-l-[3px] border-accent pl-[14px]">
              The Problem with Conventional Anime Pacing
            </h2>

            <p className="mb-[1.2em]">
              When we discuss pacing, we typically mean plot momentum. But structural pacing within an episode—the rhythm of shots—dictates emotion far more directly. Frieren slows the internal clock.
            </p>

            <blockquote className="my-8 border-l-[3px] border-border-strong bg-subtle-bg rounded-r-[4px] py-4 px-4 md:px-5">
              <p className="font-serif italic text-[16px] leading-[1.7] text-text-secondary mb-3">
                "Animation is not about drawing things that move. It is about drawing the space between movements — the invisible architecture of time itself. Frieren understands this in a way few productions have."
              </p>
              <footer className="font-sans text-[12px] text-text-tertiary not-italic">
                — Sakuga Database editorial, November 2023
              </footer>
            </blockquote>

            <h3 className="font-sans text-[17px] font-semibold mt-[2em] mb-[0.4em] text-text-primary">
              The 10-Year Time Skip
            </h3>

            <p className="mb-[1.2em]">
              Observe how the passage of time is handled visually. A decade can pass in the space of a single dissolve, emphasizing the elf's perception of eternity.
            </p>

            {/* Inline Image */}
            <figure className="w-full my-[2em] w-screen md:w-full -ml-4 md:ml-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1569154076682-4c0466623ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMHNrZXRjaCUyMGFuaW1hdGlvbiUyMGZyYW1lfGVufDF8fHx8MTc4MTMzMzMzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Animation sketch comparison"
                className="w-full object-cover md:rounded-[4px]"
              />
              <figcaption className="px-4 md:px-0 text-center text-[12px] font-sans italic text-text-tertiary mt-2">
                Key animation frame (left) vs. final composite (right) — Episode 4, cut 47. Animation by Reiko Nagasawa.
              </figcaption>
            </figure>

            <p className="mb-[1.2em]">
              The smears and deliberate lack of detail during rapid motion create a visceral sense of speed that pristine, detailed drawings simply cannot capture.
            </p>

            {/* Animated Panel Image */}
            <figure className="w-full my-[2em] w-screen md:w-full -ml-4 md:ml-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1603786420263-ad59136a7409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMG1vdGlvbiUyMGJsdXIlMjBzbWVhcnxlbnwxfHx8fDE3ODEzMzMzMzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Smear frame action"
                className="w-full object-cover md:rounded-[4px]"
              />
              <figcaption className="px-4 md:px-0 text-center text-[12px] font-sans italic text-text-tertiary mt-2">
                A smear frame from episode 28's climactic sequence. The distortion here is intentional — note how the arm extends beyond anatomical possibility to communicate velocity.
              </figcaption>
            </figure>

            <h3 className="font-sans text-[17px] font-semibold mt-[2em] mb-[0.4em] text-text-primary">
              Comparing Directorial Approaches
            </h3>

            <p className="mb-[1.2em]">
              To understand the density of this production, we can break down the staff allocation across key episodes:
            </p>

            <div className="font-mono text-[13px] leading-[1.6] text-text-primary bg-subtle-bg border border-border-default rounded-[6px] p-4 md:px-5 md:py-4 my-[1.5em] overflow-x-auto">
<pre><code>{`Episode 01 — "Sunrise Castle"
  Director: Atsushi Ookubo
  Animation Director: Reiko Nagasawa
  Key Animation: Takashi Kojima, Sayo Yamamoto
  Notable cuts: 14, 47, 103

Episode 04 — "The First Step"  ← high sakuga density
  Director: Atsushi Ookubo
  Animation Director: Reiko Nagasawa, Taro Ikegami
  Key Animation: Nana Yamazaki, Hiroshi Seko (9 cuts)
  Notable cuts: 8, 22, 55, 78, 91`}</code></pre>
            </div>

            <hr className="w-[40%] mx-auto my-[2.5em] border-t border-border-default" />

            <p className="mb-[1.2em]">
              By stepping back and allowing moments of quiet reflection, the animators provide weight to the spells and emotional heft to the character interactions.
            </p>

            <p className="mb-[1.2em]">
              This subtle mastery of timing ensures that when the spectacle finally arrives, it hits with the force of a revelation. The silent spaces are the canvas on which the magic is painted.
            </p>

          </div>

          {/* Author Bio */}
          <div className="mt-12 md:mt-16 border border-border-default bg-subtle-bg rounded-[8px] p-5 md:p-6 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5">
            <div className="w-14 h-14 rounded-full bg-[#2d6e7e] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              H
            </div>
            <div>
              <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-1">
                Written by
              </div>
              <Link to="#" className="text-[16px] font-bold text-text-primary hover:underline block mb-2">
                Haruki Tanaka
              </Link>
              <p className="text-[13px] text-text-secondary leading-[1.6] mb-3">
                Haruki has been writing about anime production for eight years. He specializes in animation direction and the technical craft behind contemporary sakuga culture. Previously at Sakuga Database and Anime News Network.
              </p>
              <Link to="#" className="text-[13px] text-accent hover:underline font-medium">
                View all posts →
              </Link>
            </div>
          </div>

          {/* Comments Section */}
          <section className="mt-12">
            <h2 className="text-[20px] font-bold font-sans text-text-primary mb-1">Comments</h2>
            <div className="text-[14px] font-sans text-text-secondary mb-6">24 comments</div>

            {/* Comment Form */}
            <div className="mb-10 font-sans">
              <h3 className="text-[14px] font-semibold mb-4 text-text-primary">Leave a comment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-text-primary">Name *</label>
                  <input type="text" className="w-full h-10 border border-border-strong rounded-[5px] px-3 text-[14px] bg-transparent outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-text-primary">Email *</label>
                  <input type="email" className="w-full h-10 border border-border-strong rounded-[5px] px-3 text-[14px] bg-transparent outline-none focus:border-accent" />
                  <div className="text-[11px] text-text-tertiary mt-1">Not shown publicly</div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-text-primary">Comment *</label>
                <textarea className="w-full h-[120px] border border-border-strong rounded-[5px] p-3 text-[14px] bg-transparent outline-none focus:border-accent resize-y"></textarea>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer">
                  <input type="checkbox" className="rounded border-border-strong" />
                  Notify me by email when someone replies
                </label>
                <button className="h-[38px] px-5 bg-button-bg text-button-text font-semibold text-[13px] rounded-[5px] hover:opacity-90">
                  Post comment
                </button>
              </div>
            </div>

            {/* Comment List */}
            <div className="flex flex-col gap-6 font-sans">
              
              {/* Top Level Comment 1 */}
              <div>
                <div className="flex gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#4a6fa5] text-white flex justify-center items-center text-sm font-medium shrink-0">S</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-text-primary">Sora K.</span>
                      <span className="text-[12px] text-text-tertiary">2 hours ago</span>
                    </div>
                    <p className="text-[14px] text-text-secondary leading-[1.6] mt-1">
                      This is exactly the kind of analysis I've been waiting for. The point about negative space is so important — I never had the vocabulary for it but I felt it in every episode.
                    </p>
                    <button className="text-[12px] text-text-tertiary hover:text-text-primary font-medium mt-2">Reply</button>
                  </div>
                </div>

                {/* Reply */}
                <div className="ml-[20px] md:ml-[40px] pl-4 md:pl-0 mt-4 md:border-l-0 border-l border-border-default">
                  <div className="flex gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#4a7c59] text-white flex justify-center items-center text-[12px] font-medium shrink-0">R</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-text-primary">Ren F.</span>
                        <span className="text-[12px] text-text-tertiary">1 hour ago</span>
                      </div>
                      <p className="text-[14px] text-text-secondary leading-[1.6] mt-1">
                        The comparison to Tomino is interesting but I'd push back slightly — Ookubo's sensibility feels more specifically indebted to Dezaki than early Gundam. The postcard memory effect appears twice in episode 3 alone.
                      </p>
                      <button className="text-[12px] text-text-tertiary hover:text-text-primary font-medium mt-2">Reply</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Level Comment 2 */}
              <div className="pt-4 border-t border-border-default">
                <div className="flex gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#7b5ea7] text-white flex justify-center items-center text-sm font-medium shrink-0">Y</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-text-primary">Yuki I.</span>
                      <span className="text-[12px] text-text-tertiary">Yesterday</span>
                    </div>
                    <p className="text-[14px] text-text-secondary leading-[1.6] mt-1">
                      Beautifully written. One addition worth mentioning — the sound design complements this perfectly. Every silence in Frieren is acoustically shaped, not just the absence of sound.
                    </p>
                    <button className="text-[12px] text-text-tertiary hover:text-text-primary font-medium mt-2">Reply</button>
                  </div>
                </div>
              </div>

              {/* Top Level Comment 3 */}
              <div className="pt-4 border-t border-border-default">
                <div className="flex gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#c47f5a] text-white flex justify-center items-center text-sm font-medium shrink-0">M</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-text-primary">Mei Y.</span>
                      <span className="text-[12px] text-text-tertiary">3 days ago</span>
                    </div>
                    <p className="text-[14px] text-text-secondary leading-[1.6] mt-1">
                      As someone who worked in animation production briefly, the analysis of the key animation credits in episode 4 is spot-on. What you didn't mention is that several of those cuts were done on 3s rather than 2s — which paradoxically makes them feel more fluid, not less.
                    </p>
                    <button className="text-[12px] text-text-tertiary hover:text-text-primary font-medium mt-2">Reply</button>
                  </div>
                </div>

                {/* Replies */}
                <div className="ml-[20px] md:ml-[40px] pl-4 md:pl-0 mt-4 border-l border-border-default md:border-l-0 flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#2d6e7e] text-white flex justify-center items-center text-[12px] font-medium shrink-0">K</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-text-primary">K.T.</span>
                        <span className="text-[12px] text-text-tertiary">3 days ago</span>
                      </div>
                      <p className="text-[14px] text-text-secondary leading-[1.6] mt-1">
                        This is a great point. Animating on 3s requires much more deliberate planning per frame.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#2d6e7e] text-white flex justify-center items-center text-[12px] font-medium shrink-0">H</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-text-primary">Haruki Tanaka</span>
                        <span className="text-[10px] font-semibold bg-accent/15 text-accent border border-accent/30 px-1.5 py-0.5 rounded-[3px]">Author</span>
                        <span className="text-[12px] text-text-tertiary">2 days ago</span>
                      </div>
                      <p className="text-[14px] text-text-secondary leading-[1.6] mt-1">
                        Thank you Mei — you're completely right, I touched on it briefly but it deserved its own section. Consider this a preview of a follow-up piece specifically on frame rate decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </article>

        {/* Desktop Table of Contents */}
        <aside className="hidden xl:block w-[200px] shrink-0">
          <div className="sticky top-[80px]">
            <h4 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-tertiary mb-3 font-sans">
              Contents
            </h4>
            <nav className="flex flex-col relative font-sans">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border-default"></div>
              
              <a href="#" className="py-1.5 text-[13px] text-accent font-medium pl-2 relative flex items-center transition-colors">
                <div className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-accent"></div>
                The Problem with Conventional Anime Pacing
              </a>
              
              <a href="#" className="py-1.5 text-[13px] text-text-secondary hover:text-text-primary pl-2 transition-colors">
                How Frieren Reframes Time
              </a>
              
              <a href="#" className="py-1.5 text-[12px] text-text-tertiary hover:text-text-primary pl-5 transition-colors">
                The 10-Year Time Skip
              </a>
              
              <a href="#" className="py-1.5 text-[12px] text-text-tertiary hover:text-text-primary pl-5 transition-colors">
                Silence as Storytelling
              </a>
              
              <a href="#" className="py-1.5 text-[13px] text-text-secondary hover:text-text-primary pl-2 transition-colors">
                Visual Metaphors and the Magic System
              </a>
              
              <a href="#" className="py-1.5 text-[13px] text-text-secondary hover:text-text-primary pl-2 transition-colors">
                Comparing Directorial Approaches
              </a>
              
              <a href="#" className="py-1.5 text-[13px] text-text-secondary hover:text-text-primary pl-2 transition-colors">
                Why This Matters for the Medium
              </a>
            </nav>
          </div>
        </aside>

      </div>
    </div>
  );
}