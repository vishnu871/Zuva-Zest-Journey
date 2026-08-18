import { useNavigate, useLocation } from "react-router";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function AccountSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "participant";

  const handleContinue = () => {
    if (role === "facilitator") {
      navigate("/facilitator/dashboard");
    } else {
      navigate("/participant/dashboard");
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#3D6D6C]/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-[#3D6D6C]" />
          </div>
        </motion.div>

        {/* Header */}
        <div className="space-y-3">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to Zuva Life!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your account has been successfully created
          </p>
        </div>

        {/* Message */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 className="text-left" style={{ color: '#3D6D6C' }}>
            What's Next?
          </h3>
          {role === "facilitator" ? (
            <ul className="text-left text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#D4A843] mt-1">•</span>
                <span>Create your first Zest Journey</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4A843] mt-1">•</span>
                <span>Invite participants to join</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4A843] mt-1">•</span>
                <span>Guide transformative sessions</span>
              </li>
            </ul>
          ) : (
            <ul className="text-left text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#D4A843] mt-1">•</span>
                <span>View your journey timeline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4A843] mt-1">•</span>
                <span>Access session materials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4A843] mt-1">•</span>
                <span>Track your personal growth</span>
              </li>
            </ul>
          )}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] h-12 shadow-md hover:shadow-lg transition-all duration-300"
        >
          Continue to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Footer */}
        <p className="text-sm text-muted-foreground">
          Your journey of reinvention starts now
        </p>
      </motion.div>
    </AuthLayout>
  );
}
