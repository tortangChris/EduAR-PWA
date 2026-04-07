import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArraySimulation from "../components/simulations/ArraySimulation";
import SimulationStorage from "../services/Simulationstorage";

const ROUTE = "ar-simulation/arrays";

const ArraySimulationPage = () => {
  const navigate = useNavigate();

  const handleExit = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };

  return <ArraySimulation onExit={handleExit} />;
};

export default ArraySimulationPage;
