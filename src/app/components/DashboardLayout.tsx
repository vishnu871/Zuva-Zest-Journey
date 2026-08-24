// import { ReactNode, useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router";
// import { Sprout, Home, Users, Calendar, FileText, LogOut, FolderOpen, BarChart3, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
// import { Button } from "./ui/button";
// import { createClient } from "../../utils/supabase/client";
// import { toast } from "sonner";

// interface DashboardLayoutProps {
//   children: ReactNode;
//   role: "facilitator" | "participant";
// }

// export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Sidebar state management
//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if mobile on mount and window resize
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 1024);
//     };

//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   // Load sidebar preference from localStorage (desktop only)
//   useEffect(() => {
//     if (!isMobile) {
//       const savedState = localStorage.getItem('sidebar-collapsed');
//       if (savedState !== null) {
//         setIsSidebarCollapsed(savedState === 'true');
//       }
//     }
//   }, [isMobile]);

//   // Save sidebar preference to localStorage
//   const toggleSidebar = () => {
//     const newState = !isSidebarCollapsed;
//     setIsSidebarCollapsed(newState);
//     localStorage.setItem('sidebar-collapsed', String(newState));
//   };

//   // Close mobile menu when route changes
//   useEffect(() => {
//     setIsMobileMenuOpen(false);
//   }, [location.pathname]);

//   const facilitatorMenuItems = [
//     { icon: Home, label: "Dashboard", path: "/facilitator/dashboard" },
//     { icon: FolderOpen, label: "Journeys", path: "/facilitator/journeys" },
//     { icon: Users, label: "Participants", path: "/facilitator/participants" },
//     { icon: Calendar, label: "Sessions", path: "/facilitator/sessions" },
//     { icon: BarChart3, label: "Reports", path: "/facilitator/reports" },
//   ];

//   const participantMenuItems = [
//     { icon: Home, label: "Dashboard", path: "/participant/dashboard" },
//     { icon: Calendar, label: "My Sessions", path: "/participant/sessions" },
//     { icon: FileText, label: "Session History", path: "/participant/history" },
//   ];

//   const menuItems = role === "facilitator" ? facilitatorMenuItems : participantMenuItems;

//   const handleLogout = async () => {
//     try {
//       const supabase = createClient();
//       await supabase.auth.signOut();
//       toast.success("Signed out successfully");
//       navigate("/");
//     } catch (error) {
//       console.error("Logout error:", error);
//       toast.error("Failed to sign out");
//     }
//   };

//   const SidebarContent = () => (
//     <>
//       {/* Logo */}
//       <div className={`p-6 border-b border-white/10 flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed && !isMobile ? 'px-3' : ''}`}>
//         <div className={`flex items-center ${isSidebarCollapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
//           <div className="w-10 h-10 rounded-full bg-[#D4A843] flex items-center justify-center flex-shrink-0">
//             <Sprout className="w-6 h-6 text-[#4A1C5C]" />
//           </div>
//           <div className={`transition-all duration-300 overflow-hidden ${isSidebarCollapsed && !isMobile ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
//             <h2 className="font-bold text-lg whitespace-nowrap" style={{ fontFamily: 'Playfair Display, serif' }}>
//               Zuva Life
//             </h2>
//             <p className="text-xs text-white/70 whitespace-nowrap">Zest Journey</p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation - Scrollable */}
//       <nav className="flex-1 p-4 overflow-y-auto">
//         <div className="space-y-1">
//           {menuItems.map((item) => {
//             const Icon = item.icon;
//             const isActive = location.pathname === item.path;

//             return (
//               <button
//                 key={item.path}
//                 onClick={() => navigate(item.path)}
//                 className={`
//                   w-full flex items-center gap-3 px-4 py-3 rounded-lg
//                   transition-all duration-200 relative group
//                   ${isActive
//                     ? 'bg-[#D4A843] text-[#4A1C5C]'
//                     : 'text-white hover:bg-white/10'
//                   }
//                   ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}
//                 `}
//                 title={isSidebarCollapsed && !isMobile ? item.label : ''}
//               >
//                 <Icon className="w-5 h-5 flex-shrink-0" />
//                 <span className={`font-medium transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed && !isMobile ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
//                   {item.label}
//                 </span>

//                 {/* Tooltip for collapsed state */}
//                 {isSidebarCollapsed && !isMobile && (
//                   <div className="absolute left-full ml-2 px-3 py-2 bg-[#4A1C5C] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-white/10">
//                     {item.label}
//                   </div>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </nav>

