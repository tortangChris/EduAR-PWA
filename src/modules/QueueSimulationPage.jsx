import QueueSimulation from "../components/simulations/QueueSimulation";
import SimulationStorage from "../services/Simulationstorage";
import { useNavigate } from "react-router-dom";

const ROUTE = "ar-simulation/queue";

const QueueSimulationPage = () => {
  const navigate = useNavigate();
  const handleFinish = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };
  return <QueueSimulation onFinish={handleFinish} />;
};

export default QueueSimulationPage;
