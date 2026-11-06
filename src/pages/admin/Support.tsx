import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, MessageCircle, Phone, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser } from '@/lib/adminPermissions';
import { recordActivityLog } from '@/services/systemActivityLog';

const AdminSupport = () => {
  const [formData, setFormData] = useState({ email: '', telegram: '', whatsapp: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [globalConfigId, setGlobalConfigId] = useState<string | null>(null);
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const adminId = getAdminIdForCurrentUser(user.email) || 'OWNER';
      
      const { data, error: fetchError } = await supabase.from('support_config').select('*');
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        // 1. Try to find if there is a row that explicitly matches currentAdminId relationally
        const matchedRow = data.find((r: any) => r.admin_id === adminId || r.adminId === adminId);
        if (matchedRow) {
          setFormData({
            email: matchedRow.email || '',
            telegram: matchedRow.telegram || '',
            whatsapp: matchedRow.whatsapp || ''
          });
          setConfigId(matchedRow.id);
          return;
        }

        // 2. Try to find the global serialized configurations row
        const globalRow = data.find((r: any) => r.email === 'global_support_configs@crypxpro.com');
        if (globalRow) {
          setGlobalConfigId(globalRow.id);
          if (globalRow.telegram) {
            try {
              const allConfigs = JSON.parse(globalRow.telegram);
              if (allConfigs[adminId]) {
                setFormData({
                  email: allConfigs[adminId].email || '',
                  telegram: allConfigs[adminId].telegram || '',
                  whatsapp: allConfigs[adminId].whatsapp || ''
                });
                return;
              }
            } catch (e) {
              console.warn("Error parsing serialized support configs:", e);
            }
          }
        }

        // 3. Fallback: load system default from the first non-global row
        const defaultRow = data.find((r: any) => r.email !== 'global_support_configs@crypxpro.com') || data[0];
        if (defaultRow) {
          if (adminId === 'OWNER') {
            setFormData({
              email: defaultRow.email || '',
              telegram: defaultRow.telegram || '',
              whatsapp: defaultRow.whatsapp || ''
            });
            setConfigId(defaultRow.id);
          } else {
            // New admin, initialize with custom defaults
            setFormData({
              email: `support-${adminId.toLowerCase()}@crypxpro.com`,
              telegram: '',
              whatsapp: ''
            });
          }
        }
      } else {
        // No configs in table yet, create placeholder defaults
        setFormData({
          email: 'support@crypxpro.com',
          telegram: '',
          whatsapp: ''
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load support config.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Enforce email domain validation: must strictly end with @crypxpro.com
    const emailLower = formData.email.trim().toLowerCase();
    if (!emailLower.endsWith('@crypxpro.com')) {
      setError("Support email must strictly belong to the @crypxpro.com domain (e.g. xxxxxxxx@crypxpro.com)");
      setSaving(false);
      return;
    }

    try {
      const adminId = getAdminIdForCurrentUser(user.email) || 'OWNER';

      // Load all rows to preserve maps of other admins
      const { data: allRows, error: fetchError } = await supabase.from('support_config').select('*');
      if (fetchError) throw fetchError;

      const globalRow = allRows?.find((r: any) => r.email === 'global_support_configs@crypxpro.com');
      let currentMap: Record<string, any> = {};
      if (globalRow && globalRow.telegram) {
        try {
          currentMap = JSON.parse(globalRow.telegram);
        } catch (e) {
          // ignore
        }
      }

      // Update current admin's configurations
      currentMap[adminId] = {
        email: formData.email.trim(),
        telegram: formData.telegram.trim(),
        whatsapp: formData.whatsapp.trim()
      };

      // Save global map serialization
      if (globalRow) {
        const { error: updErr } = await supabase
          .from('support_config')
          .update({
            telegram: JSON.stringify(currentMap),
            whatsapp: 'Serialized admin support configurations'
          })
          .eq('id', globalRow.id);
        if (updErr) throw updErr;
      } else {
        const { data: newRow, error: insErr } = await supabase
          .from('support_config')
          .insert({
            email: 'global_support_configs@crypxpro.com',
            telegram: JSON.stringify(currentMap),
            whatsapp: 'Serialized admin support configurations'
          })
          .select()
          .single();
        if (insErr) throw insErr;
        if (newRow) setGlobalConfigId(newRow.id);
      }

      // If OWNER, also synchronize standard columns of the default legacy row for backward compatibility
      const defaultRow = allRows?.find((r: any) => r.email !== 'global_support_configs@crypxpro.com');
      if (defaultRow && adminId === 'OWNER') {
        await supabase
          .from('support_config')
          .update({
            email: formData.email.trim(),
            telegram: formData.telegram.trim(),
            whatsapp: formData.whatsapp.trim()
          })
          .eq('id', defaultRow.id);
      }

      recordActivityLog({
        category: 'SUPPORT_CONTACT',
        action: 'SUPPORT_CONTACT_UPDATED',
        adminEmail: user.email || 'admin@crypxpro.com',
        adminId,
        target: `Support Channels (${adminId})`,
        title: 'Updated Support Contact Information',
        details: `Updated official support channels: Email: ${formData.email.trim()} | Telegram: ${formData.telegram.trim() || 'None'} | WhatsApp: ${formData.whatsapp.trim() || 'None'}`,
        severity: 'info',
        metadata: {
          adminId,
          email: formData.email.trim(),
          telegram: formData.telegram.trim(),
          whatsapp: formData.whatsapp.trim()
        }
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save support config.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Support Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage contact channels for customer support.</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <CubeSpinner label="Loading..." />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-foreground mb-2">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 w-full border border-border rounded-lg p-2.5 bg-card text-foreground focus:ring-2 focus:ring-ring outline-none" placeholder="support@crypxpro.com" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Direct email inquiries will be sent here.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Telegram</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="text" value={formData.telegram} onChange={e => setFormData({ ...formData, telegram: e.target.value })}
                    className="pl-10 w-full border border-border rounded-lg p-2.5 bg-card text-foreground focus:ring-2 focus:ring-ring outline-none" placeholder="https://t.me/username" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="pl-10 w-full border border-border rounded-lg p-2.5 bg-card text-foreground focus:ring-2 focus:ring-ring outline-none" placeholder="https://wa.me/1234567890" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border flex items-center justify-end gap-4">
              {success && (
                <span className="text-sm text-emerald-600 font-bold flex items-center gap-2">
                  <CheckCircle size={16} /> Saved Successfully
                </span>
              )}
              <button type="submit" disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 rounded-lg transition-all disabled:opacity-70 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
