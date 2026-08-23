import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  ArrowLeft, Loader2, Eye, EyeOff,
  Mail, Lock, UserCircle, ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { projectId } from "../../../utils/supabase/info";

interface LoginFormData {
  email: string;
  password: string;
}

export default function ParticipantLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<LoginFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    console.log("━━━ PARTICIPANT LOGIN START ━━━");
    console.log("Project ID:", projectId);
    console.log("Supabase URL:", `https://${projectId}.supabase.co`);

    try {
      const supabase = createClient();

      console.log("Calling supabase.auth.signInWithPassword for:", data.email);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error("signInWithPassword error:", error.message, "Status:", error.status, "Code:", error.code);
        throw new Error(error.message);
      }

      console.log("signInWithPassword success, user:", authData.user?.id);

      const session = authData.session;
      if (!session) throw new Error("No session returned after login");

      const verifyEndpoint = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2/auth/verify-role`;
      console.log("Calling verify-role at:", verifyEndpoint);

      const roleResponse = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      console.log("verify-role status:", roleResponse.status);
      const rawRole = await roleResponse.text();
      console.log("verify-role raw response:", rawRole);

      let roleData: any;
      try { roleData = JSON.parse(rawRole); } catch {
        throw new Error(`verify-role returned non-JSON (${roleResponse.status}): ${rawRole.substring(0, 200)}`);
      }

      if (!roleResponse.ok || !roleData.success) {
        await supabase.auth.signOut();
        throw new Error(roleData?.error || `Role verification failed (${roleResponse.status})`);
      }

      const userRole = roleData.user?.role;
      if (userRole !== "participant") {
        await supabase.auth.signOut();
        throw new Error(`Access denied. This login is for participants only. Your role is: ${userRole}`);
      }

      toast.success("Welcome back!");
      navigate("/participant/dashboard");
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.error("━━━ LOGIN ERROR ━━━");
      console.error("Message:", errMsg);
      console.error("Stack:", error?.stack);
      toast.error(errMsg);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-5 -ml-2 text-muted-foreground hover:text-foreground text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>

        {/* Role Badge + Header */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3D6D6C] to-[#2C5958] flex items-center justify-center shadow-lg shadow-[#3D6D6C]/20 flex-shrink-0">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#3D6D6C] uppercase tracking-widest">Participant Portal</p>
              <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "Playfair Display, serif", color: "#2C1810" }}>
                Welcome Back
              </h1>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-[#3D6D6C]/20 via-[#D4A843]/40 to-transparent" />
          <p className="text-sm text-muted-foreground mt-3">
            Continue your journey of reinvention
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-[#3D6D6C] uppercase tracking-wide">
              Email Address
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-4 h-4 text-[#3D6D6C]/50" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                className="h-12 pl-10 border-[#3D6D6C]/20 focus:border-[#3D6D6C] focus:ring-[#3D6D6C]/20 rounded-xl bg-white/80"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
            </div>
            {errors.email && isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#AA5D53] flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-[#AA5D53] inline-block" />
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#3D6D6C] uppercase tracking-wide">
              Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-[#3D6D6C]/50" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-12 pl-10 pr-11 border-[#3D6D6C]/20 focus:border-[#3D6D6C] focus:ring-[#3D6D6C]/20 rounded-xl bg-white/80"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#3D6D6C] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#AA5D53] flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-[#AA5D53] inline-block" />
                {errors.password.message}
              </motion.p>
            )}
          </div>

          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-[#3D6D6C] hover:text-[#2C5958] transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-[#D4A843]/25 hover:shadow-[#D4A843]/40 transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #D4A843, #C49835)", color: "#2C1810" }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3D6D6C]" />
            <span>Secure sign-in · Your journey, your data</span>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-sm text-muted-foreground">
            Have an invitation code?{" "}
            <button
              onClick={() => navigate("/participant/activate")}
              className="text-[#3D6D6C] hover:text-[#2C5958] font-semibold transition-colors underline underline-offset-2"
            >
              Activate Your Account
            </button>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
