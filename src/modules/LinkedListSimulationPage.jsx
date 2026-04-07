import { useNavigate } from "react-router-dom";
import LinkedListSimulation from "../components/simulations/LinkedListSimulation";
import SimulationStorage from "../services/Simulationstorage";

const ROUTE = "ar-simulation/linked-list";

const LinkedListSimulationPage = () => {
  const navigate = useNavigate();
  const handleExit = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };
  return <LinkedListSimulation onExit={handleExit} />;
};

export default LinkedListSimulationPage;
