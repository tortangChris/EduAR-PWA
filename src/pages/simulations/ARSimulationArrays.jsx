import ArraySimulation from "../../components/ARSimulation/ArraySimulation";
import { useSimulationProgress } from "../../services/useSimulationProgress";

const ARSimulationArrays = () => {
  const { markProgress } = useSimulationProgress("ar-simulation/arrays");
  return <ArraySimulation onProgress={markProgress} />;
};

export default ARSimulationArrays;
