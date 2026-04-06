import LinkedListSimulation from "../components/simulations/LinkedListSimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const LinkedListSimulationPage = () => {
  const { markFinished } = useSimulationProgress("/simulations/linked-list");
  return <LinkedListSimulation onProgress={markFinished} />;
};

export default LinkedListSimulationPage;
