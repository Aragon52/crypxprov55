import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText, Shield, HeadphonesIcon, HelpCircle, AlertTriangle, CheckCircle,
  ChevronRight, Lock, Eye, Bell, Globe, ArrowLeft, ExternalLink, Info,
  Scale, BookOpen, ShieldCheck, UserCheck, Terminal, HeartHandshake, Sparkles,
  Trash2, AlertCircle, X, LogOut, Smartphone, HardDrive
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { deleteUserAccountComplete } from '@/lib/adminPermissions';
import { TermlyPrivacyPolicy } from '@/components/shared/TermlyPrivacyPolicy';
import { PWAPermissionsCard } from '@/components/shared/PWAPermissionsCard';
import { PWAInstallButton } from '@/components/shared/PWAInstallButton';

interface SettingsProps {
  initialTab?: string;
}

export const Settings = ({ initialTab: propInitialTab }: SettingsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Tab management: 'overview' | 'permissions' | 'terms' | 'policies' | 'faq'
  const initialTab = searchParams.get('tab') || propInitialTab || 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [faqSearch, setFaqSearch] = useState('');

  // User Self Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [userDeleteReason, setUserDeleteReason] = useState('No longer using the simulation platform');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUserAccountDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (deleteConfirmText.trim().toLowerCase() !== 'delete') {
      toast.error("Please type 'DELETE' to confirm account erasure.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteUserAccountComplete(user.id, user.email || undefined);
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Your account and all associated data have been permanently deleted.");
      setIsDeleteModalOpen(false);
      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      toast.error("Account deletion failed: " + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'permissions', 'terms', 'policies', 'faq'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (propInitialTab && ['overview', 'permissions', 'terms', 'policies', 'faq'].includes(propInitialTab)) {
      setActiveTab(propInitialTab);
    }
  }, [searchParams, propInitialTab]);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? '/app/home' : '/');
    }
  };

  // FAQ items data
  const faqList = [
    {
      category: "Educational Scope & Platform Nature",
      questions: [
        {
          q: "Is CrypX-Pro a real money exchange or licensed financial institution?",
          a: "No. CrypX-Pro is strictly an educational demo trading simulator and market analysis interface created for learning, technology evaluation, and software testing purposes within the educational sector. It does not handle real fiat or live custodial cryptocurrency funds, nor does it offer financial management or brokerage services."
        },
        {
          q: "Can I deposit or lose real fiat money on CrypX-Pro?",
          a: "No. All trading balances, spot holdings, futures margin, yield earnings, and wallet figures displayed within the application are simulated paper credits designed solely to teach trading mechanics, order execution, and risk management."
        },
        {
          q: "Does CrypX-Pro provide financial advice or market guarantees?",
          a: "No. None of the charts, market indicators, artificial intelligence insights, or token statistics presented in the app constitute financial, investment, legal, or tax advice. All trading decisions in the real world involve substantial risk."
        }
      ]
    },
    {
      category: "Platform Features & Trading Systems",
      questions: [
        {
          q: "How does the Spot Trading simulator work?",
          a: "The Spot Trading module connects to real-time price feeds for major cryptocurrencies and simulated assets. Users can practice limit orders, market buys/sells, and quick token conversions without incurring financial loss."
        },
        {
          q: "What is Futures Pro and how is leverage calculated?",
          a: "The Futures Pro module allows users to experiment with position leverage up to 100x, isolated and cross margin simulation, stop-loss/take-profit setups, and simulated liquidation pricing to learn high-leverage risk dynamics."
        },
        {
          q: "How does CrypX Earn & Staking work?",
          a: "CrypX Earn simulates yield generation, staking pools, and flexible daily APYs to teach users how decentralized finance (DeFi) yields, lockup periods, and reward calculations function in Web3 environments."
        },
        {
          q: "Why is Identity Verification (KYC) present in a demo app?",
          a: "The KYC process is implemented as a simulated compliance feature to demonstrate how regulated Web3 exchanges verify user documentation, handle document submission, and grant tiered account limits in financial production environments."
        }
      ]
    },
    {
      category: "User Rights, Privacy & Developer Safeguards",
      questions: [
        {
          q: "What responsibilities do the developers and operators hold?",
          a: "The development team, software authors, and hosting operators assume zero liability or responsibility for any user actions, reliance on simulated data, or external misuse. By registering an account, users explicitly agree to hold the development team completely harmless."
        },
        {
          q: "How is user account data handled?",
          a: "Account profile data is secured using industry-standard authentication encryption. We do not sell or monetize personal user data. Data stored is solely used to maintain user preferences, simulated portfolio state, and application testing records."
        },
        {
          q: "How can I contact support or submit feedback?",
          a: "Support requests and feedback can be submitted via the in-app 24/7 Customer Support chat window or by reaching out through official feedback channels listed in the Settings menu."
        }
      ]
    }
  ];

  const filteredFaqs = faqList.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      item => item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
              item.a.toLowerCase().includes(faqSearch.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Settings & Legal Transparency Hub
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pl-10">
              Complete disclosure of app policies, terms of service, educational intent, and feature guide.
            </p>
          </div>

          <div className="flex items-center gap-2 pl-10 sm:pl-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck size={14} />
              Educational & Compliance Ready
            </span>
          </div>
        </div>

        {/* Educational Disclaimer Top Banner */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={22} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                Official Educational & Demo Trading Disclosure
              </h4>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                CrypX-Pro operates exclusively as an educational simulation platform. All trades, portfolio values, and yield rates are simulated paper figures for learning purposes. No real financial services or advice are provided.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border overflow-x-auto custom-scrollbar no-scrollbar gap-2 sm:gap-4 pb-1">
          {[
            { id: 'overview', label: 'Settings & Security', icon: Shield },
            { id: 'permissions', label: 'App & Permissions', icon: Smartphone },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
            { id: 'policies', label: 'User Policies & Safeguards', icon: Scale },
            { id: 'faq', label: 'App FAQ & Feature Guide', icon: HeadphonesIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-brand-sm scale-[1.01]'
                  : 'bg-card/50 text-muted-foreground border-border hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Settings Overview & Account Security */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* PWA & Device Permissions Card */}
            <PWAPermissionsCard />

            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Shield className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold">Account & System Preferences</h3>
                  <p className="text-xs text-muted-foreground">Manage your session preferences, security settings, and legal disclosures.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col justify-between space-y-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="text-primary" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Account Status</h4>
                      <p className="text-xs text-muted-foreground">{user?.email || 'Logged in Trader'}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold w-fit">
                    Active Demo Trading Account
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col justify-between space-y-4">
                  <div className="flex items-center gap-3">
                    <Lock className="text-primary" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Security Protocol</h4>
                      <p className="text-xs text-muted-foreground">TLS Encrypted Session & Auth Protection</p>
                    </div>
                  </div>
                  <div className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl font-semibold w-fit">
                    Protected System Environment
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-sm font-bold text-foreground">Legal & Regulatory Quick Links</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => changeTab('permissions')}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone size={16} className="text-primary" />
                      <span className="text-xs font-bold">Permissions</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => changeTab('terms')}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-primary" />
                      <span className="text-xs font-bold">Terms & Conditions</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => changeTab('policies')}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Scale size={16} className="text-primary" />
                      <span className="text-xs font-bold">User Policies</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => changeTab('faq')}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen size={16} className="text-primary" />
                      <span className="text-xs font-bold">Feature FAQ</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Danger Zone: Account Deletion & Right to Erasure */}
              <div className="pt-6 border-t border-border/80">
                <div className="p-5 sm:p-6 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                        <Trash2 size={18} />
                        <h4>Account Erasure & Permanent Deletion</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                        Permanently purge your account, profile credentials, simulated trading balances, deposit/withdrawal history, and active sessions from our database (GDPR Right to Erasure).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmText('');
                        setIsDeleteModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors whitespace-nowrap self-start sm:self-center flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Permissions Dedicated Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6 animate-fade-in">
            <PWAPermissionsCard />
          </div>
        )}

        {/* Tab 2: Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <FileText className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold">Terms & Conditions of Service</h3>
                  <p className="text-xs text-muted-foreground">Effective Date: April 2026 | Educational Platform Standard</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <section className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-foreground">
                <h4 className="font-extrabold text-primary mb-2 flex items-center gap-2">
                  <Info size={16} /> 1. Educational Purpose & Non-Financial Intent
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  CrypX-Pro is explicitly designed and provided for <strong>demo trading, market simulation, technical learning, and educational purposes</strong> within the computer science and educational sector. The platform does NOT provide real-money trading, financial brokerage, asset custody, or monetary investment opportunities. All currency values (USDT, BTC, ETH, etc.) inside the app are paper units for simulation.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-foreground text-base">2. User Agreement & Eligibility</h4>
                <p>
                  By creating an account or using CrypX-Pro, you acknowledge that you are using a simulation tool. You confirm that you understand no financial claims, withdrawal guarantees, or real money earnings exist. You must be legally capable of agreeing to software testing terms in your jurisdiction.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-foreground text-base">3. Simulated Trading & Yield Disclaimer</h4>
                <p>
                  All order book executions, spot swaps, futures leverage positions, and staking yield figures displayed on the platform are software-calculated models designed to illustrate market mechanics. Past simulated performance inside CrypX-Pro does not correlate to real-world financial market outcomes.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-foreground text-base">4. Platform Features Transparency</h4>
                <p>
                  Features such as Market Data, Spot Trading, Futures Leverage, Earn Staking, KYC Verification, and User Support are provided solely as integrated software modules to simulate a complete crypto trading ecosystem for educational review and application testing.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-foreground text-base">5. Account Registration & User Security</h4>
                <p>
                  Users are responsible for keeping their login credentials confidential. While CrypX-Pro implements security protocols, users acknowledge that accounts are maintained for software interaction and progress tracking within the educational environment.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-foreground text-base">6. Developer & Operators Exemption of Liability</h4>
                <p>
                  To the maximum extent permitted by law, the development team, individual software engineers, project contributors, and platform operators hold ZERO legal liability, financial responsibility, or obligation for any loss, misunderstanding, or consequence arising from user interaction with this app.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-foreground text-base">7. Revisions & Updates</h4>
                <p>
                  We reserve the right to modify these terms at any time to preserve transparency and comply with software standards or app store policies.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* Tab 3: User Policies & Developer Safeguards */}
        {activeTab === 'policies' && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
            <TermlyPrivacyPolicy />
          </div>
        )}

        {/* Tab 4: App FAQ & Feature Guide */}
        {activeTab === 'faq' && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <HeadphonesIcon className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold">Frequently Asked Questions & Feature Guide</h3>
                  <p className="text-xs text-muted-foreground">Transparent breakdown of every feature, tool, and policy inside CrypX-Pro.</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search FAQ questions..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="px-4 py-2 rounded-xl bg-muted border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
              />
            </div>

            <div className="space-y-8">
              {filteredFaqs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No questions found matching "{faqSearch}". Try searching for terms like "educational", "trading", "deposit", or "developer".
                </p>
              ) : (
                filteredFaqs.map((cat, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-border/50 pb-2">
                      {cat.category}
                    </h4>
                    <div className="space-y-3">
                      {cat.questions.map((faq, fIdx) => (
                        <details key={fIdx} className="group bg-muted/30 rounded-2xl border border-border overflow-hidden transition-colors hover:border-primary/30">
                          <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-sm text-foreground">
                            <span className="pr-4">{faq.q}</span>
                            <ChevronRight size={16} className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90 group-open:text-primary" />
                          </summary>
                          <div className="px-4 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                            {faq.a}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUserAccountDelete} className="bg-card w-full max-w-md rounded-[28px] p-6 shadow-2xl relative border border-rose-500/20 animate-scale-in">
            <button 
              type="button" 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Account Permanently</h3>
                <p className="text-xs text-muted-foreground">Self-service GDPR data erasure</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-muted-foreground">Account Identifier:</span>
                  <span className="font-bold text-foreground">{user?.email || 'Logged In User'}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                  This action is <strong className="text-rose-400 font-bold">permanent and irreversible</strong>. All your simulated spot and futures balances, order book history, deposit/withdrawal records, and preferences will be permanently wiped.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Reason for Deletion (Optional)</label>
                <select
                  value={userDeleteReason}
                  onChange={(e) => setUserDeleteReason(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Completed demo trading curriculum">Completed demo trading curriculum</option>
                  <option value="No longer using the simulation platform">No longer using the simulation platform</option>
                  <option value="Switching to a different training environment">Switching to a different training environment</option>
                  <option value="Privacy & data minimization preference">Privacy & data minimization preference</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  To confirm deletion, type <span className="font-mono text-rose-500 font-bold">DELETE</span> below:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 border border-border rounded-xl text-foreground font-bold hover:bg-muted/80 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting || deleteConfirmText.trim().toLowerCase() !== 'delete'}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm shadow-md flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
