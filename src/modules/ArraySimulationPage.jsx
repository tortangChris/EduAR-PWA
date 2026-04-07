import ArraySimulation from "../components/simulations/ArraySimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const ArraySimulationPage = () => {
  const { markProgress } = useSimulationProgress("ar-simulation/arrays");
  return <ArraySimulation onProgress={markProgress} />;
};

export default ArraySimulationPage;
