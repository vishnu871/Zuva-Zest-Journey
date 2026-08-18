import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { toast } from "sonner";

interface ActivationFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function ParticipantActivation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted }
  } = useForm<ActivationFormData>({
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

  const onSubmit = async (data: ActivationFormData) => {
    console.log("✅ PARTICIPANT ACTIVATION - Form submitted with data:", data);
    console.log("🔵 PARTICIPANT ACTIVATION - Role being sent: participant");
    setIsLoading(true);

    try {
      const signupPayload = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: "participant"
      };

      console.log("🔵 PARTICIPANT ACTIVATION - Request payload:", signupPayload);

      // Call backend to create user
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(signupPayload)
        }
      );

      const result = await response.json();
      console.log("✅ PARTICIPANT ACTIVATION - Server response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to activate account");
      }

      toast.success("Account activated successfully!");

      // Navigate to success page
      setTimeout(() => {
        navigate("/account-success", { state: { role: "participant" } });
      }, 500);

    } catch (error) {
      console.error("Activation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to activate account. Please try again.");
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
          onClick={() => navigate("/participant/login")}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Activate Your Invitation
          </h1>
          <p className="text-muted-foreground">
            Complete your account setup to begin your journey
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
                exit={{ opacity: 0 }}
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
                exit={{ opacity: 0 }}
                className="text-sm text-[#AA5D53]"
              >
                {errors.email.message}
              </motion.p>
            )}
            <p className="text-xs text-muted-foreground">
              Use the email address you received the invitation at
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
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
                exit={{ opacity: 0 }}
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
                exit={{ opacity: 0 }}
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
                Activating account...
              </>
            ) : (
              "Activate Account"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already activated?{" "}
            <button
              onClick={() => navigate("/participant/login")}
              className="text-[#3D6D6C] hover:text-[#2C5958] font-medium transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
