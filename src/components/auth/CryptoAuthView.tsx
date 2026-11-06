import { motion } from "motion/react";
import { Logo } from "@/components/shared/Logo";
import { AuthForm } from "./AuthForm";

export const CryptoAuthView = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-y-auto bg-background py-12 px-4">
      {/* Immersive Crypto Background */}
      <div 
        className="fixed inset-0 z-0 opacity-5 grayscale pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1644024276273-4b901946849a?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 blur-[100px] dark:opacity-10"
          style={{
            background: `
              radial-gradient(circle at 15% 20%, var(--primary) 0%, transparent 40%),
              radial-gradient(circle at 85% 80%, var(--accent) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, var(--muted) 0%, transparent 60%)
            `
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg px-2 sm:px-6 flex flex-col items-center my-auto">
        {/* Logo and Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Logo size={80} variant="SYMBOL" className="mb-4 mx-auto drop-shadow-[0_0_25px_rgba(255,191,0,0.2)]" />
          <h2 className="text-foreground text-2xl font-light tracking-[0.4em] uppercase">CrypX Pro</h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] mt-2 font-medium">Digital Assets Elite</p>
        </motion.div>

        {/* Ultra-Transparent Glassmorphic Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-border bg-card/40 backdrop-blur-[30px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.08)] transition-all"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-[32px] sm:rounded-[48px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none dark:from-white/5" />
          
          <AuthForm isInsideModal={true} />
        </motion.div>

        {/* Footer info in glass mode */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-[10px] text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap font-medium text-center"
        >
          Secured by Military-Grade Encryption & Cold Vaults
        </motion.p>
      </div>
    </div>
  );
};
