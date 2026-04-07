import { useNavigate } from "react-router-dom";
import StackSimulation from "../components/simulations/StackSimulation";
import SimulationStorage from "../services/Simulationstorage";

const ROUTE = "ar-simulation/stack";

const StackSimulationPage = () => {
  const navigate = useNavigate();
  const handleExit = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };
  return <StackSimulation onExit={handleExit} />;
};

export default StackSimulationPage;
