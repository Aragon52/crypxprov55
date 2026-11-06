import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';
import { ShieldCheck, X, CheckCircle, Eye, FileText, User, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface KYCSubmission {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  id_type: string;
  id_front_url: string | null;
  id_back_url: string | null;
  selfie_url: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  email: string | null;
  ftid: string | null;
  kyc_status: string | null;
  created_at: string;
}

const KYC = () => {
  const { user: currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; userId: string; action: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: subs } = await supabase.from('kyc_submissions').select('*').order('submitted_at', { ascending: false });
    if (subs) {
      await syncUserReferralsWithSupabase();
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const filteredSubs = filterUsersByAdminGroup(subs || [], adminId);
      
      setSubmissions(filteredSubs as KYCSubmission[]);
      // Load profiles for all user_ids
      const userIds = [...new Set(filteredSubs.map((s: any) => s.user_id))];
      if (userIds.length) {
        const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
        const map: Record<string, ProfileRow> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
    }
    setLoading(false);
  };

  const handleAction = async (id: string, userId: string, action: 'VERIFIED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await supabase.from('kyc_submissions').update({
        status: action,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      }).eq('id', id);

      await supabase.from('profiles').update({
        kyc_status: action
      }).eq('id', userId);

      await loadData();
      setConfirmAction(null);
      setAdminNotes('');
      setExpandedId(null);
    } catch (err) {
      console.error("KYC action failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = submissions.filter(s => filter === 'ALL' || s.status === filter);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and verify user identity documents.</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-xl w-full md:w-auto">
          {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <CubeSpinner fullScreen={false} label="Loading submissions..." />
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">No {filter.toLowerCase()} submissions found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(sub => {
              const profile = profiles[sub.user_id];
              const isExpanded = expandedId === sub.id;
              
              return (
                <div key={sub.id} className={`transition-all ${isExpanded ? 'bg-muted/30' : 'hover:bg-muted/10'}`}>
                  <div className="px-6 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : sub.id)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        sub.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600' :
                        sub.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>
                        {(profile?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{profile?.username || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{sub.full_name} • {new Date(sub.submitted_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="hidden md:block">
                        <span className="text-muted-foreground">ID Type: </span>
                        <span className="font-bold text-foreground capitalize">{sub.id_type}</span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        sub.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        sub.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                      }`}>
                        {sub.status}
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><User size={14} /> Personal Details</h4>
                          <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                            <DetailRow label="Full Name" value={sub.full_name} />
                            <DetailRow label="Birthday" value={sub.date_of_birth} />
                            <DetailRow label="Address" value={sub.address} />
                            <DetailRow label="User Email" value={profile?.email || '—'} />
                            <DetailRow label="ID Number" value={profile?.ftid || '—'} />
                          </div>
                          
                          {sub.admin_notes && (
                            <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg">
                              <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Previous Admin Notes:</span>
                              <p className="text-xs text-foreground italic">"{sub.admin_notes}"</p>
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><FileText size={14} /> Documents</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <ImagePreview label="ID Front" url={sub.id_front_url} onClick={() => setViewingImage(sub.id_front_url)} />
                            <ImagePreview label="ID Back" url={sub.id_back_url} onClick={() => setViewingImage(sub.id_back_url)} />
                            <ImagePreview label="Selfie" url={sub.selfie_url} icon={<Camera size={20} />} onClick={() => setViewingImage(sub.selfie_url)} />
                          </div>

                          {sub.status === 'PENDING' && (
                            <div className="space-y-4 pt-4 border-t border-border mt-6">
                              <textarea 
                                placeholder="Add internal notes or rejection reason..." 
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                className="w-full bg-muted border border-border rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                              />
                              <div className="flex gap-3 justify-end">
                                <button 
                                  onClick={() => setConfirmAction({ id: sub.id, userId: sub.user_id, action: 'REJECTED' })}
                                  disabled={!!processingId}
                                  className="px-6 py-2 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5 transition-all"
                                >
                                  Reject Submission
                                </button>
                                <button 
                                  onClick={() => setConfirmAction({ id: sub.id, userId: sub.user_id, action: 'VERIFIED' })}
                                  disabled={!!processingId}
                                  className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                  Approve & Verify
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${confirmAction.action === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Confirm {confirmAction.action === 'VERIFIED' ? 'Approval' : 'Rejection'}</h3>
            <p className="text-muted-foreground text-center text-sm mb-6">Are you sure you want to mark this user as {confirmAction.action.toLowerCase()}? This action will notify the user.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button 
                onClick={() => handleAction(confirmAction.id, confirmAction.userId, confirmAction.action as any)}
                disabled={!!processingId}
                className={`flex-1 py-3 rounded-2xl font-bold text-white shadow-xl transition-all ${confirmAction.action === 'VERIFIED' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-destructive shadow-destructive/20'}`}
              >
                {processingId ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
          <img src={viewingImage} alt="KYC Document Full" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-in fade-in duration-300" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
    <span className="text-sm text-foreground font-medium">{value || '—'}</span>
  </div>
);

const ImagePreview = ({ label, url, icon, onClick }: { label: string; url: string | null; icon?: any; onClick: () => void }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(url);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
      // Handle potential relative paths if they somehow got in
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
         setImgSrc(`${supabaseUrl}/storage/v1/object/public/kyc-documents/${url}`);
      }
    } else {
      setImgSrc(url);
    }
    setError(false);
  }, [url]);

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block">{label}</span>
      <div 
        onClick={imgSrc && !error ? onClick : undefined}
        className={`relative aspect-[3/4] rounded-xl border-2 border-dashed border-border overflow-hidden flex flex-col items-center justify-center transition-all ${imgSrc && !error ? 'cursor-zoom-in hover:border-primary/50' : 'bg-muted/30 opacity-50'}`}
      >
        {imgSrc && !error ? (
          <>
            <img 
              src={imgSrc} 
              alt={label} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={() => setError(true)}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors group">
              <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        ) : (
          <>
            {icon || <FileText size={20} className="text-muted-foreground mb-1" />}
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 text-center">
              {error ? 'Load Error' : 'NOT UPLOADED'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default KYC;
