import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout";
import AuthLanding from "./pages/auth/AuthLanding";
import FacilitatorLogin from "./pages/auth/FacilitatorLogin";
import FacilitatorSignup from "./pages/auth/FacilitatorSignup";
import ParticipantLogin from "./pages/auth/ParticipantLogin";
import ParticipantActivation from "./pages/auth/ParticipantActivation";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AccountSuccess from "./pages/auth/AccountSuccess";
import FacilitatorDashboard from "./pages/dashboard/FacilitatorDashboard";
import ParticipantDashboard from "./pages/dashboard/ParticipantDashboard";
import Journeys from "./pages/journeys/Journeys";
import CreateJourney from "./pages/journeys/CreateJourney";
import JourneyDetail from "./pages/journeys/JourneyDetail";
import ParticipantManagement from "./pages/participants/ParticipantManagement";
import SessionDetail from "./pages/sessions/SessionDetail";
import SessionHistory from "./pages/sessions/SessionHistory";
import UpcomingSessions from "./pages/sessions/UpcomingSessions";
import SessionRouter from "./pages/sessions/SessionRouter";
import ParticipantProfile from "./pages/participant/ParticipantProfile";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: "/", Component: AuthLanding },
      { path: "/facilitator/login", Component: FacilitatorLogin },
      { path: "/facilitator/signup", Component: FacilitatorSignup },
      { path: "/participant/login", Component: ParticipantLogin },
      { path: "/participant/activate", Component: ParticipantActivation },
      { path: "/forgot-password", Component: ForgotPassword },
      { path: "/account-success", Component: AccountSuccess },
      { path: "/facilitator/dashboard", Component: FacilitatorDashboard },
      { path: "/participant/dashboard", Component: ParticipantDashboard },
      { path: "/facilitator/journeys", Component: Journeys },
      { path: "/facilitator/journey/create", Component: CreateJourney },
      { path: "/facilitator/journey/:id", Component: JourneyDetail },
      { path: "/facilitator/participants", Component: ParticipantManagement },
      { path: "/facilitator/sessions", Component: UpcomingSessions },
      { path: "/facilitator/session/:id", Component: SessionDetail },
      // All session boards go through SessionRouter which determines the correct board
      { path: "/facilitator/session/:sessionId/board", Component: SessionRouter },
      { path: "/facilitator/reports", Component: SessionHistory },
      { path: "/participant/sessions", Component: UpcomingSessions },
      { path: "/participant/session/:id", Component: SessionDetail },
      { path: "/participant/session/:sessionId/board", Component: SessionRouter },
      { path: "/participant/history", Component: SessionHistory },
      { path: "/participant/profile", Component: ParticipantProfile },
      { path: "*", Component: NotFound },
    ],
  },
]);

