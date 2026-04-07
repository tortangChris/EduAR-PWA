import StackSimulation from "../components/simulations/StackSimulation";
import SimulationStorage from "../services/Simulationstorage";
import { useNavigate } from "react-router-dom";

const ROUTE = "ar-simulation/stack";

const StackSimulationPage = () => {
  const navigate = useNavigate();
  const handleFinish = () => {
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };
  return <StackSimulation onFinish={handleFinish} />;
};

export default StackSimulationPage;
