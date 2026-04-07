import { useNavigate } from "react-router-dom";
import QueueSimulation from "../components/simulations/QueueSimulation";
import SimulationStorage from "../services/Simulationstorage";

const ROUTE = "ar-simulation/queue";

const QueueSimulationPage = () => {
  const navigate = useNavigate();
  const handleExit = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };
  return <QueueSimulation onExit={handleExit} />;
};

export default QueueSimulationPage;
