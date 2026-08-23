import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  ArrowLeft, Loader2, Eye, EyeOff,
  Mail, Lock, User, Users, ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { createClient } from "../../../utils/supabase/client";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { toast } from "sonner";

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function FacilitatorSignup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<SignupFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    const supabaseUrl = `https://${projectId}.supabase.co`;
    const signupEndpoint = `${supabaseUrl}/functions/v1/make-server-dc18f5b2/auth/signup`;

    console.log("━━━ FACILITATOR SIGNUP START ━━━");
    console.log("Project ID:", projectId);
    console.log("Supabase URL:", supabaseUrl);
    console.log("Signup endpoint:", signupEndpoint);
    console.log("Anon key (first 40 chars):", publicAnonKey.substring(0, 40));
    console.log("Payload:", { email: data.email, fullName: data.fullName, role: "facilitator" });

    try {
      const response = await fetch(signupEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: "facilitator",
        }),
      });

      console.log("Response status:", response.status, response.statusText);

      let result: any;
      const rawText = await response.text();
      console.log("Raw response body:", rawText);

      try {
        result = JSON.parse(rawText);
        console.log("Parsed response:", result);
      } catch (parseErr) {
        console.error("Failed to parse response as JSON:", parseErr);
        throw new Error(`Server returned non-JSON response (${response.status}): ${rawText.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errMsg = result?.error || result?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error("Signup failed:", errMsg, "Full result:", result);
        throw new Error(errMsg);
      }

      console.log("✅ Signup successful:", result);
      toast.success("Account created successfully!");

      setTimeout(() => {
        navigate("/account-success", { state: { role: "facilitator" } });
      }, 500);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.error("━━━ SIGNUP ERROR ━━━");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", errMsg);
      console.error("Error stack:", error?.stack);
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A1C5C] to-[#5A2C6C] flex items-center justify-center shadow-lg shadow-[#4A1C5C]/20 flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#4A1C5C] uppercase tracking-widest">Facilitator Portal</p>
              <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "Playfair Display, serif", color: "#2C1810" }}>
                Create Account
              </h1>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-[#4A1C5C]/20 via-[#D4A843]/40 to-transparent" />
          <p className="text-sm text-muted-foreground mt-3">
            Start guiding transformative journeys
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold text-[#4A1C5C] uppercase tracking-wide">
              Full Name
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className="w-4 h-4 text-[#4A1C5C]/50" />
              </div>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                className="h-12 pl-10 border-[#4A1C5C]/20 focus:border-[#4A1C5C] focus:ring-[#4A1C5C]/20 rounded-xl bg-white/80"
                {...register("fullName", {
                  required: "Full name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
              />
            </div>
            {errors.fullName && isSubmitted && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#AA5D53] flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-[#AA5D53] inline-block" />
                {errors.fullName.message}
              </motion.p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-[#4A1C5C] uppercase tracking-wide">
              Email Address
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-4 h-4 text-[#4A1C5C]/50" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                className="h-12 pl-10 border-[#4A1C5C]/20 focus:border-[#4A1C5C] focus:ring-[#4A1C5C]/20 rounded-xl bg-white/80"
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
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#AA5D53] flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-[#AA5D53] inline-block" />
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#4A1C5C] uppercase tracking-wide">
              Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-[#4A1C5C]/50" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min. 6 characters)"
                className="h-12 pl-10 pr-11 border-[#4A1C5C]/20 focus:border-[#4A1C5C] focus:ring-[#4A1C5C]/20 rounded-xl bg-white/80"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#4A1C5C] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && isSubmitted && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#AA5D53] flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-[#AA5D53] inline-block" />
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#4A1C5C] uppercase tracking-wide">
              Confirm Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-[#4A1C5C]/50" />
              </div>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className="h-12 pl-10 pr-11 border-[#4A1C5C]/20 focus:border-[#4A1C5C] focus:ring-[#4A1C5C]/20 rounded-xl bg-white/80"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#4A1C5C] transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && isSubmitted && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#AA5D53] flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-[#AA5D53] inline-block" />
                {errors.confirmPassword.message}
              </motion.p>
            )}
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-[#D4A843]/25 hover:shadow-[#D4A843]/40 transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #D4A843, #C49835)", color: "#2C1810" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3D6D6C]" />
              <span>Secure sign-up · Your data is private</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/facilitator/login")}
              className="text-[#4A1C5C] hover:text-[#3A1C4C] font-semibold transition-colors underline underline-offset-2"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
