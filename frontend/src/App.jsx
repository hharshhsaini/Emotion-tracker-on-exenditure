import { useState } from 'react';
import { Brain } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function App() {
  const [result, setResult] = useState(null);

  const handleAnalysisComplete = (data) => {
    setResult(data);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AI Expense Tracker</h1>
            <p className="text-xs text-gray-500">Emotional Insight Analysis</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!result ? (
          <div className="py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Understand Your Emotional Spending
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Upload your bank statement and let AI analyze your spending patterns,
                detect emotional triggers, and provide personalized coaching.
              </p>
            </div>
            <FileUpload onAnalysisComplete={handleAnalysisComplete} />
          </div>
        ) : (
          <Dashboard data={result} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        Built for Microsoft Imagine Cup 2024
      </footer>
    </div>
  );
}

export default App;
