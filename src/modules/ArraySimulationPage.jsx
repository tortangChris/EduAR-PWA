import ArraySimulation from "../components/simulations/ArraySimulation";
import SimulationStorage from "../services/Simulationstorage";
import { useNavigate } from "react-router-dom";

const ROUTE = "ar-simulation/arrays";

const ArraySimulationPage = () => {
  const navigate = useNavigate();

  const handleFinish = () => {
    // Directly force progress to 100 — no counting logic
    SimulationStorage.setSimulationProgress(ROUTE, 100);
    navigate("/ar-simulation");
  };

  return <ArraySimulation onFinish={handleFinish} />;
};

export default ArraySimulationPage;
