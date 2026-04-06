import StackSimulation from "../components/simulations/StackSimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const StackSimulationPage = () => {
  const { markFinished } = useSimulationProgress("/simulations/stack");
  return <StackSimulation onProgress={markFinished} />;
};

export default StackSimulationPage;
