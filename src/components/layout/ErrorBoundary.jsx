import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Simulation UI crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-background text-white p-8">
          <div className="bg-surface border border-rose-500/50 p-8 rounded-3xl max-w-xl text-center shadow-2xl flex flex-col items-center">
             <div className="p-4 bg-rose-500/20 rounded-full mb-6">
               <AlertTriangle className="w-12 h-12 text-rose-500" />
             </div>
             <h2 className="text-2xl font-bold mb-4 text-rose-400">Simulation Encountered an Error</h2>
             <p className="text-slate-400 mb-8 max-w-md">
                We apologize, but a critical error occurred while rendering the simulation view.
             </p>
             <button
               onClick={() => {
                 this.setState({ hasError: false });
                 if (this.props.onReset) this.props.onReset();
               }}
               className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-blue-600 font-bold rounded-xl transition-colors shadow-lg"
             >
               <RotateCcw className="w-5 h-5" />
               Return to Home
             </button>
             {this.state.error && (
               <div className="mt-8 p-4 bg-black/50 text-rose-300 font-mono text-xs rounded-xl w-full text-left overflow-x-auto whitespace-pre">
                 {this.state.error.toString()}
               </div>
             )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