//       {/* User Section - Pinned to Bottom */}
//       <div className={`p-4 border-t border-white/10 flex-shrink-0 mt-auto transition-all duration-300 ${isSidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
//         <div className={`mb-3 px-4 transition-all duration-300 overflow-hidden ${isSidebarCollapsed && !isMobile ? 'w-0 h-0 opacity-0' : 'w-auto h-auto opacity-100'}`}>
//           <p className="text-sm text-white/70">Signed in as</p>
//           <p className="font-medium text-white capitalize">{role}</p>
//         </div>
//         <Button
//           onClick={handleLogout}
//           variant="ghost"
//           className={`w-full text-white hover:bg-white/10 hover:text-white transition-all duration-200 relative group ${isSidebarCollapsed && !isMobile ? 'justify-center px-2' : 'justify-start'}`}
//           title={isSidebarCollapsed && !isMobile ? 'Sign Out' : ''}
//         >
//           <LogOut className="w-5 h-5 flex-shrink-0" />
//           <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed && !isMobile ? 'w-0 opacity-0 overflow-hidden ml-0' : 'w-auto opacity-100 ml-3'}`}>
//             Sign Out
//           </span>

//           {/* Tooltip for collapsed state */}
//           {isSidebarCollapsed && !isMobile && (
//             <div className="absolute left-full ml-2 px-3 py-2 bg-[#4A1C5C] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-white/10">
//               Sign Out
//             </div>
//           )}
//         </Button>
//       </div>
//     </>
//   );

//   return (
//     <div className="min-h-screen flex bg-background">
//       {/* Mobile Header */}
//       {isMobile && (
//         <div className="fixed top-0 left-0 right-0 h-16 bg-[#4A1C5C] text-white flex items-center justify-between px-4 z-40 shadow-lg">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-[#D4A843] flex items-center justify-center">
//               <Sprout className="w-5 h-5 text-[#4A1C5C]" />
//             </div>
//             <h2 className="font-bold text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
//               Zuva Life
//             </h2>
//           </div>
//           <button
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//             aria-label="Toggle menu"
//           >
//             {isMobileMenuOpen ? (
//               <X className="w-6 h-6" />
//             ) : (
//               <Menu className="w-6 h-6" />
//             )}
//           </button>
//         </div>
//       )}

//       {/* Desktop Sidebar Toggle Button */}
//       {!isMobile && (
//         <button
//           onClick={toggleSidebar}
//           className="fixed top-6 left-[calc(theme(spacing.64)-1rem)] z-50 w-8 h-8 bg-[#D4A843] hover:bg-[#C49835] text-[#4A1C5C] rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
//           style={{
//             left: isSidebarCollapsed ? 'calc(5rem - 1rem)' : 'calc(16rem - 1rem)',
//           }}
//           aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//         >
//           {isSidebarCollapsed ? (
//             <ChevronRight className="w-5 h-5" />
//           ) : (
//             <ChevronLeft className="w-5 h-5" />
//           )}
//         </button>
//       )}

//       {/* Mobile Overlay */}
//       {isMobile && isMobileMenuOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}

//       {/* Sidebar - Desktop & Tablet */}
//       {!isMobile && (
//         <aside
//           className={`bg-[#4A1C5C] text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out ${
//             isSidebarCollapsed ? 'w-20' : 'w-64'
//           }`}
//         >
//           <SidebarContent />
//         </aside>
//       )}

//       {/* Sidebar - Mobile (Off-canvas) */}
//       {isMobile && (
//         <aside
//           className={`fixed top-0 left-0 bottom-0 w-64 bg-[#4A1C5C] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out ${
//             isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
//           }`}
//         >
//           <SidebarContent />
//         </aside>
//       )}

//       {/* Main Content */}
//       <main className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
//         {children}
//       </main>
//     </div>
//   );
// }


import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Home,
  Users,
  Calendar,
  FileText,
  LogOut,
  FolderOpen,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "../../utils/supabase/client";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "facilitator" | "participant";
  userName?: string;
}

