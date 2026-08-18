// import { useState } from "react";
// import { useNavigate } from "react-router";
// import { useForm } from "react-hook-form";
// import DashboardLayout from "../../components/DashboardLayout";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Input } from "../../components/ui/input";
// import { Label } from "../../components/ui/label";
// import { Textarea } from "../../components/ui/textarea";
// import { ArrowLeft, Loader2 } from "lucide-react";
// import { motion } from "motion/react";
// import { toast } from "sonner";
// import { createClient } from "../../../utils/supabase/client";
// import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;
// const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

// interface JourneyFormData {
//   title: string;
//   description: string;
// }

// export default function CreateJourney() {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const { register, handleSubmit, formState: { errors } } = useForm<JourneyFormData>();

//   const onSubmit = async (data: JourneyFormData) => {
//     setIsLoading(true);

//     try {
//       const supabase = createClient();
//       const { data: { user } } = await supabase.auth.getUser();

//       if (!user) {
//         toast.error("You must be logged in to create a journey.");
//         navigate("/facilitator/login");
//         return;
//       }

//       const res = await fetch(`${API}/journeys`, {
//         method: "POST",
//         headers: HEADERS,
//         body: JSON.stringify({
//           title: data.title,
//           description: data.description,
//           facilitatorId: user.id,
//           facilitatorEmail: user.email,
//         }),
//       });

//       const result = await res.json();

//       if (!res.ok || !result.success) {
//         throw new Error(result.error || "Failed to create journey");
//       }

//       toast.success("Journey created! Session 1 board is ready.");
//       navigate(`/facilitator/journey/${result.journey.id}`);
//     } catch (error: any) {
//       toast.error(error.message || "Failed to create journey. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <DashboardLayout role="facilitator">
//       <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//           <Button variant="ghost" onClick={() => navigate("/facilitator/dashboard")} className="mb-4 -ml-2">
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back to Dashboard
//           </Button>
//           <h1 className="mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
//             Create New Journey
//           </h1>
//           <p className="text-muted-foreground">
//             A Zest Journey includes Session 1: the full 6-step reflection board for your participant.
//           </p>
//         </motion.div>

//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <Card className="p-8">
//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="title">Journey Title</Label>
//                 <Input
//                   id="title"
//                   placeholder="e.g., Sarah's Zest Journey — 2026"
//                   className="h-12"
//                   {...register("title", {
//                     required: "Journey title is required",
//                     minLength: { value: 3, message: "Title must be at least 3 characters" },
//                   })}
//                 />
//                 {errors.title && <p className="text-sm text-[#AA5D53]">{errors.title.message}</p>}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
//                 <Textarea
//                   id="description"
//                   placeholder="Brief description of this participant's journey goals..."
//                   rows={3}
//                   {...register("description")}
//                 />
//               </div>

//               <div className="bg-[#EBE2D6]/70 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
//                 <p className="font-medium text-foreground">What gets created:</p>
//                 <ul className="space-y-1 list-disc list-inside">
//                   <li>A Zest Journey record</li>
//                   <li>Session 1 board (Book of Life → Recognition Word)</li>
//                   <li>Participant link (add email on the next screen)</li>
//                 </ul>
//               </div>

//               <div className="flex gap-4 pt-2">
//                 <Button type="button" variant="outline" onClick={() => navigate("/facilitator/dashboard")} className="flex-1">
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={isLoading}
//                   className="flex-1 bg-[#D4A843] hover:bg-[#C49835] text-[#2C1810]"
//                 >
//                   {isLoading ? (
//                     <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
//                   ) : (
//                     "Create Journey"
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </Card>
//         </motion.div>
//       </div>
//     </DashboardLayout>
//   );
// }



import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import DashboardLayout from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { createClient } from "../../../utils/supabase/client";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-dc18f5b2`;

const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${publicAnonKey}`,
};

interface JourneyFormData {
  title: string;
  description: string;
  sessionNumber: "1" | "2" | "3" | "4";
}

const SESSION_OPTIONS = [
  {
    value: "1",
    label: "Session 1",
    description: "Book of Life → Recognition Word",
  },
  {
    value: "2",
    label: "Session 2",
    description: "Continue the participant's journey",
  },
  {
    value: "3",
    label: "Session 3",
    description: "Continue the participant's journey",
  },
  {
    value: "4",
    label: "Session 4",
    description: "Final session of the journey",
  },
] as const;

export default function CreateJourney() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JourneyFormData>({
    defaultValues: {
      sessionNumber: "1",
    },
  });

  const onSubmit = async (data: JourneyFormData) => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to create a journey.");
        navigate("/facilitator/login");
        return;
      }

      const sessionNumber = Number(data.sessionNumber);

      const res = await fetch(`${API}/journeys`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description?.trim() || "",
          facilitatorId: user.id,
          facilitatorEmail: user.email,
          sessionNumber,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create journey");
      }

      toast.success(
        `Journey created! ${result.session?.label || `Session ${sessionNumber}`} is ready.`
      );

      navigate(`/facilitator/journey/${result.journey.id}`);
    } catch (error: any) {
      console.error("Create journey error:", error);

      toast.error(
        error?.message || "Failed to create journey. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="facilitator">
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/facilitator/dashboard")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1
            className="mb-2"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Create New Journey
          </h1>

          <p className="text-muted-foreground">
            Create a journey and choose which session you want to start with.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Journey Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Journey Title</Label>

                <Input
                  id="title"
                  placeholder="e.g., Sarah's Zest Journey — 2026"
                  className="h-12"
                  {...register("title", {
                    required: "Journey title is required",
                    minLength: {
                      value: 3,
                      message: "Title must be at least 3 characters",
                    },
                  })}
                />

                {errors.title && (
                  <p className="text-sm text-[#AA5D53]">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>

                <Textarea
                  id="description"
                  placeholder="Brief description of this participant's journey goals..."
                  rows={3}
                  {...register("description")}
                />
              </div>

              {/* Session Selection */}
              <div className="space-y-2">
                <Label htmlFor="sessionNumber">
                  Starting Session
                </Label>

                <div className="relative">
                  <select
                    id="sessionNumber"
                    className="
                      w-full
                      h-12
                      appearance-none
                      rounded-md
                      border
                      border-input
                      bg-background
                      px-3
                      pr-10
                      text-sm
                      outline-none
                      focus:ring-2
                      focus:ring-[#4A1C5C]/25
                    "
                    {...register("sessionNumber", {
                      required: "Please select a session",
                    })}
                  >
                    {SESSION_OPTIONS.map((session) => (
                      <option
                        key={session.value}
                        value={session.value}
                      >
                        {session.label} — {session.description}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    className="
                      pointer-events-none
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-muted-foreground
                    "
                  />
                </div>

                {errors.sessionNumber && (
                  <p className="text-sm text-[#AA5D53]">
                    {errors.sessionNumber.message}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Choose the session you want to make available when this
                  journey is created.
                </p>
              </div>

              {/* What gets created */}
              <div className="bg-[#EBE2D6]/70 rounded-xl p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">
                  What gets created:
                </p>

                <ul className="space-y-1 list-disc list-inside">
                  <li>A new Zest Journey record</li>
                  <li>Four session records linked to the journey</li>
                  <li>The selected session is immediately available</li>
                  <li>The other sessions remain locked</li>
                  <li>Participant can be linked after creation</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate("/facilitator/dashboard")
                  }
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="
                    flex-1
                    bg-[#D4A843]
                    hover:bg-[#C49835]
                    text-[#2C1810]
                  "
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Journey"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}