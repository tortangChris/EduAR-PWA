import LinkedListSimulation from "../components/simulations/LinkedListSimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const LinkedListSimulationPage = () => {
  const { markProgress } = useSimulationProgress("ar-simulation/linked-list");
  return <LinkedListSimulation onProgress={markProgress} />;
};

export default LinkedListSimulationPage;
