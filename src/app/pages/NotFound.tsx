import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Decorative Element */}
        <div className="mb-8 relative">
          <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto opacity-20">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#4A1C5C" strokeWidth="1"/>
            <circle cx="100" cy="100" r="75" fill="none" stroke="#3D6D6C" strokeWidth="1"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#D4A843" strokeWidth="1"/>
            <circle cx="100" cy="100" r="45" fill="none" stroke="#AA5D53" strokeWidth="1"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-8xl font-bold text-[#4A1C5C]" style={{ fontFamily: 'Playfair Display, serif' }}>
              404
            </h1>
          </div>
        </div>

        {/* Content */}
        <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#4A1C5C' }}>
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground mt-8">
          Need help? Your journey continues at Zuva Life
        </p>
      </motion.div>
    </div>
  );
}
