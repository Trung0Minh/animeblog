import { useState } from "react";
import { Link } from "react-router";
import { 
  ArrowLeft, Loader2, Check, AlertTriangle, 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Minus,
  Image as ImageIcon, Video, EyeOff, Braces, ChevronUp, Camera, Plus, X
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Editor() {
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saved");
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex flex-col">
      {/* Editor Top Bar */}
      <header className="h-[48px] border-b border-border-default bg-background fixed top-0 left-0 right-0 z-[100] px-5 flex items-center justify-between">
        {/* Left */}
        <Link to="/" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[13px] font-medium hidden md:inline">Dashboard</span>
        </Link>

        {/* Center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
          <div className="flex items-center gap-1.5 w-[70px] justify-end">
            {saveState === "saving" && (
              <>
                <Loader2 className="w-3 h-3 text-text-tertiary animate-spin" />
                <span className="text-[12px] text-text-tertiary">Saving...</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="w-3 h-3 text-[#4caf50]" />
                <span className="text-[12px] text-[#4caf50]">Saved</span>
              </>
            )}
            {saveState === "error" && (
              <>
                <AlertTriangle className="w-3 h-3 text-accent" />
                <span className="text-[12px] text-accent">Save failed</span>
              </>
            )}
          </div>
          
          <div className="w-px h-4 bg-border-default mx-3 hidden md:block"></div>
          
          <div className="text-[13px] text-text-tertiary max-w-[280px] truncate hidden md:block">
            The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="h-8 px-2 md:px-3.5 border border-border-default rounded-[5px] text-[13px] font-medium text-text-primary hover:bg-subtle-bg transition-colors">
            <span className="hidden md:inline">Save draft</span>
            <span className="inline md:hidden">Draft</span>
          </button>
          <button className="h-8 px-3.5 bg-button-bg text-button-text rounded-[5px] text-[13px] font-semibold hover:opacity-85 transition-opacity">
            Publish
          </button>
        </div>
      </header>

      {/* Scrollable Writing Area */}
      <main className="flex-1 mt-[48px] mb-[44px] overflow-y-auto bg-background">
        <div className="w-full max-w-[760px] mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-[120px]">
          
          {/* Writing Canvas */}
          <div className="w-full md:border md:border-border-default md:rounded-[8px] md:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] dark:md:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)] md:px-10 md:pt-9 md:pb-12 bg-background relative">
            
            {/* Toolbar */}
            <div className="sticky top-0 md:-mt-9 md:pt-4 md:pb-2 md:mb-6 z-10 bg-background md:border-b md:border-border-default/50 flex items-center flex-wrap gap-0.5 overflow-x-auto no-scrollbar">
              {/* Group 1 */}
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary bg-subtle-bg/70 text-text-primary">
                <Bold className="w-[15px] h-[15px]" strokeWidth={2.5} />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary">
                <Italic className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden sm:flex">
                <Strikethrough className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden sm:flex">
                <Code className="w-[15px] h-[15px]" />
              </button>

              <div className="w-px h-4 bg-border-default mx-1 hidden sm:block"></div>

              {/* Group 2 */}
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary bg-subtle-bg/70 text-text-primary">
                <span className="text-[14px] font-bold">H<sub className="text-[10px]">2</sub></span>
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary">
                <span className="text-[14px] font-bold">H<sub className="text-[10px]">3</sub></span>
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden sm:flex">
                <span className="text-[14px] font-bold">H<sub className="text-[10px]">4</sub></span>
              </button>

              <div className="w-px h-4 bg-border-default mx-1 hidden sm:block"></div>

              {/* Group 3 */}
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary">
                <List className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden sm:flex">
                <ListOrdered className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary">
                <Quote className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden sm:flex">
                <Minus className="w-[15px] h-[15px]" />
              </button>

              <div className="w-px h-4 bg-border-default mx-1 hidden sm:block"></div>

              {/* Group 4 */}
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary">
                <ImageIcon className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden sm:flex">
                <Video className="w-[15px] h-[15px]" />
              </button>

              <div className="w-px h-4 bg-border-default mx-1 hidden sm:block"></div>

              {/* Group 5 */}
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden md:flex">
                <EyeOff className="w-[15px] h-[15px]" />
              </button>
              <button className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary hidden md:flex">
                <Braces className="w-[15px] h-[15px]" />
              </button>
            </div>

            {/* Title Input */}
            <div className="mt-4 md:mt-0 pb-2">
              <input 
                type="text" 
                placeholder="Post title..." 
                className="w-full text-[22px] md:text-[28px] font-bold text-text-primary leading-[1.2] bg-transparent outline-none placeholder:text-text-tertiary placeholder:font-normal"
                defaultValue="The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes"
              />
            </div>

            {/* Excerpt Input */}
            <div className="pb-4">
              <textarea 
                placeholder="Short excerpt (optional)..."
                className="w-full text-[15px] text-text-secondary bg-transparent outline-none resize-none placeholder:text-text-tertiary h-[48px]"
                defaultValue="MAPPA's approach to sound in Chainsaw Man represents a complete rethinking of how anime uses audio to convey physical violence..."
              />
            </div>

            <div className="w-full h-px bg-border-default mt-1 mb-6"></div>

            {/* Tiptap Content Area Mock */}
            <div className="min-h-[400px] text-[16px] md:text-[17px] font-serif leading-[1.65] text-text-primary outline-none focus:outline-none">
              <h2 className="font-sans text-[22px] font-bold mt-[1.5em] mb-[0.6em] border-l-[3px] border-accent pl-[14px]">
                The Architecture of Silence
              </h2>
              
              <p className="mb-[1.2em]">
                Most anime sound design works by filling every moment. Fight scenes are dense with impact sounds, whooshes, and musical punctuation. The silence between hits exists only as breath before the next sound event.
              </p>

              <p className="mb-[1.2em]">
                Chainsaw Man director Ryuu Nakayama made a radical decision with sound designer Tatsuya Yamamoto: the moments of most extreme violence would often carry the least sound. The scene in episode three where... <span className="inline-block w-[2px] h-[18px] bg-accent align-middle animate-pulse"></span>
              </p>

              <blockquote className="my-8 border-l-[3px] border-border-strong bg-subtle-bg rounded-r-[4px] py-4 px-5">
                <p className="font-serif italic text-[16px] leading-[1.7] text-text-secondary mb-2">
                  "We wanted the audience to feel what silence sounds like after something terrible. Not dramatic silence — accidental silence. The sound of shock."
                </p>
                <footer className="font-sans text-[12px] text-text-tertiary">
                  — Tatsuya Yamamoto, sound designer
                </footer>
              </blockquote>

              <p className="mb-[1.2em]">
                This philosophy extends to the musical score by Kensuke Ushio, who is best known for his ambient work on A Silent Voice and Devilman Crybaby. Where those scores used silence as meditation, Chainsaw Man uses it as threat.
              </p>

              <figure className="w-full my-8">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1677143016687-8dbb7e71db08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZHJhbWF0aWMlMjBhbmltZSUyMHN0eWxlJTIwY2hhaW5zYXd8ZW58MXx8fHwxNzgxMzMzNDg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Chainsaw Man dark scene"
                  className="w-full object-cover rounded-[4px]"
                />
                <figcaption className="text-center text-[12px] font-sans italic text-text-tertiary mt-2">
                  Episode 3, the confrontation scene. Note the complete absence of score during this 47-second sequence.
                </figcaption>
              </figure>

              <h3 className="font-sans text-[17px] font-semibold mt-[2em] mb-[0.4em]">
                The Impact Sound Philosophy
              </h3>
            </div>
            
          </div>
          
          <div className="mt-4 text-right text-[11px] text-text-tertiary">
            3,847 characters
          </div>

        </div>
      </main>

      {/* Post Settings Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border-default shadow-[0_-4px_12px_rgba(0,0,0,0.05)] transition-all">
        {/* Collapsed State */}
        {!settingsExpanded ? (
          <div 
            className="h-[44px] flex items-center justify-center cursor-pointer hover:bg-subtle-bg group transition-colors"
            onClick={() => setSettingsExpanded(true)}
          >
            <div className="flex items-center gap-2 text-text-tertiary group-hover:text-text-secondary">
              <ChevronUp className="w-[13px] h-[13px]" />
              <span className="text-[12px]">Post settings — cover, category, tags, co-authors</span>
            </div>
          </div>
        ) : (
          /* Expanded State */
          <div className="w-full max-h-[80vh] overflow-y-auto">
            <div className="max-w-[760px] mx-auto p-5 md:p-6 relative">
              <button 
                onClick={() => setSettingsExpanded(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-subtle-bg text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row gap-8 mt-2">
                {/* Left Column - Cover Image */}
                <div className="flex-1">
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2.5">Cover image</label>
                  
                  {!coverImage ? (
                    <div 
                      className="aspect-video w-full border-[1.5px] border-dashed border-border-strong rounded-[8px] bg-subtle-bg flex flex-col items-center justify-center cursor-pointer hover:border-text-secondary hover:bg-border-default/30 transition-colors"
                      onClick={() => setCoverImage("https://images.unsplash.com/photo-1677143016687-8dbb7e71db08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZHJhbWF0aWMlMjBhbmltZSUyMHN0eWxlJTIwY2hhaW5zYXd8ZW58MXx8fHwxNzgxMzMzNDg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral")}
                    >
                      <ImageIcon className="w-6 h-6 text-text-tertiary" />
                      <span className="text-[13px] text-text-secondary mt-2">Add cover image</span>
                      <span className="text-[11px] text-text-tertiary mt-1">JPG, PNG, GIF, WebP · Max 10MB</span>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-[8px] overflow-hidden relative group cursor-pointer">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                        <Camera className="w-6 h-6 text-white mb-2" />
                        <span className="text-[13px] font-medium text-white">Change</span>
                      </div>
                      <button 
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black"
                        onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column - Metadata fields */}
                <div className="flex-1 flex flex-col gap-5">
                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary mb-2">Category</label>
                    <select className="w-full h-[36px] border border-border-default rounded-[5px] px-2.5 text-[13px] bg-transparent outline-none focus:border-accent appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b6b6b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center]">
                      <option>Animation Analysis</option>
                      <option>Reviews</option>
                      <option>Essays</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {["Chainsaw Man", "Sound Design", "MAPPA"].map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-subtle-bg text-text-secondary text-[13px] border border-border-default">
                          {tag}
                          <button className="text-text-tertiary hover:text-text-primary"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search or create tags..." 
                      className="w-full h-[34px] border border-border-default rounded-[5px] px-2.5 text-[13px] bg-transparent outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary mb-2">Co-authors</label>
                    <div className="flex items-center gap-2 mb-2 p-1.5 border border-border-default rounded-[5px] w-fit">
                      <div className="w-6 h-6 rounded-full bg-[#7b5ea7] text-white flex items-center justify-center text-[11px] font-medium">Y</div>
                      <span className="text-[13px] text-text-secondary pr-2">Yuki Ishikawa</span>
                      <button className="text-text-tertiary hover:text-text-primary pr-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add co-author..." 
                      className="w-full h-[34px] border border-border-default rounded-[5px] px-2.5 text-[13px] bg-transparent outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary mb-2">Draft visibility</label>
                    <div className="flex gap-2">
                      <button className="h-[34px] px-4 rounded-[5px] bg-text-primary text-background text-[13px] font-medium flex items-center gap-2">
                        <span>🔒</span> Private
                      </button>
                      <button className="h-[34px] px-4 rounded-[5px] border border-border-default text-text-primary text-[13px] font-medium flex items-center gap-2 hover:bg-subtle-bg transition-colors">
                        <span>👥</span> Visible to co-authors
                      </button>
                    </div>
                    <p className="text-[11px] italic text-text-tertiary mt-2">Only you and admins can see this draft.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}