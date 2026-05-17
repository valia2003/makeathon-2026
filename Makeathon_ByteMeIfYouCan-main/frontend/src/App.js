import "@/App.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/pathfinder/Navbar";
import Hero from "./components/pathfinder/Hero";
import Problem from "./components/pathfinder/Problem";
import HowItWorks from "./components/pathfinder/HowItWorks";
import AIChat from "./components/pathfinder/AIChat";
import Itinerary from "./components/pathfinder/Itinerary";
import Sustainability from "./components/pathfinder/Sustainability";
import AdvancedAI from "./components/pathfinder/AdvancedAI";
import FinalCTA from "./components/pathfinder/FinalCTA";
import Footer from "./components/pathfinder/Footer";
import { Toaster } from "sonner";

const Landing = () => {
  const [activeTrail, setActiveTrail] = useState(null);

  return (
    <div className="App relative" data-testid="pathfinder-landing">
      <Navbar />
      <Hero onSelectedTrailChange={setActiveTrail} />
      <Problem />
      <HowItWorks />
      <AIChat onRecommendationSelected={setActiveTrail} />
      <Itinerary activeTrail={activeTrail} />
      <Sustainability />
      <AdvancedAI />
      <FinalCTA />
      <Footer />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
