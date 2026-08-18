import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
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
    formState: { errors, isSubmitted, isValid }
  } = useForm<SignupFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
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
          "Authorization": `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: "facilitator"
        })
      });

      console.log("Response status:", response.status, response.statusText);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

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
      console.error("Is network error (Failed to fetch):", errMsg.includes("fetch"));
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
            Create Facilitator Account
          </h1>
          <p className="text-muted-foreground">
            Start guiding transformative journeys
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              className="h-12"
              {...register("fullName", {
                required: "Full name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters"
                }
              })}
            />
            {errors.fullName && isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[#AA5D53]"
              >
                {errors.fullName.message}
              </motion.p>
            )}
          </div>

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
                placeholder="Create a password (min. 8 characters)"
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
                className="text-sm text-[#AA5D53]"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className="h-12 pr-10"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: value => value === password || "Passwords do not match"
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[#AA5D53]"
              >
                {errors.confirmPassword.message}
              </motion.p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] h-12 shadow-md hover:shadow-lg transition-all duration-300"
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
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/facilitator/login")}
              className="text-[#4A1C5C] hover:text-[#3A1C4C] font-medium transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
