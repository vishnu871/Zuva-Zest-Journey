import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { projectId } from "../../../utils/supabase/info";

interface LoginFormData {
  email: string;
  password: string;
}

export default function FacilitatorLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted }
  } = useForm<LoginFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: ""
    }
  });


  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    console.log("━━━ FACILITATOR LOGIN START ━━━");
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
          "Authorization": `Bearer ${session.access_token}`
        }
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
      if (userRole !== "facilitator") {
        await supabase.auth.signOut();
        throw new Error(`Access denied. This login is for facilitators only. Your role is: ${userRole}`);
      }

      toast.success("Welcome back!");
      navigate("/facilitator/dashboard");

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
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Facilitator Sign In
          </h1>
          <p className="text-muted-foreground">
            Guide your participants on their journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className="h-12"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
            {errors.email && isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-[#AA5D53]"
              >
                {errors.email.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-12 pr-10"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-[#AA5D53]"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-[#3D6D6C] hover:text-[#2C5958] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] h-12 shadow-md hover:shadow-lg transition-all duration-300"
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
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/facilitator/signup")}
              className="text-[#4A1C5C] hover:text-[#3A1C4C] font-medium transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
