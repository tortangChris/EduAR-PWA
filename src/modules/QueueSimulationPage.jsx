import QueueSimulation from "../components/simulations/QueueSimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const QueueSimulationPage = () => {
  const { markProgress } = useSimulationProgress("ar-simulation/queue");
  return <QueueSimulation onProgress={markProgress} />;
};

export default QueueSimulationPage;
