import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted }
  } = useForm<ForgotPasswordFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#3D6D6C]/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#3D6D6C]" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 style={{ fontFamily: 'Playfair Display, serif' }}>
              Check Your Email
            </h1>
            <p className="text-muted-foreground">
              We've sent password reset instructions to your email address.
            </p>
          </div>

          <div className="bg-[#EBE2D6] border border-[#4A1C5C]/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </p>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] h-12 shadow-md hover:shadow-lg transition-all duration-300"
          >
            Back to Sign In
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

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
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you instructions to reset your password.
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] h-12 shadow-md hover:shadow-lg transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending instructions...
              </>
            ) : (
              "Send Reset Instructions"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <button
              onClick={() => navigate("/")}
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