export default function DashboardLayout({
  children,
  role,
  userName: propUserName,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar state management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [displayName, setDisplayName] = useState<string>(propUserName || "");

  // Load user name from Supabase auth if not passed via props
  useEffect(() => {
    if (propUserName) {
      setDisplayName(propUserName);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          const user = session.user;
          const name =
            user.user_metadata?.name ||
            user.user_metadata?.fullName ||
            user.user_metadata?.full_name ||
            "";
          if (name) {
            setDisplayName(name);
          } else if (user.email) {
            const prefix = user.email.split("@")[0];
            setDisplayName(prefix);
          }
        }
      } catch (err) {
        console.error("[DashboardLayout] Error fetching user:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [propUserName]);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load sidebar preference from localStorage (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem("sidebar-collapsed");

      if (savedState !== null) {
        setIsSidebarCollapsed(savedState === "true");
      }
    }
  }, [isMobile]);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;

    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const facilitatorMenuItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/facilitator/dashboard",
    },
    {
      icon: FolderOpen,
      label: "Journeys",
      path: "/facilitator/journeys",
    },
    {
      icon: Users,
      label: "Participants",
      path: "/facilitator/participants",
    },
    {
      icon: Calendar,
      label: "Sessions",
      path: "/facilitator/sessions",
    },
    {
      icon: BarChart3,
      label: "Reports",
      path: "/facilitator/reports",
    },
  ];

  const participantMenuItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/participant/dashboard",
    },
    {
      icon: Calendar,
      label: "My Sessions",
      path: "/participant/sessions",
    },
    {
      icon: FileText,
      label: "Session History",
      path: "/participant/history",
    },
  ];

  const menuItems =
    role === "facilitator"
      ? facilitatorMenuItems
      : participantMenuItems;

  const handleLogout = async () => {
    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out");
    }
  };

  const SidebarContent = () => (
    <>
      {/* ─────────────────────────────────────────────
          Logo / Brand
      ───────────────────────────────────────────── */}
      <div
        className={`
          p-6 border-b border-white/10 flex-shrink-0
          transition-all duration-300
          ${isSidebarCollapsed && !isMobile ? "px-3" : ""}
        `}
      >
        <div
          className={`
            flex items-center
            ${isSidebarCollapsed && !isMobile
              ? "justify-center"
              : "gap-3"
            }
          `}
        >
          {/* Zuva Life Logo */}
          <div
            className={`
              flex items-center justify-center
              flex-shrink-0
              ${isSidebarCollapsed && !isMobile
                ? "w-10 h-10"
                : "w-10 h-10"
              }
            `}
          >
            <img
              src="/ZL/ZL - Icon White.png"
              alt="Zuva Life"
              className="w-10 h-10 object-contain"
            />
          </div>

          {/* Brand Name */}
          <div
            className={`
              transition-all duration-300
              overflow-hidden
              ${
                isSidebarCollapsed && !isMobile
                  ? "w-0 opacity-0"
                  : "w-auto opacity-100"
              }
            `}
          >
            <h2
              className="font-bold text-lg whitespace-nowrap text-white leading-tight"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Zuva Life
            </h2>

            <p className="text-xs text-white/70 whitespace-nowrap mt-0.5">
              Zest Journey
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          Navigation
      ───────────────────────────────────────────── */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3
                  px-4 py-3 rounded-lg
                  transition-all duration-200
                  relative group
                  ${
                    isActive
                      ? "bg-[#D4A843] text-[#4A1C5C]"
                      : "text-white hover:bg-white/10"
                  }
                  ${
                    isSidebarCollapsed && !isMobile
                      ? "justify-center"
                      : ""
                  }
                `}
                title={
                  isSidebarCollapsed && !isMobile
                    ? item.label
                    : ""
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />

                <span
                  className={`
                    font-medium
                    transition-all duration-300
                    whitespace-nowrap
                    ${
                      isSidebarCollapsed && !isMobile
                        ? "w-0 opacity-0 overflow-hidden"
                        : "w-auto opacity-100"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && !isMobile && (
                  <div
                    className="
                      absolute left-full ml-2
                      px-3 py-2
                      bg-[#4A1C5C]
                      text-white
                      text-sm
                      rounded-lg
                      opacity-0 invisible
                      group-hover:opacity-100
                      group-hover:visible
                      transition-all duration-200
                      whitespace-nowrap
                      z-50
                      shadow-lg
                      border border-white/10
                    "
                  >
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─────────────────────────────────────────────
          User Section
      ───────────────────────────────────────────── */}
      <div
        className={`
          p-4
          border-t border-white/10
          flex-shrink-0
          mt-auto
          transition-all duration-300
          ${
            isSidebarCollapsed && !isMobile
              ? "px-2"
              : ""
          }
        `}
      >
        <div
          className={`
            mb-3 px-4
            transition-all duration-300
            overflow-hidden
            ${
              isSidebarCollapsed && !isMobile
                ? "w-0 h-0 opacity-0"
                : "w-auto h-auto opacity-100"
            }
          `}
        >
          <p className="text-xs text-white/70">
            Signed in as
          </p>

          <p
            className="font-medium text-white text-sm truncate mt-0.5"
            title={
              displayName ||
              (role === "facilitator"
                ? "Facilitator"
                : "Participant")
            }
          >
            {displayName ||
              (role === "facilitator"
                ? "Facilitator"
                : "Participant")}
          </p>
        </div>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className={`
            w-full
            text-white
            hover:bg-white/10
            hover:text-white
            transition-all duration-200
            relative group
            ${
              isSidebarCollapsed && !isMobile
                ? "justify-center px-2"
                : "justify-start"
            }
          `}
          title={
            isSidebarCollapsed && !isMobile
              ? "Sign Out"
              : ""
          }
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />

          <span
            className={`
              transition-all duration-300
              whitespace-nowrap
              ${
                isSidebarCollapsed && !isMobile
                  ? "w-0 opacity-0 overflow-hidden ml-0"
                  : "w-auto opacity-100 ml-3"
              }
            `}
          >
            Sign Out
          </span>

          {/* Tooltip for collapsed state */}
          {isSidebarCollapsed && !isMobile && (
            <div
              className="
                absolute left-full ml-2
                px-3 py-2
                bg-[#4A1C5C]
                text-white
                text-sm
                rounded-lg
                opacity-0 invisible
                group-hover:opacity-100
                group-hover:visible
                transition-all duration-200
                whitespace-nowrap
                z-50
                shadow-lg
                border border-white/10
              "
            >
              Sign Out
            </div>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">

      {/* ─────────────────────────────────────────────
          Mobile Header
      ───────────────────────────────────────────── */}
      {isMobile && (
        <div
          className="
            fixed top-0 left-0 right-0
            h-16
            bg-[#4A1C5C]
            text-white
            flex items-center justify-between
            px-4
            z-40
            shadow-lg
          "
        >
          <div className="flex items-center gap-3">

            {/* Mobile Logo */}
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/ZL/ZL - Icon White.png"
                alt="Zuva Life"
                className="w-8 h-8 object-contain"
              />
            </div>

            {/* Mobile Brand */}
            <div className="flex flex-col">
              <h2
                className="font-bold text-base leading-tight"
                style={{
                  fontFamily: "Playfair Display, serif",
                }}
              >
                Zuva Life
              </h2>

              <span className="text-[10px] text-white/70 leading-tight">
                Zest Journey
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              setIsMobileMenuOpen(!isMobileMenuOpen)
            }
            className="
              p-2
              hover:bg-white/10
              rounded-lg
              transition-colors
            "
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          Desktop Sidebar Toggle
      ───────────────────────────────────────────── */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="
            fixed
            top-6
            z-50
            w-8 h-8
            bg-[#D4A843]
            hover:bg-[#C49835]
            text-[#4A1C5C]
            rounded-full
            flex items-center justify-center
            shadow-lg
            transition-all duration-300
          "
          style={{
            left: isSidebarCollapsed
              ? "calc(5rem - 1rem)"
              : "calc(16rem - 1rem)",
          }}
          aria-label={
            isSidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      )}

      {/* ─────────────────────────────────────────────
          Mobile Overlay
      ───────────────────────────────────────────── */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="
            fixed inset-0
            bg-black/50
            z-40
            transition-opacity duration-300
          "
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─────────────────────────────────────────────
          Desktop / Tablet Sidebar
      ───────────────────────────────────────────── */}
      {!isMobile && (
        <aside
          className={`
            bg-[#4A1C5C]
            text-white
            flex flex-col
            h-screen
            sticky top-0
            transition-all duration-300
            ease-in-out
            ${
              isSidebarCollapsed
                ? "w-20"
                : "w-64"
            }
          `}
        >
          <SidebarContent />
        </aside>
      )}

      {/* ─────────────────────────────────────────────
          Mobile Sidebar
      ───────────────────────────────────────────── */}
      {isMobile && (
        <aside
          className={`
            fixed
            top-0 left-0 bottom-0
            w-64
            bg-[#4A1C5C]
            text-white
            flex flex-col
            z-50
            transition-transform duration-300
            ease-in-out
            ${
              isMobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          <SidebarContent />
        </aside>
      )}

      {/* ─────────────────────────────────────────────
          Main Content
      ───────────────────────────────────────────── */}
      <main
        className={`
          flex-1
          overflow-auto
          ${isMobile ? "pt-16" : ""}
        `}
      >
        {children}
      </main>
    </div>
  );
}