import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { newsService, NewsItem } from '@/services/news';
import { marketService } from '@/services/market';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, UserAsset } from '@/types';
import BannerSlideshow from '@/components/BannerSlideshow';
import CubeSpinner from '@/components/shared/CubeSpinner';
import {
  Bell, LogOut, Wallet, TrendingUp, EyeOff, Eye, FileText, Clock, ExternalLink,
  User, Shield, Lock, Settings, HeadphonesIcon, ChevronLeft, ChevronRight, Menu, X,
  Mail, Key, Camera, Activity, Search, ChevronDown, Smartphone,
  ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { AnimatedBalance } from '@/components/shared/AnimatedBalance';
import { SupportChatModal } from '@/components/shared/SupportChatModal';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getReferrerForUser, isUserAdmin, isPrimaryOwner } from '@/lib/adminPermissions';
import { ImageAttachmentField, ImageAttachmentValue } from '@/components/shared/ImageAttachmentField';
import { PWAPermissionsModal } from '@/components/shared/PWAPermissionsModal';
import { PWAInstallButton } from '@/components/shared/PWAInstallButton';

import futuresBannerImg from '@/assets/images/futures_hero_banner_1786696873345.jpg';
import marketBannerImg from '@/assets/images/market_hero_banner_1786696884288.jpg';
import securityBannerImg from '@/assets/images/security_hero_banner_1786696894651.jpg';
import earnBannerImg from '@/assets/images/earn_hero_banner_1786696906104.jpg';

const TOP_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'];


type ModalType = 'MENU' | 'PROFILE_DETAILS' | 'KYC' | 'SECURITY' | 'SETTINGS' | 'TERMS' | 'FAQ' | 'SUPPORT' | 'CHANGE_PASSWORD' | 'NOTIFICATIONS' | 'PERMISSIONS' | null;

interface KYCFormData {
  fullName: string;
  dateOfBirth: string;
  address: string;
  idType: string;
  idFront: ImageAttachmentValue | null;
  idBack: ImageAttachmentValue | null;
  selfie: ImageAttachmentValue | null;
}

