import React, { useEffect, useState } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import Profile from "./pages/Profile";
import SignUp from "./pages/SignUp";
import Users from "./pages/Users";
import Main from "./components/layout/Main";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/login/LoginPage";
import CreteItems from "./pages/Store/CreateItems/CreateItems";
import EditStock from "./pages/Store/EditStock/EditStock";
import BulkUploadItems from "./pages/Store/CreateItems/BulkUploadItems";
import Cookies from "js-cookie";
import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import ManageProject from "./pages/PM/ManageProject";
import InspectionForm from "./pages/PM/InspectionForm";
import StockTracker from "./pages/STOCK_CHECK/StockTracker";
import Dashboard from './pages/PM/Dashboard';
import CreateJob from './pages/PM/CreateJob';
import JobDetails from './pages/PM/JobDetails';
import Jobs from './pages/PM/Jobs';
import SupervisorDashboard from './pages/PM/SupervisorDashboard';

import PwaInstallPrompt from "./components/pwa/PwaInstallPrompt";
import { safeNavigate } from "./utils/navigation";

function App() {
  const [lastActivity, setLastActivity] = useState(Date.now());
  let rememberedUser = Cookies.get("rememberedUser");
  const is_cookie_set = Boolean(rememberedUser);
  let ROLE1 = "USER";

  if (rememberedUser) {
    rememberedUser = JSON.parse(rememberedUser);
    const { ROLE } = rememberedUser;
    ROLE1 = ROLE;
  }

  // Check activity every 1 minute
  // useEffect(() => {
  //   const handleInactivity = () => {
  //     if (Date.now() - lastActivity >= 900000) { // 15 minutes of inactivity
  //       Cookies.remove("rememberedUser");
  //       window.location.href = "/"; // Redirect to login page
  //     }
  //   };
  //
  //   const activityEvents = ["mousemove", "keydown", "click"];
  //   const resetInactivity = () => setLastActivity(Date.now());
  //
  //   // Add event listeners to track activity
  //   activityEvents.forEach(event => {
  //     window.addEventListener(event, resetInactivity);
  //   });
  //
  //   // Check for inactivity every minute (60,000ms)
  //   const inactivityCheckInterval = setInterval(handleInactivity, 60000);
  //
  //   // Clean up event listeners and interval when the component unmounts
  //   return () => {
  //     activityEvents.forEach(event => {
  //       window.removeEventListener(event, resetInactivity);
  //     });
  //     clearInterval(inactivityCheckInterval);
  //   };
  // }, [lastActivity]);

  useEffect(() => {
    if (is_cookie_set && (window.location.pathname === '/' || window.location.hash === '' || window.location.hash === '#/')) {
      safeNavigate("/items"); // Redirect to '/items' if a valid cookie exists
    }
  }, [is_cookie_set]);

  return (
      <div className="App">
        <PwaInstallPrompt />
        <Switch>
          <Route path="/" exact component={Login} />
          <Route exact path="/sign-up" component={SignUp} />
          <ErrorBoundary>
            <Main>
              <Route exact path="/items" component={EditStock} />
              <Route exact path="/profile" component={Profile} />
              <Route exact path="/users" component={Users} />
              <Route exact path="/add-items" component={CreteItems} />
              <Route exact path="/add-items-csv" component={BulkUploadItems} />
              <Route exact path="/manage-project" component={ManageProject} />
              <Route exact path="/inspection-form" component={InspectionForm} />
              <Route exact path="/stock-tracker" component={StockTracker} />
              {/* Project Management pages */}
              <Route path="/pm/dashboard" component={Dashboard} />
              <Route path="/pm/jobs" component={Jobs} />
              {/*<Route path="/pm/jobs/create" component={CreateJob} />*/}
              <Route path="/pm/job/:jobId" component={JobDetails} />
              <Route path="/pm/mytasks" component={SupervisorDashboard} />
            </Main>
          </ErrorBoundary>
        </Switch>
      </div>
  );
}

export default App;
