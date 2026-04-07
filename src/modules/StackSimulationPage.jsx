import StackSimulation from "../components/simulations/StackSimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const StackSimulationPage = () => {
  const { markProgress } = useSimulationProgress("ar-simulation/stack");
  return <StackSimulation onProgress={markProgress} />;
};

export default StackSimulationPage;
