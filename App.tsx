import React, { useEffect } from 'react';
import { useStore } from './store';
import { AppState } from './types';
import { Navigation } from './components/Navigation';
import { BottomNav } from './components/BottomNav';
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
import { SketchUpImport } from './screens/SketchUpImport';

const App: React.FC = () => {
  const { currentScreen, isAuthenticated, hasCompletedOnboarding, setScreen } = useStore();
  const isSketchUpSession = new URLSearchParams(window.location.search).get('host') === 'sketchup-ext' && !!new URLSearchParams(window.location.search).get('syncPort');

  useEffect(() => {
    if (isSketchUpSession) return;
    if (!hasCompletedOnboarding && currentScreen !== AppState.ONBOARDING) setScreen(AppState.ONBOARDING);
    else if (hasCompletedOnboarding && !isAuthenticated && currentScreen !== AppState.AUTH) setScreen(AppState.AUTH);
  }, [hasCompletedOnboarding, isAuthenticated, currentScreen, setScreen, isSketchUpSession]);

  if (isSketchUpSession) return <SketchUpImport />;

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

  const isFullScreen = currentScreen === AppState.ONBOARDING || currentScreen === AppState.AUTH || currentScreen === AppState.AR || currentScreen === AppState.VR_SHOWROOM || currentScreen === AppState.EDITOR || currentScreen === AppState.CREATE;
  if (isFullScreen) return <div className="w-full h-[100dvh] bg-black text-white overflow-hidden relative flex flex-col">{renderScreen()}</div>;

  return <div className="flex w-full h-[100dvh] bg-dark-bg text-white overflow-hidden font-sans selection:bg-brand-gold selection:text-black">
    <div className="hidden md:block w-64 h-full flex-shrink-0 z-50 shadow-2xl"><Navigation /></div>
    <main className="flex-1 h-full overflow-y-auto relative scroll-smooth bg-gradient-to-br from-dark-bg to-[#0B1221] no-scrollbar">
      <div className="min-h-full w-full max-w-[1920px] mx-auto pb-32 md:pb-8">{renderScreen()}</div>
      <BottomNav />
    </main>
  </div>;
};

export default App;
