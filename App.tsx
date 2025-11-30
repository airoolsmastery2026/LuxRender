
import React, { useEffect } from 'react';
import { useStore } from './store';
import { AppState } from './types';
import { Navigation } from './components/Navigation'; // Desktop Sidebar
import { BottomNav } from './components/BottomNav'; // Mobile Bottom Nav

// Screens
import { Onboarding } from './screens/Onboarding';
import { Auth } from './screens/Auth';
import { Home } from './screens/Home';
import { Create } from './screens/Create';
import { Projects } from './screens/Projects';
import { Templates } from './screens/Templates';
import { CRM } from './screens/CRM';
import { Profile } from './screens/Profile';
import { Editor } from './screens/Editor';
import { ARMode } from './screens/ARMode';
import { Assets } from './screens/Assets';
import { Team } from './screens/Team';
import { Analytics } from './screens/Analytics';
import { ProjectDetail } from './screens/ProjectDetail';
import { VRShowroom } from './screens/VRShowroom';

const App: React.FC = () => {
  const { currentScreen, isAuthenticated, hasCompletedOnboarding, setScreen } = useStore();

  // Route Guard
  useEffect(() => {
    if (!hasCompletedOnboarding && currentScreen !== AppState.ONBOARDING) {
        setScreen(AppState.ONBOARDING);
    } else if (hasCompletedOnboarding && !isAuthenticated && currentScreen !== AppState.AUTH) {
        setScreen(AppState.AUTH);
    }
  }, [hasCompletedOnboarding, isAuthenticated, currentScreen, setScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case AppState.ONBOARDING: return <Onboarding />;
      case AppState.AUTH: return <Auth />;
      case AppState.HOME: return <Home />;
      case AppState.CREATE: return <Create />;
      case AppState.PROJECTS: return <Projects />;
      case AppState.TEMPLATES: return <Templates />;
      case AppState.CRM: return <CRM />;
      case AppState.PROFILE: return <Profile />;
      case AppState.EDITOR: return <Editor />;
      case AppState.AR: return <ARMode />;
      case AppState.ASSETS: return <Assets />;
      case AppState.TEAM: return <Team />;
      case AppState.ANALYTICS: return <Analytics />;
      case AppState.PROJECT_DETAIL: return <ProjectDetail />;
      case AppState.VR_SHOWROOM: return <VRShowroom />;
      default: return <Home />;
    }
  };

  // Full Screen modes (No Sidebar/Nav, No Padding)
  // These screens take over the entire viewport for immersive experience
  const isFullScreen = 
    currentScreen === AppState.ONBOARDING || 
    currentScreen === AppState.AUTH || 
    currentScreen === AppState.AR || 
    currentScreen === AppState.VR_SHOWROOM || 
    currentScreen === AppState.EDITOR ||
    currentScreen === AppState.CREATE;

  if (isFullScreen) {
      return (
          // Use h-[100dvh] to ensure it fits mobile viewport perfectly including address bars
          <div className="w-full h-[100dvh] bg-black text-white overflow-hidden relative flex flex-col">
              {renderScreen()}
          </div>
      );
  }

  return (
    // Use h-[100dvh] for the main app layout as well
    <div className="flex w-full h-[100dvh] bg-dark-bg text-white overflow-hidden font-sans selection:bg-brand-gold selection:text-black">
       {/* Desktop Sidebar (Fixed width, hidden on mobile) */}
       <div className="hidden md:block w-64 h-full flex-shrink-0 z-50 shadow-2xl">
           <Navigation />
       </div>
       
       {/* Main Content Area (Scrollable) */}
       <main className="flex-1 h-full overflow-y-auto relative scroll-smooth bg-gradient-to-br from-dark-bg to-[#0B1221] no-scrollbar">
           {/* Padding bottom added to ensure content isn't hidden behind mobile nav */}
           <div className="min-h-full w-full max-w-[1920px] mx-auto pb-32 md:pb-8">
                {renderScreen()}
           </div>
           
           {/* Global Mobile Navigation (Visible only on mobile, inside main layout) */}
           <BottomNav />
       </main>
    </div>
  );
};

export default App;