const PromoSlideshow = ({ onOpenKyc }: { onOpenKyc?: () => void }) => {
  const navigate = useNavigate();
  const slides = [
    {
      src: futuresBannerImg,
      tag: "PERPETUAL CONTRACTS",
      title: "Futures Pro Trading",
      subtitle: "Up to 100x Leverage • Ultra-Low Latency • Deep Liquidity",
      cta: "Trade Futures",
      path: "/app/futures",
      accent: "from-emerald-500/20 via-primary/10 to-transparent",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      btnColor: "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
    },
    {
      src: marketBannerImg,
      tag: "SPOT & COMMODITIES",
      title: "Zero-Fee Spot Markets",
      subtitle: "Trade Top Cryptos, Tech Indices & Gold with Instant Settlement",
      cta: "Explore Markets",
      path: "/app/spot",
      accent: "from-blue-500/20 via-cyan-500/10 to-transparent",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      btnColor: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
    },
    {
      src: securityBannerImg,
      tag: "ACCOUNT VERIFICATION",
      title: "Bank-Grade Security & KYC",
      subtitle: "Verify ID in minutes to unlock unlimited withdrawals & VIP perks",
      cta: "Verify Now",
      path: "/app/user-home",
      isKyc: true,
      accent: "from-cyan-500/20 via-indigo-500/10 to-transparent",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      btnColor: "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20"
    },
    {
      src: earnBannerImg,
      tag: "PASSIVE CRYPTO YIELD",
      title: "CrypX Earn & Staking",
      subtitle: "Earn up to 18.5% APY with flexible terms and daily payouts",
      cta: "Start Earning",
      path: "/app/earn",
      accent: "from-amber-500/20 via-emerald-500/10 to-transparent",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      btnColor: "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
    }
  ];

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  const handleSlideClick = (slide: typeof slides[0]) => {
    if (slide.isKyc && onOpenKyc) {
      onOpenKyc();
    } else if (slide.path) {
      navigate(slide.path);
    }
  };

  return (
    <div 
      className="relative w-full aspect-[16/10] xs:aspect-[16/9] sm:aspect-[2.2/1] md:aspect-[2.5/1] max-h-[380px] overflow-hidden rounded-2xl md:rounded-3xl shadow-lg bg-[#070a10] border border-border/80 group cursor-pointer select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          onClick={() => handleSlideClick(slide)}
          className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
            i === current ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-105 z-0 pointer-events-none'
          }`}
        >
          {/* Ambient blurred backdrop for rich seamless glow */}
          <img 
            src={slide.src} 
            alt="" 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-25 pointer-events-none" 
          />

          {/* Crisp Primary Hero Banner Graphic */}
          <img 
            src={slide.src} 
            alt={slide.title} 
            referrerPolicy="no-referrer"
            className="relative w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]" 
          />

          {/* Cinematic Dark Gradient Overlay for perfect typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 sm:from-black/80 sm:via-black/40 sm:to-transparent" />

          {/* Promotional Content Overlay & CTA */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-3.5 sm:px-8 md:px-12 max-w-xl">
            {/* Tag / Category Badge */}
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className={`text-[9px] sm:text-xs font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border backdrop-blur-md ${slide.badgeColor}`}>
                {slide.tag}
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md leading-tight">
              {slide.title}
            </h2>

            {/* Promotional Subtitle / Slogan */}
            <p className="text-[11px] sm:text-sm text-slate-300 font-medium line-clamp-2 mt-0.5 sm:mt-1.5 mb-2 sm:mb-4 max-w-md drop-shadow">
              {slide.subtitle}
            </p>

            {/* Quick Access CTA Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlideClick(slide);
                }}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold shadow-md transition-all duration-200 active:scale-95 group/btn ${slide.btnColor}`}
              >
                <span>{slide.cta}</span>
                <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows (Visible on hover for desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/80 hover:bg-background backdrop-blur-md border border-white/10 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 active:scale-90 shadow-lg"
        aria-label="Previous Banner"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/80 hover:bg-background backdrop-blur-md border border-white/10 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 active:scale-90 shadow-lg"
        aria-label="Next Banner"
      >
        <ChevronRight size={20} />
      </button>

      {/* Bottom Slide Indicators */}
      <div className="absolute bottom-3 right-4 sm:right-6 flex items-center gap-1.5 z-30 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'bg-primary w-5' : 'bg-white/40 hover:bg-white/70 w-1.5'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const parseNotificationMessage = (msg: string) => {
  try {
    if (msg.startsWith('{') && msg.endsWith('}')) {
      const parsed = JSON.parse(msg);
      if (parsed && typeof parsed === 'object' && 'body' in parsed) {
        return {
          body: parsed.body as string,
          action_label: (parsed.action_label || null) as string | null,
          action_url: (parsed.action_url || null) as string | null
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return {
    body: msg,
    action_label: null,
    action_url: null
  };
};

const UserHome = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({ BTC: 89500, ETH: 4850, USDT: 1, BNB: 820, SOL: 245, XRP: 1.45 });
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [supportInfo, setSupportInfo] = useState<{ email: string; telegram: string; whatsapp: string } | null>(null);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [kycStep, setKycStep] = useState<'form' | 'upload' | 'done'>('form');
  const [isKycResubmitting, setIsKycResubmitting] = useState(false);
  const [kycForm, setKycForm] = useState<KYCFormData>({
    fullName: '', dateOfBirth: '', address: '', idType: 'passport',
    idFront: null, idBack: null, selfie: null,
  });
  const [kycUploadProgress, setKycUploadProgress] = useState('');
  const [activeTradesCount, setActiveTradesCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Lock body scroll when any modal/drawer is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeModal]);

  const fetchProfile = useCallback(async (retryCount = 0) => {
    if (!user) return;
    const maxRetries = 2;

    const randomFtid = 'FID-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const fallbackProfile = {
      id: user.id,
      email: user.email || 'user@example.com',
      username: user.email ? user.email.split('@')[0] : 'user',
      display_name: user.user_metadata?.display_name || user.user_metadata?.username || (user.email ? user.email.split('@')[0] : 'User'),
      ftid: randomFtid,
      balance: 10000,
      futures_balance: 5000,
      staked_balance: 1000,
      kyc_status: 'UNVERIFIED',
      force_win: false,
      force_loss: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const isValidUUID = (idStr: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
    if (!isValidUUID(user.id)) {
      console.warn('Invalid user UUID for profile fetch. Using fallback profile.');
      setProfile(fallbackProfile as any);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile:', error);
        if (retryCount < maxRetries) {
          setTimeout(() => fetchProfile(retryCount + 1), 1500);
        } else {
          console.warn('Max retries reached. Using fallback profile.');
          setProfile(fallbackProfile as any);
        }
      } else if (data) {
        setProfile(data as UserProfile);
      } else {
        // Profile does not exist, let's create it on the fly to support robust real Supabase connection
        console.log('Profile not found. Auto-creating profile for user:', user.id);
        
        // Try simple insert first to avoid RLS complexities with upsert
        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            username: fallbackProfile.username,
            display_name: fallbackProfile.display_name,
            ftid: fallbackProfile.ftid,
            balance: 0,
            futures_balance: 0,
            staked_balance: 0,
            kyc_status: 'UNVERIFIED',
            force_win: false,
            force_loss: false
          })
          .select()
          .maybeSingle();

        if (!insertError && insertedData) {
          setProfile(insertedData as UserProfile);
        } else if (insertError) {
          console.warn('Error auto-creating profile:', insertError.message);
          
          // If it failed because it already exists (race condition) or RLS policy (maybe row already exists)
          // try fetching it again before giving up
          const { data: retryData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (retryData) {
            console.log('Profile found on retry after insert failure.');
            setProfile(retryData as UserProfile);
            return;
          }
          
          if (retryCount < maxRetries) {
            setTimeout(() => fetchProfile(retryCount + 1), 1500);
          } else {
            console.warn('Max retries reached for profile creation. Using fallback profile.');
            setProfile(fallbackProfile as any);
          }
        }
      }
    } catch (err) {
      console.warn('Unexpected error fetching profile:', err);
      setProfile(fallbackProfile as any);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Unexpected error fetching notifications:', err);
    }
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.warn('Error marking notifications as read:', error);
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.warn('Unexpected error marking notifications as read:', err);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchProfile();
    fetchNotifications();

    // Subscribe to notifications changes
    const notificationsChannel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Check if redirecting from password reset recovery email
    const hash = window.location.hash || '';
    const shouldReset = hash.includes('action=reset_password') || sessionStorage.getItem('open_password_reset') === 'true';
    if (shouldReset) {
      sessionStorage.removeItem('open_password_reset');
      // Clear hash so it doesn't open on every refresh
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setActiveModal('CHANGE_PASSWORD');
    }
    
    // Subscribe to profile changes
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, () => {
        fetchProfile();
      })
      .subscribe();

    // Subscribe to user assets changes
    const assetsChannel = supabase
      .channel(`user-assets-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_assets', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        supabase.from('user_assets').select('*').eq('user_id', user.id).then(({ data }) => {
          if (data) setUserAssets(data as UserAsset[]);
        }).catch(() => {});
      })
      .subscribe();

    supabase.from('user_assets').select('*').eq('user_id', user.id).then(({ data, error }) => {
      if (!error && data) {
        setUserAssets(data as UserAsset[]);
      }
    }).catch(() => {});
    supabase.from('positions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'OPEN').then(({ count }) => {
      setActiveTradesCount(count || 0);
    }).catch(() => {});
    newsService.getLatestNews().then(setNews).catch(() => {});
    const fetchPrices = () => marketService.getPrices().then(setPrices).catch(() => {});
    fetchPrices();
    
    // Subscribe to live synchronous ticks from Binance WebSocket & REST feed
    const unsubscribeTickers = marketService.subscribeToAllTickers((liveUpdates) => {
      setPrices(prev => {
        const next = { ...prev };
        let changed = false;
        Object.entries(liveUpdates).forEach(([pair, data]) => {
          const sym = pair.replace('/USDT', '');
          if (next[sym] !== data.price) {
            next[sym] = data.price;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    });

    // Load per-admin support config
    const fetchSupportConfig = async () => {
      try {
        const assignedAdminId = getReferrerForUser(user?.email, user?.id) || 'OWNER';
        
        const { data, error } = await supabase.from('support_config').select('*');
        if (!error && data && data.length > 0) {
          // 1. Try relational if admin_id is present
          const matchedRow = data.find((r: any) => r.admin_id === assignedAdminId || r.adminId === assignedAdminId);
          if (matchedRow) {
            setSupportInfo(matchedRow as any);
            return;
          }

          // 2. Try global serialized row
          const globalRow = data.find((r: any) => r.email === 'global_support_configs@crypxpro.com');
          if (globalRow && globalRow.telegram) {
            try {
              const allConfigs = JSON.parse(globalRow.telegram);
              if (allConfigs[assignedAdminId]) {
                setSupportInfo(allConfigs[assignedAdminId]);
                return;
              }
            } catch (e) {
              // ignore
            }
          }

          // 3. Fallback to system default row (the first row or any row that isn't the global config row)
          const defaultRow = data.find((r: any) => r.email !== 'global_support_configs@crypxpro.com') || data[0];
          if (defaultRow) {
            setSupportInfo(defaultRow as any);
          }
        }
      } catch (err) {
        console.warn("Failed to load per-admin support configurations:", err);
      }
    };

    fetchSupportConfig();

    // Refresh prices periodically
    const priceInterval = setInterval(fetchPrices, 3000);

    return () => {
      clearInterval(priceInterval);
      unsubscribeTickers();
      supabase.removeChannel(channel);
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, loading, fetchProfile, fetchNotifications, navigate]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const uploadKYCFile = async (item: ImageAttachmentValue, docType: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return item.dataUrl;

      const fileExt = item.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${docType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const bucketName = 'kyc-documents';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, item.file, { upsert: true });

      if (error || !data) {
        console.warn('KYC Storage notice: using direct optimized image payload.');
        return item.dataUrl;
      }

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      return publicUrl || item.dataUrl;
    } catch (err) {
      console.warn('KYC Upload storage bypass, using optimized data:', err);
      return item.dataUrl;
    }
  };

  const handleKYCSubmit = async () => {
    if (!user || !profile) return;
    if (!kycForm.fullName || !kycForm.dateOfBirth || !kycForm.address) {
      toast.error('Please fill in all personal information fields.');
      return;
    }
    if (!kycForm.idFront || !kycForm.selfie) {
      toast.error('Please upload at least your ID front and selfie.');
      return;
    }
    setIsSubmittingKYC(true);

    try {
      setKycUploadProgress('Uploading ID front...');
      const idFrontUrl = await uploadKYCFile(kycForm.idFront, 'id_front');

      let idBackUrl: string | null = null;
      if (kycForm.idBack) {
        setKycUploadProgress('Uploading ID back...');
        idBackUrl = await uploadKYCFile(kycForm.idBack, 'id_back');
      }

      setKycUploadProgress('Uploading selfie...');
      const selfieUrl = await uploadKYCFile(kycForm.selfie, 'selfie');

      setKycUploadProgress('Submitting verification request...');
      const { error: insertError } = await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        full_name: kycForm.fullName,
        date_of_birth: kycForm.dateOfBirth,
        address: kycForm.address,
        id_type: kycForm.idType,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        status: 'PENDING',
        submitted_at: new Date().toISOString()
      });

      if (insertError) {
        console.error('KYC Insert Error:', insertError);
        throw new Error(insertError.message || 'Database insert failed');
      }

      const { error: updateError } = await supabase.from('profiles').update({ kyc_status: 'PENDING' }).eq('id', user.id);
      
      if (updateError) {
        console.error('KYC Profile Update Error:', updateError);
        throw new Error(updateError.message || 'Profile update failed');
      }

      setProfile({ ...profile, kyc_status: 'PENDING' });
      setIsKycResubmitting(false);
      setKycStep('done');
      toast.success('KYC documents submitted successfully! Verification is pending review.');
    } catch (err: any) {
      console.error('Full KYC Submission Error:', err);
      toast.error('Failed to submit KYC: ' + (err.message || 'Unexpected error'));
    } finally {
      setIsSubmittingKYC(false);
      setKycUploadProgress('');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Your password has been changed successfully.");
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal('MENU');
    } catch (err: any) {
      console.error("Failed to change password", err);
      toast.error("Error changing password: " + (err.message || "Please try again."));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading || (!profile && user)) return <CubeSpinner fullScreen label="Initializing dashboard..." />;
  if (!user) return null;

  const cryptoAssetsValue = userAssets.reduce((acc, a) => {
    if (a.symbol === 'USDT') return acc;
    const value = a.amount * (prices[a.symbol] || 0);
    return acc + (value >= 0.01 ? value : 0);
  }, 0);
  const spotBalanceValue = (profile?.balance || 0) + cryptoAssetsValue;
  const totalBalance = spotBalanceValue + (profile?.futures_balance || 0) + (profile?.staked_balance || 0);

  return (
    <>
      <div className="pb-24 relative min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 pt-2.5 space-y-4">
        {/* Top Header Icons */}
        <div className="flex items-center justify-between pt-1">
          <button 
            onClick={() => setActiveModal('MENU')}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center border border-border text-foreground/70 active:scale-90 transition-transform"
          >
            <User size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => {
              setActiveModal('NOTIFICATIONS');
              markAllAsRead();
            }}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center border border-border text-foreground/70 relative active:scale-90 transition-transform"
            title="Notifications"
          >
            <Bell size={20} strokeWidth={2.5} />
            {notifications.some(n => !n.is_read) && (
              <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-sm animate-pulse" />
            )}
          </button>
        </div>

        {/* PWA In-App Install Prompt */}
        <PWAInstallButton variant="banner" />

        {/* Promotional Slideshow */}
        <div className="pt-1">
          <PromoSlideshow onOpenKyc={() => setActiveModal('KYC')} />
        </div>

        {/* Global Portfolio Balance Overview */}
        <div className="bg-card p-5 rounded-3xl border border-border mt-0.5 shadow-sm relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer" onClick={() => navigate('/app/assets')}>
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Wallet size={120} /></div>
           <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Activity size={16} /></div>
                 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Portfolio Assets</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setBalanceHidden(!balanceHidden); }}
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
              >
                {balanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
           </div>
           <div className="relative z-10">
              <h1 className="text-3xl font-black text-foreground font-mono tracking-tighter mb-1">
                 <AnimatedBalance value={`$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} hidden={balanceHidden} />
              </h1>
              <div className="flex items-center gap-4 mt-3">
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500">+$124.52 (4.12%)</span>
                 </div>
                 <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Market Live
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-3 pt-0.5">
          {[
            { label: 'Deposit', icon: ArrowDownToLine, color: 'text-emerald-500', action: () => navigate('/app/assets') },
            { label: 'Withdraw', icon: ArrowUpFromLine, color: 'text-rose-500', action: () => navigate('/app/assets') },
            { label: 'Transfer', icon: ArrowRightLeft, color: 'text-primary', action: () => navigate('/app/assets') },
            { label: 'Support', icon: HeadphonesIcon, color: 'text-muted-foreground', action: () => setIsChatOpen(true) },
          ].map((act, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={act.action}>
              <div className="w-12 h-12 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center transition-all group-active:scale-90 group-hover:bg-accent">
                 <act.icon size={22} className={act.color} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">{act.label}</span>
            </div>
          ))}
        </div>

        {/* Asset Allocation */}
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4">Asset Allocation</h2>
          <div className="flex items-center gap-4">
            <div className="w-[120px] h-[120px] shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={[
                       { name: 'Spot', value: spotBalanceValue || 0, color: '#3b82f6' },
                       { name: 'Futures', value: profile?.futures_balance || 0, color: '#8b5cf6' },
                       { name: 'Earn', value: profile?.staked_balance || 0, color: '#10b981' }
                     ].filter(d => d.value > 0).length > 0 ? [
                       { name: 'Spot', value: spotBalanceValue || 0, color: '#3b82f6' },
                       { name: 'Futures', value: profile?.futures_balance || 0, color: '#8b5cf6' },
                       { name: 'Earn', value: profile?.staked_balance || 0, color: '#10b981' }
                     ].filter(d => d.value > 0) : [{ name: 'Empty', value: 1, color: '#3f3f46' }]}
                     dataKey="value"
                     nameKey="name"
                     cx="50%"
                     cy="50%"
                     innerRadius={45}
                     outerRadius={60}
                     stroke="none"
                     isAnimationActive={false}
                   >
                     {([
                       { name: 'Spot', value: spotBalanceValue || 0, color: '#3b82f6' },
                       { name: 'Futures', value: profile?.futures_balance || 0, color: '#8b5cf6' },
                       { name: 'Earn', value: profile?.staked_balance || 0, color: '#10b981' }
                     ].filter(d => d.value > 0).length > 0 ? [
                       { name: 'Spot', value: spotBalanceValue || 0, color: '#3b82f6' },
                       { name: 'Futures', value: profile?.futures_balance || 0, color: '#8b5cf6' },
                       { name: 'Earn', value: profile?.staked_balance || 0, color: '#10b981' }
                     ].filter(d => d.value > 0) : [{ name: 'Empty', value: 1, color: '#3f3f46' }]).map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#050505', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                     itemStyle={{ color: '#fff' }}
                     formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                   />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-3">
               {[
                 { name: 'Spot', value: spotBalanceValue || 0, color: 'bg-blue-500' },
                 { name: 'Futures', value: profile?.futures_balance || 0, color: 'bg-violet-500' },
                 { name: 'Earn', value: profile?.staked_balance || 0, color: 'bg-emerald-500' }
               ].map(item => (
                 <div key={item.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${item.color}`} />
                     <span className="text-xs text-muted-foreground font-bold">{item.name}</span>
                   </div>
                   <span className="text-xs font-bold text-foreground font-mono">
                     ${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                   </span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Top Movers Cards */}
        <div className="grid grid-cols-2 gap-2.5">
           {[
             { symbol: 'BTC', cat: 'Crypto', price: prices['BTC'] || 97000, change: -2.42 },
             { symbol: 'PRO', cat: 'Listed', price: 806.00, change: 11.17 },
             { symbol: 'PONKE', cat: 'Meme', price: 0.0421, change: 25.16 },
             { symbol: 'Gold', cat: 'Metal', price: 4539.11, change: -2.50 },
           ].map((item, i) => (
             <div key={i} className="bg-card p-2.5 rounded-xl border border-border flex flex-col justify-between h-24 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-foreground text-[11px] truncate">{item.symbol}</span>
                      <span className="text-[7.5px] text-muted-foreground font-bold uppercase tracking-tight">{item.cat}</span>
                    </div>
                    <div className="space-y-0.5">
                       <div className="font-bold text-foreground text-[13px] font-mono">{item.price.toLocaleString(undefined, { minimumFractionDigits: item.price < 1 ? 4 : 2 })}</div>
                       <div className={`text-[9px] font-bold ${item.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{item.change > 0 ? '+' : ''}{item.change}%</div>
                    </div>
                  </div>
                  <div className={`w-8 h-4 ${item.change >= 0 ? 'text-emerald-500/30' : 'text-rose-500/30'}`}>
                     <TrendingUp size={18} className={`${item.change < 0 ? 'rotate-180' : ''}`} />
                  </div>
                </div>
             </div>
           ))}
        </div>

        {/* Market List Tabs Sub-section */}
        <div className="space-y-3 pb-8">
           <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-1">
              {['Favorites', 'Spot', 'Futures', 'TradFi'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => {
                    if (tab === 'Spot') navigate('/app/spot');
                    else if (tab === 'Futures') navigate('/app/futures');
                    else if (tab === 'TradFi') navigate('/app/trade-fi');
                  }}
                  className={`text-base font-bold whitespace-nowrap relative ${tab === 'Favorites' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {tab}
                  {tab === 'Favorites' && (
                    <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-primary rounded-full transition-all" />
                  )}
                </button>
              ))}
           </div>

           <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tight py-2 border-b border-border/50">
              <div className="flex items-center gap-1">Coin/Volume <ChevronDown size={10} /></div>
              <div className="flex items-center gap-8 pr-2">
                <div className="flex items-center gap-1">Price <ChevronDown size={10} /></div>
                <div className="flex items-center gap-1">Change <ChevronDown size={10} /></div>
              </div>
           </div>

           <div className="divide-y divide-border/50">
             {TOP_SYMBOLS.map(symbol => {
               const price = prices[symbol.replace('USDT', '')] || prices['BTC'];
               const change = (Math.random() * 5 - 2).toFixed(2);
               const isUp = Number(change) >= 0;
               return (
                 <div key={symbol} className="py-4 flex items-center justify-between" onClick={() => navigate('/app/trade-fi?tab=spot')}>
                    <div className="flex items-center gap-3">
                       <CryptoIcon symbol={symbol.replace('USDT', '')} size={32} />
                       <div>
                          <div className="flex items-center gap-1">
                             <span className="font-bold text-foreground text-sm">{symbol}</span>
                             <span className="bg-muted text-muted-foreground text-[8px] font-bold px-1 rounded uppercase">Perp</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">{(Math.random() * 5).toFixed(2)}B</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <div className="text-sm font-bold text-foreground font-mono">{price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-muted-foreground font-bold font-mono">${(price * 0.999).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                       </div>
                       <div className={`w-20 py-2 rounded-lg text-white font-bold text-xs text-center ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {isUp ? '+' : ''}{change}%
                       </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>

    {/* ============ SIDE MENU DRAWER ============ */}
      {activeModal === 'MENU' && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm overflow-hidden" onClick={() => setActiveModal(null)}>
          <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-xs bg-background shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground rounded-br-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={120} /></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center shadow-inner overflow-hidden">
                  <Logo size={40} variant="SYMBOL" />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">{profile.username || profile.display_name}</h2>
                  <p className="text-primary-foreground/70 text-xs">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-mono border border-white/10">ID: {profile.ftid}</div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                  profile.kyc_status === 'VERIFIED' ? 'bg-green-500/20 border-green-400/30' :
                  profile.kyc_status === 'PENDING' ? 'bg-yellow-500/20 border-yellow-400/30' :
                  'bg-red-500/20 border-red-400/30'
                }`}>
                  <Shield size={10} /> {profile.kyc_status}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-card p-3 rounded-xl border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
                  <p className="font-bold text-foreground text-sm font-mono text-primary">${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">Spot balance</p>
                  <p className="font-bold text-foreground text-sm font-mono">${spotBalanceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              <p className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Account</p>
              <MenuBtn icon={User} label="My Profile" color="text-primary bg-primary/10" onClick={() => setActiveModal('PROFILE_DETAILS')} />
              <MenuBtn icon={Shield} label="Identity Verification" color="text-purple-600 bg-purple-500/10" onClick={() => { setActiveModal('KYC'); setIsKycResubmitting(false); }} />
              <MenuBtn icon={Lock} label="Security Center" color="text-teal-600 bg-teal-500/10" onClick={() => setActiveModal('SECURITY')} />

              <p className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-6">General</p>
              <MenuBtn icon={Smartphone} label="App & Device Permissions" color="text-blue-600 bg-blue-500/10" onClick={() => setActiveModal('PERMISSIONS')} />
              <MenuBtn icon={Settings} label="Settings" color="text-orange-600 bg-orange-500/10" onClick={() => setActiveModal('SETTINGS')} />
              <MenuBtn icon={HeadphonesIcon} label="Help & Support" color="text-pink-600 bg-pink-500/10" onClick={() => setActiveModal('SUPPORT')} />
            </div>

            {/* Footer */}
            <div className="p-4 bg-card border-t border-border">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold transition-colors">
                <LogOut size={18} /> Log Out
              </button>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-3">Version 1.2.6</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ PROFILE DETAILS MODAL ============ */}
      {activeModal === 'PROFILE_DETAILS' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">Profile Details</h3>
              <button onClick={() => setActiveModal('MENU')} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center shadow-lg mb-4 overflow-hidden">
                  <Logo size={56} variant="SYMBOL" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{profile.username || profile.display_name}</h2>
                <p className="text-muted-foreground text-sm mb-4">{profile.email}</p>
                <span className="px-3 py-1 bg-muted rounded-lg text-xs font-mono text-muted-foreground border border-border">ID: {profile.ftid}</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Wallet size={18} /></div>
                    <div>
                      <div className="font-bold text-foreground text-sm">Total Assets</div>
                      <div className="text-xs text-muted-foreground">Net Worth</div>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center"><Clock size={18} /></div>
                    <div>
                      <div className="font-bold text-foreground text-sm">Member Since</div>
                      <div className="text-xs text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center"><Shield size={18} /></div>
                    <div>
                      <div className="font-bold text-foreground text-sm">KYC Status</div>
                      <div className="text-xs text-muted-foreground">{profile.kyc_status || 'UNVERIFIED'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ KYC VERIFICATION MODAL ============ */}
      {activeModal === 'KYC' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Shield className="text-primary" size={24} />
                <h3 className="text-lg font-bold text-foreground">KYC Verification</h3>
              </div>
              <button onClick={() => { setActiveModal('MENU'); setKycStep('form'); setIsKycResubmitting(false); }} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {profile.kyc_status === 'VERIFIED' ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4"><Shield size={40} className="text-green-500" /></div>
                  <h4 className="text-xl font-bold text-foreground mb-2">Identity Verified</h4>
                  <p className="text-muted-foreground text-sm">Your account has been successfully verified.</p>
                </div>
              ) : profile.kyc_status === 'PENDING' || kycStep === 'done' ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4"><Clock size={40} className="text-yellow-500" /></div>
                  <h4 className="text-xl font-bold text-foreground mb-2">Under Review</h4>
                  <p className="text-muted-foreground text-sm px-4">Your documents have been submitted and are being reviewed. This usually takes 1-3 business days.</p>
                </div>
              ) : (profile.kyc_status === 'REJECTED' && !isKycResubmitting) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4"><X size={40} className="text-destructive" /></div>
                  <h4 className="text-xl font-bold text-foreground mb-2">Verification Rejected</h4>
                  <p className="text-muted-foreground text-sm px-4 mb-4">Your previous submission was rejected. Please resubmit with valid documents.</p>
                  <button onClick={() => { setIsKycResubmitting(true); setKycStep('form'); }} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm">Resubmit</button>
                </div>
              ) : kycStep === 'form' ? (
                <>
                  <p className="text-muted-foreground text-sm mb-6">Complete identity verification to unlock all features.</p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Full Name</label>
                      <input type="text" value={kycForm.fullName} onChange={e => setKycForm({ ...kycForm, fullName: e.target.value })} placeholder="Enter your full legal name" className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Date of Birth</label>
                      <input type="date" value={kycForm.dateOfBirth} onChange={e => setKycForm({ ...kycForm, dateOfBirth: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Residential Address</label>
                      <input type="text" value={kycForm.address} onChange={e => setKycForm({ ...kycForm, address: e.target.value })} placeholder="Street, City, State, Zip" className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">ID Type</label>
                      <select value={kycForm.idType} onChange={e => setKycForm({ ...kycForm, idType: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none">
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver's License</option>
                        <option value="national_id">National ID</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!kycForm.fullName || !kycForm.dateOfBirth || !kycForm.address) { toast.error('Please fill in all fields.'); return; }
                      setKycStep('upload');
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-brand"
                  >
                    Continue to Document Upload
                  </button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm mb-6">Upload your identity documents for verification.</p>

                  <div className="space-y-4 mb-6">
                    <ImageAttachmentField
                      label="Government ID (Front)"
                      required
                      value={kycForm.idFront}
                      onChange={v => setKycForm(prev => ({ ...prev, idFront: v }))}
                      description="Clear photo of passport photo page, driver's license front, or national ID front."
                    />
                    <ImageAttachmentField
                      label="Government ID (Back)"
                      value={kycForm.idBack}
                      onChange={v => setKycForm(prev => ({ ...prev, idBack: v }))}
                      description="Back side of ID card or driver's license (optional for passport)."
                    />
                    <ImageAttachmentField
                      label="Selfie Holding ID"
                      required
                      value={kycForm.selfie}
                      onChange={v => setKycForm(prev => ({ ...prev, selfie: v }))}
                      description="Clear selfie photo of your face while holding your identity document."
                    />
                  </div>

                  {kycUploadProgress && (
                    <div className="mb-4 bg-primary/5 border border-primary/10 rounded-xl p-3 text-center text-sm font-medium text-primary">{kycUploadProgress}</div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setKycStep('form')} className="flex-1 bg-muted text-foreground font-bold py-3.5 rounded-xl">Back</button>
                    <button
                      onClick={handleKYCSubmit}
                      disabled={isSubmittingKYC || !kycForm.idFront || !kycForm.selfie}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-brand disabled:opacity-50"
                    >
                      {isSubmittingKYC ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ SECURITY MODAL ============ */}
      {activeModal === 'SECURITY' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Shield className="text-primary" size={24} />
                <h3 className="text-lg font-bold text-foreground">Security Settings</h3>
              </div>
              <button onClick={() => setActiveModal('MENU')} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-muted-foreground text-sm">Manage your account security preferences</p>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Lock size={24} /></div>
                <div>
                  <div className="font-bold text-foreground">Security Level</div>
                  <div className="text-sm text-muted-foreground">High - Password & Session Encryption Active</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Security Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Mail className="text-muted-foreground" size={20} />
                      <div>
                        <div className="font-bold text-foreground text-sm">Email Notifications</div>
                        <div className="text-xs text-muted-foreground">Get notified of login attempts</div>
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-card rounded-full shadow-sm" /></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  {[
                    { icon: Key, label: 'Change Password', onClick: () => setActiveModal('CHANGE_PASSWORD') },
                    { icon: Clock, label: 'Login History', onClick: () => toast.info('Feature coming soon... Your current active session is secure.') },
                    { icon: Eye, label: 'Active Sessions', onClick: () => toast.info('Feature coming soon... Secure sessions are monitored in real-time.') },
                  ].map(item => (
                    <button 
                      key={item.label} 
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left"
                    >
                      <item.icon size={18} className="text-muted-foreground" />
                      <span className="font-bold text-foreground text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ CHANGE PASSWORD MODAL ============ */}
      {activeModal === 'CHANGE_PASSWORD' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-[32px] shadow-2xl animate-scale-in border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Lock className="text-primary" size={22} />
                <h3 className="text-lg font-bold text-foreground">Change Password</h3>
              </div>
              <button 
                onClick={() => setActiveModal('MENU')} 
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground font-medium">
                Set a secure password of at least 6 characters to protect your account.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-sans text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-sans text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('MENU')}
                  className="flex-1 py-3 border border-border hover:bg-muted font-bold text-foreground rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl text-sm transition-all shadow-brand disabled:opacity-50"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ SETTINGS MODAL ============ */}
      {activeModal === 'SETTINGS' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-md rounded-[32px] shadow-2xl animate-scale-in border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-foreground">Settings & Compliance</h3>
                <p className="text-xs text-muted-foreground">App policies, terms & educational guide</p>
              </div>
              <button 
                onClick={() => setActiveModal('MENU')} 
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={() => setActiveModal('TERMS')} 
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-accent rounded-2xl transition-colors text-left group border border-border"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-primary" />
                  <div>
                    <span className="font-bold text-foreground text-sm block">Terms & Conditions</span>
                    <span className="text-[11px] text-muted-foreground">Educational purpose & disclaimers</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveModal('POLICIES')} 
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-accent rounded-2xl transition-colors text-left group border border-border"
              >
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-primary" />
                  <div>
                    <span className="font-bold text-foreground text-sm block">User Policies & Safeguards</span>
                    <span className="text-[11px] text-muted-foreground">Developer & operator liability exemption</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveModal('FAQ')} 
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-accent rounded-2xl transition-colors text-left group border border-border"
              >
                <div className="flex items-center gap-3">
                  <HeadphonesIcon size={18} className="text-primary" />
                  <div>
                    <span className="font-bold text-foreground text-sm block">App Feature FAQ</span>
                    <span className="text-[11px] text-muted-foreground">Spot, Futures, Earn & KYC explanations</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TERMS & CONDITIONS MODAL ============ */}
      {activeModal === 'TERMS' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-foreground">Terms & Conditions</h3>
                  <p className="text-xs text-muted-foreground">Educational & Demo Platform Terms</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('SETTINGS')} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-muted-foreground leading-relaxed custom-scrollbar">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                <strong className="text-amber-300 block mb-1">Educational Sector & Demo Purpose:</strong>
                CrypX-Pro is created exclusively for demo trading, market learning, and software evaluation purposes. It does not provide real financial services, live money transactions, or financial advice.
              </div>

              <section>
                <h4 className="font-bold text-foreground mb-1">1. Educational Purpose & Non-Financial Intent</h4>
                <p>By accessing or using CrypX-Pro, you acknowledge that all trading features, spot balances, futures leverage, and yield returns are simulated paper credits designed strictly for learning and educational evaluation.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">2. Complete Exemption of Developer Liability</h4>
                <p>The development team, software authors, and platform operators hold zero legal liability or responsibility for any user actions, reliance on simulated data, or decisions made after signing up or using this application.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">3. Eligibility & Account Registration</h4>
                <p>You must be at least 18 years old and capable of agreeing to software evaluation terms. Account data is maintained securely for testing and session state tracking.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">4. Trading Features & Yield Simulation</h4>
                <p>CrypX-Pro provides simulated spot trading, futures leverage practice, and staking yield simulation. No real money deposits or guaranteed financial returns exist.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">5. Scamadviser & App Store Transparency</h4>
                <p>This app operates with full transparency. It does not engage in real financial solicitation, predatory trading schemes, or unauthorized asset management.</p>
              </section>
            </div>

            <div className="p-4 border-t border-border flex justify-end items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveModal('SETTINGS')}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ USER POLICIES MODAL ============ */}
      {activeModal === 'POLICIES' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Shield className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-foreground">User Policies & Safeguards</h3>
                  <p className="text-xs text-muted-foreground">Privacy, Disclaimers & Developer Safeguards</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('SETTINGS')} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-muted-foreground leading-relaxed custom-scrollbar">
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive-foreground space-y-1">
                <h4 className="font-extrabold text-red-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  Developer & Operator Exemption
                </h4>
                <p className="text-xs text-red-300/90 leading-relaxed">
                  By registering or using CrypX-Pro, the user explicitly agrees that the software developers, authors, and operators bear NO liability or responsibility after sign-up. The app is not a financial institution or financial advisory service.
                </p>
              </div>

              <section>
                <h4 className="font-bold text-foreground mb-1">1. Educational Sector Intention</h4>
                <p>This software is built for educational demonstration, user interface testing, and crypto mechanics education. No financial advisory or money management services are offered or implied.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">2. Privacy & Data Handling</h4>
                <p>Account credentials (email, display name) are stored strictly for session management and demo profile state. Personal data is never sold to third parties.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">3. Simulated KYC Policy</h4>
                <p>Uploaded documents in the identity verification section are handled in a sandbox environment to demonstrate compliance workflows for educational evaluation.</p>
              </section>

              <section>
                <h4 className="font-bold text-foreground mb-1">4. Official Inquiries & Data Deletion</h4>
                <p>Users may request account deletion or contact platform administration directly at <span className="text-foreground font-semibold">admin@crypxpro.com</span>. Official inquiries are handled within 24–48 hours.</p>
              </section>
            </div>

            <div className="p-4 border-t border-border flex justify-end items-center shrink-0">
              <button
                onClick={() => setActiveModal('SETTINGS')}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ FAQ MODAL ============ */}
      {activeModal === 'FAQ' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <HeadphonesIcon className="text-primary" size={24} />
                <h3 className="text-lg font-bold text-foreground">Frequently Asked Questions</h3>
              </div>
              <button onClick={() => setActiveModal('SETTINGS')} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[
                { q: 'What is CrypX-Pro?', a: 'CrypX-Pro is a cryptocurrency trading platform that offers spot trading, futures trading, staking, and asset management services. Our mission is to make digital asset trading accessible to everyone.' },
                { q: 'How do I create an account?', a: 'Tap "Sign Up" on the login screen, enter your email and a secure password, then verify your email address. Once verified, you can start using the platform immediately.' },
                { q: 'What is KYC and why is it required?', a: 'KYC (Know Your Customer) is an identity verification process required by financial regulations. Completing KYC unlocks full platform features including higher withdrawal limits and futures trading.' },
                { q: 'How do I deposit funds?', a: 'Go to the Assets page, tap "Deposit", select your preferred cryptocurrency and network, then send funds to the provided wallet address. Deposits are credited after blockchain confirmation.' },
                { q: 'How do I withdraw funds?', a: 'Navigate to Assets, tap "Withdraw", select the token and network, enter the destination address and amount, then confirm. Withdrawals are processed after security verification.' },
                { q: 'What trading pairs are available?', a: 'We support major trading pairs including BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, XRP/USDT and more. Visit the Spot page for the full list of available pairs.' },
                { q: 'What is futures trading?', a: 'Futures trading allows you to trade with leverage, amplifying potential gains (and losses). You can go long (buy) or short (sell) on supported pairs with leverage up to 100x.' },
                { q: 'What is staking?', a: 'Staking lets you earn passive rewards by locking your tokens for a set period. Visit the Earn page to explore available staking plans and their APY rates.' },
                { q: 'How do I convert between tokens?', a: 'Use the Quick Convert feature on the Spot page. Select the token pair, enter the amount, and confirm the conversion. The exchange rate is calculated in real-time.' },
                { q: 'Is my account secure?', a: 'Yes. We implement industry-standard security measures including encrypted data storage, secure password authentication, and real-time session protection.' },
                { q: 'How do I contact support?', a: 'Go to your Profile menu → Help & Support or email our official desk directly at admin@crypxpro.com. Support tickets are reviewed within 24–48 hours.' },
                { q: 'What fees does CrypX-Pro charge?', a: 'We charge competitive trading fees on spot and futures trades. Deposit fees depend on the blockchain network. Detailed fee information is available on the platform.' },
              ].map((faq, i) => (
                <details key={i} className="group bg-muted/50 rounded-xl border border-border overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="font-bold text-foreground text-sm pr-4">{faq.q}</span>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ SUPPORT MODAL ============ */}
      {activeModal === 'SUPPORT' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative animate-scale-in border border-border">
            <button onClick={() => setActiveModal('MENU')} className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6">
              <HeadphonesIcon className="text-primary" size={24} />
              <div><h3 className="text-lg font-bold text-foreground">Customer Support</h3><p className="text-xs text-muted-foreground">We're here to help 24/7</p></div>
            </div>
            <div className="bg-primary/5 rounded-xl p-6 text-center mb-6 border border-primary/10">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3"><HeadphonesIcon size={32} /></div>
              <h4 className="font-bold text-foreground text-base mb-1">Official Support Center</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our support team is available around the clock. Inquiries sent to our official channel are addressed promptly.
              </p>
              <div className="mt-3 py-2 px-3 rounded-lg bg-background border border-border/80 text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Typical response time: within 24–48 hours</span>
              </div>
            </div>
            {(!supportInfo || (!supportInfo.telegram && !supportInfo.whatsapp && !supportInfo.email)) ? (
              <div className="space-y-3 mb-6">
                <a href="mailto:admin@crypxpro.com" className="block w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-center shadow-brand text-xs">
                  Email: admin@crypxpro.com
                </a>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {supportInfo.telegram && <a href={supportInfo.telegram} target="_blank" rel="noreferrer" className="block w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-center shadow-brand text-xs">Telegram Support</a>}
                {supportInfo.whatsapp && <a href={supportInfo.whatsapp} target="_blank" rel="noreferrer" className="block w-full py-3 bg-green-500 text-white font-bold rounded-xl text-center text-xs">WhatsApp Support</a>}
                <a href={`mailto:${supportInfo.email || 'admin@crypxpro.com'}`} className="block w-full py-3 bg-card border border-border text-foreground font-bold rounded-xl text-center hover:bg-accent text-xs">
                  Official Email: {supportInfo.email || 'admin@crypxpro.com'}
                </a>
              </div>
            )}
            <div className="text-center">
              <a href="#" className="text-primary text-sm font-bold flex items-center justify-center gap-1 hover:underline">
                View Frequently Asked Questions <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Support Chat Modal */}
      <SupportChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* ============ NOTIFICATIONS MODAL ============ */}
      {activeModal === 'NOTIFICATIONS' && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-card w-full max-w-md rounded-[32px] max-h-[80vh] flex flex-col shadow-2xl animate-scale-in border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Bell className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">Stay updated with your account</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                    <Bell className="text-muted-foreground" size={28} />
                  </div>
                  <h4 className="font-bold text-foreground text-sm">All Caught Up!</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">You have no account notifications at the moment.</p>
                </div>
              ) : (
                notifications.map((noti) => {
                  const parsed = parseNotificationMessage(noti.message);
                  return (
                    <div 
                      key={noti.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        !noti.is_read 
                          ? 'bg-primary/5 border-primary/20 shadow-sm'
                          : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                          {!noti.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />}
                          {noti.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono leading-none">
                          {new Date(noti.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{parsed.body}</p>
                      
                      {parsed.action_label && parsed.action_url && (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setActiveModal(null);
                              navigate(parsed.action_url);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-brand-sm"
                          >
                            {parsed.action_label}
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-4 border-t border-border shrink-0 flex justify-between gap-3 bg-muted/20 rounded-b-[32px]">
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.from('notifications').delete().eq('user_id', user!.id);
                      if (error) throw error;
                      setNotifications([]);
                      toast.success('Cleared all notifications');
                    } catch (e: any) {
                      toast.error('Failed to clear notifications');
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ PWA PERMISSIONS MODAL ============ */}
      <PWAPermissionsModal
        isOpen={activeModal === 'PERMISSIONS'}
        onClose={() => setActiveModal('MENU')}
      />
    </>
  );
};

const MenuBtn = ({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 bg-card hover:bg-accent rounded-xl transition-colors group border border-transparent hover:border-border">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}><Icon size={18} /></div>
    <span className="font-bold text-foreground text-sm">{label}</span>
    <ChevronRight className="ml-auto text-muted-foreground" size={16} />
  </button>
);

export default UserHome;
