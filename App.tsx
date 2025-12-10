import React from 'react';
import { DictationInterface } from './components/DictationInterface';

function App() {
  return (
    <div className="min-h-screen w-full bg-transparent overflow-hidden text-[#e5e5e5] font-sans selection:bg-terminal-green selection:text-black">
      <DictationInterface />
    </div>
  );
}

export default App;