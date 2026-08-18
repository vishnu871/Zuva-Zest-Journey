import { useState } from "react";
import { useNavigate } from "react-router";
import AuthLayout from "../../components/AuthLayout";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Users, UserCircle } from "lucide-react";
import { motion } from "motion/react";

export default function AuthLanding() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"facilitator" | "participant" | null>(null);

  const handleRoleSelect = (role: "facilitator" | "participant") => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === "facilitator") {
      navigate("/facilitator/login");
    } else if (selectedRole === "participant") {
      navigate("/participant/login");
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to Zuva Life
          </h1>
          <p className="text-muted-foreground">
            Select your role to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-4">
          <Card
            className={`
              p-6 cursor-pointer transition-all duration-300 border-2
              ${selectedRole === "facilitator" 
                ? 'border-[#4A1C5C] bg-[#4A1C5C]/5 shadow-lg' 
                : 'border-border hover:border-[#4A1C5C]/50 hover:shadow-md'
              }
            `}
            onClick={() => handleRoleSelect("facilitator")}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${selectedRole === "facilitator" ? 'bg-[#4A1C5C]' : 'bg-[#3D6D6C]'}
              `}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2" style={{ color: '#4A1C5C' }}>
                  I'm a Facilitator
                </h3>
                <p className="text-sm text-muted-foreground">
                  Guide participants through their journey of reflection and reinvention
                </p>
              </div>
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${selectedRole === "facilitator" 
                  ? 'border-[#4A1C5C] bg-[#4A1C5C]' 
                  : 'border-gray-300'
                }
              `}>
                {selectedRole === "facilitator" && (
                  <div className="w-3 h-3 rounded-full bg-white" />
                )}
              </div>
            </div>
          </Card>

          <Card
            className={`
              p-6 cursor-pointer transition-all duration-300 border-2
              ${selectedRole === "participant" 
                ? 'border-[#3D6D6C] bg-[#3D6D6C]/5 shadow-lg' 
                : 'border-border hover:border-[#3D6D6C]/50 hover:shadow-md'
              }
            `}
            onClick={() => handleRoleSelect("participant")}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${selectedRole === "participant" ? 'bg-[#3D6D6C]' : 'bg-[#4A1C5C]'}
              `}>
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2" style={{ color: '#3D6D6C' }}>
                  I'm a Participant
                </h3>
                <p className="text-sm text-muted-foreground">
                  Navigate your life transition with guided support and reflection
                </p>
              </div>
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${selectedRole === "participant" 
                  ? 'border-[#3D6D6C] bg-[#3D6D6C]' 
                  : 'border-gray-300'
                }
              `}>
                {selectedRole === "participant" && (
                  <div className="w-3 h-3 rounded-full bg-white" />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810] h-12 shadow-md hover:shadow-lg transition-all duration-300"
        >
          Continue
        </Button>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          Your journey of reinvention begins here
        </p>
      </motion.div>
    </AuthLayout>
  );
}
