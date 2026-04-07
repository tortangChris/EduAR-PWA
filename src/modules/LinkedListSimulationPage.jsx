import LinkedListSimulation from "../components/simulations/LinkedListSimulation";
import SimulationStorage from "../services/Simulationstorage";
import { useNavigate } from "react-router-dom";

const ROUTE = "ar-simulation/linked-list";

const LinkedListSimulationPage = () => {
  const navigate = useNavigate();
  const handleFinish = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };
  return <LinkedListSimulation onFinish={handleFinish} />;
};

export default LinkedListSimulationPage;
