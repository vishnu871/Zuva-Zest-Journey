import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Phone,
  Pencil,
  Check,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { createClient } from "../../../utils/supabase/client";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// INLINE EDIT FIELD
// ─────────────────────────────────────────────────────────────────────────────

interface InlineFieldProps {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  saving: boolean;
  icon: React.ReactNode;
  inputType?: string;
  placeholder?: string;
  helperText?: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (v: string) => void;
}

function InlineField({
  label,
  value,
  editValue,
  isEditing,
  saving,
  icon,
  inputType = "text",
  placeholder,
  helperText,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: InlineFieldProps) {
  return (
    <div className="flex items-start gap-4 py-5">
      <div className="w-10 h-10 rounded-full bg-[#4A1C5C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[#4A1C5C]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </p>
        {isEditing ? (
          <div className="space-y-2">
            <input
              type={inputType}
              value={editValue}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#4A1C5C]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A1C5C]/40 focus:border-[#4A1C5C] transition-all duration-150"
              onKeyDown={e => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
            />
            {helperText && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {helperText}
              </p>
            )}
            <div className="flex gap-2 pt-0.5">
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="bg-[#4A1C5C] hover:bg-[#3A1C4C] text-white h-8 px-3 text-xs gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
                className="h-8 px-3 text-xs gap-1.5 border-[#4A1C5C]/20 text-[#4A1C5C] hover:bg-[#4A1C5C]/5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">
              {value || <span className="text-muted-foreground italic text-sm">Not set</span>}
            </p>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-xs font-medium text-[#4A1C5C] hover:text-[#3A1C4C] transition-colors flex-shrink-0 px-2.5 py-1.5 rounded-lg hover:bg-[#4A1C5C]/8 border border-transparent hover:border-[#4A1C5C]/15"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ParticipantProfile() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;
      const meta = user.user_metadata || {};
      setName(meta.full_name || meta.name || "");
      setEmail(user.email || "");
      setPhone(meta.phone || user.phone || "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const saveEmail = async () => {
    const trimmed = editEmail.trim().toLowerCase();
    if (!trimmed) { toast.error("Email cannot be empty."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { toast.error("Please enter a valid email."); return; }
    if (trimmed === email) { setEditingEmail(false); return; }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setEmail(trimmed);
      setEditingEmail(false);
      toast.success("Check your new email inbox to confirm the change.", { duration: 6000 });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update email.");
    } finally {
      setSavingEmail(false);
    }
  };

  const savePhone = async () => {
    const trimmed = editPhone.trim();
    if (trimmed && !/^[\d\s\+\-\(\)]{7,20}$/.test(trimmed)) { toast.error("Please enter a valid mobile number."); return; }
    setSavingPhone(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { phone: trimmed } });
      if (error) throw error;
      setPhone(trimmed);
      setEditingPhone(false);
      toast.success("Mobile number updated successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update mobile number.");
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <DashboardLayout role="participant">
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
            My Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your contact details and account information.
          </p>
        </motion.div>

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#4A1C5C]" />
          </Card>
        ) : (
          <div className="space-y-5">

            {/* Profile card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="overflow-hidden border border-[#E8DDD0] shadow-sm">

                {/* Gradient header */}
                <div className="bg-gradient-to-r from-[#4A1C5C] to-[#3D6D6C] px-6 py-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                      {name ? name.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">Participant</p>
                    <h2 className="text-white text-xl font-bold leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                      {name || "—"}
                    </h2>
                    <p className="text-white/55 text-[11px] mt-0.5">Name is managed by your facilitator</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="px-6 divide-y divide-[#F0E8DE]">

                  {/* Read-only name */}
                  <div className="flex items-center gap-4 py-5">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{name || "—"}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium border border-gray-200">
                          Read-only
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <InlineField
                    label="Email Address"
                    value={email}
                    editValue={editEmail}
                    isEditing={editingEmail}
                    saving={savingEmail}
                    icon={<Mail className="w-4 h-4" />}
                    inputType="email"
                    placeholder="your@email.com"
                    helperText="A confirmation link will be sent to your new email address."
                    onEdit={() => { setEditEmail(email); setEditingEmail(true); setEditingPhone(false); }}
                    onCancel={() => setEditingEmail(false)}
                    onSave={saveEmail}
                    onChange={setEditEmail}
                  />

                  {/* Phone */}
                  <InlineField
                    label="Mobile Number"
                    value={phone}
                    editValue={editPhone}
                    isEditing={editingPhone}
                    saving={savingPhone}
                    icon={<Phone className="w-4 h-4" />}
                    inputType="tel"
                    placeholder="+91 98765 43210"
                    onEdit={() => { setEditPhone(phone); setEditingPhone(true); setEditingEmail(false); }}
                    onCancel={() => setEditingPhone(false)}
                    onSave={savePhone}
                    onChange={setEditPhone}
                  />

                </div>
              </Card>
            </motion.div>

            {/* Security notice */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/25">
                <ShieldCheck className="w-4 h-4 text-[#A07820] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#7A5A10] leading-relaxed">
                  <span className="font-semibold">Security note:</span>{" "}
                  Changing your email requires a confirmation from your new inbox.
                  Your name can only be updated by your facilitator.
                </p>
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}