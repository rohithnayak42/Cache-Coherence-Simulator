import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import MainLayout from './components/layout/MainLayout';
import WelcomeScreen from './components/screens/WelcomeScreen';
import ProblemDescriptionScreen from './components/screens/ProblemDescriptionScreen';
import ProtocolSelectorScreen from './components/screens/ProtocolSelectorScreen';
import SimulationScreen from './components/screens/SimulationScreen';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

function App() {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [isBwMode, setIsBwMode] = useState(() => {
    return localStorage.getItem('theme-mode') === 'bw';
  });

  useEffect(() => {
    if (isBwMode) {
      document.body.classList.add('theme-bw');
      localStorage.setItem('theme-mode', 'bw');
    } else {
      document.body.classList.remove('theme-bw');
      localStorage.setItem('theme-mode', 'default');
    }
  }, [isBwMode]);

  const toggleTheme = () => setIsBwMode(!isBwMode);

  const handleProtocolSelect = (protocol) => {
    setSelectedProtocol(protocol);
    setCurrentStep('loading');
    
    // Brief simulated loading to clear states and prepare the Heavy 3D Simulation
    setTimeout(() => {
      setCurrentStep('simulation');
    }, 800);
  };

  const renderScreen = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen isBwMode={isBwMode} onNext={() => setCurrentStep('problem')} />;
      case 'problem':
        return <ProblemDescriptionScreen 
          onNext={() => setCurrentStep('protocol')} 
          onBack={() => setCurrentStep('welcome')} 
        />;
      case 'protocol':
        return <ProtocolSelectorScreen 
          onSelect={handleProtocolSelect}
          onBack={() => setCurrentStep('problem')} 
        />;
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
             <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_15px_#3b82f6]" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
             </div>
             <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse">
                Initializing Simulation Engine...
              </h2>
             <p className="text-slate-400 font-mono text-sm max-w-xs mx-auto opacity-70">
                Loading memory modules, configuring cache paths, and booting processor cores for {selectedProtocol}.
             </p>
          </div>
        );
      case 'simulation':
        return (
          <ErrorBoundary onReset={() => setCurrentStep('protocol')}>
            <SimulationScreen 
              protocol={selectedProtocol || 'MSI'}
              onBack={() => setCurrentStep('protocol')} 
            />
          </ErrorBoundary>
        );
      default:
        return <WelcomeScreen isBwMode={isBwMode} onNext={() => setCurrentStep('problem')} />;
    }
  };

  return (
    <MainLayout 
      hideShell={currentStep === 'welcome'} 
      isFullScreen={currentStep === 'welcome'}
      isBwMode={isBwMode}
      onThemeToggle={toggleTheme}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-grow flex flex-col items-center justify-center w-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </MainLayout>
  );
}

export default App;
