import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    id: "spot",
    title: "Spot Trading",
    description: "Trade over 100+ crypto pairs with zero fees and lightning-fast execution.",
    iconProps: { x: 25, y: 25, scale: 180 },
    color: "from-emerald-500/20 to-emerald-900/40",
    accent: "text-emerald-400",
    link: "/app/spot",
    image: "/slide-spot.jpg"
  },
  {
    id: "futures",
    title: "Futures Pro",
    description: "Maximize your potential with up to 125x leverage and advanced AI risk management systems.",
    iconProps: { x: 75, y: 25, scale: 180 },
    color: "from-cyan-500/20 to-cyan-900/40",
    accent: "text-cyan-400",
    link: "/app/futures",
    image: "/slide-futures.jpg"
  },
  {
    id: "earn",
    title: "Earn & Stake",
    description: "Put your idle assets to work. Earn up to 14% APR with our dual staking protocols.",
    iconProps: { x: 25, y: 75, scale: 180 },
    color: "from-blue-500/20 to-blue-900/40",
    accent: "text-blue-400",
    link: "/app/earn",
    image: "/slide-earn.jpg"
  },
  {
    id: "assets",
    title: "Asset Management",
    description: "A unified dashboard to track, deposit, and withdraw your global portfolio securely.",
    iconProps: { x: 75, y: 75, scale: 180 },
    color: "from-purple-500/20 to-purple-900/40",
    accent: "text-purple-400",
    link: "/app/assets",
    image: "/security-vault.jpg"
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "Our expert team is always here to help you navigate the world of digital finance.",
    iconProps: { x: 50, y: 50, scale: 180 },
    color: "from-rose-500/20 to-rose-900/40",
    accent: "text-rose-400",
    link: "/app/home",
    image: "/slide-support.jpg"
  }
];

const BannerSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full px-0 sm:px-4 py-2">
      <div className="relative rounded-none sm:rounded-2xl overflow-hidden group border border-border bg-background">
        {/* Slides */}
        <div className="relative aspect-[16/9] md:aspect-[3/1] overflow-hidden">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out z-0 ${
                i === current ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt=""
                  className="w-full h-full object-cover opacity-10 grayscale"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              </div>
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-center px-8 md:px-16">
                <div className={`max-w-xl transition-all duration-700 delay-300 ${i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border ${slide.accent} text-[10px] font-bold uppercase tracking-widest mb-4`}>
                    <div className={`w-2 h-2 rounded-full ${slide.accent.replace('text-', 'bg-')} animate-pulse`} />
                    {slide.title}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight leading-tight">
                    {slide.title === "Spot Trading" ? "Trade Top Cryptos" : 
                     slide.title === "Futures Pro" ? "Maximize Your Gains" :
                     slide.title === "Earn & Stake" ? "Passive Income Simplified" :
                     slide.title === "Asset Management" ? "Unified Portfolio Control" :
                     "Expert Support 24/7"}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground font-light mb-8 line-clamp-2 md:line-clamp-none max-w-md leading-relaxed">
                    {slide.description}
                  </p>
                  <button 
                    onClick={() => navigate(slide.link)}
                    className="group/btn flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-none font-medium text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/80 backdrop-blur-md text-foreground border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/80 backdrop-blur-md text-foreground border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 right-8 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerSlideshow;
