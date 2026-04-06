import QueueSimulation from "../components/simulations/QueueSimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const QueueSimulationPage = () => {
  const { markFinished } = useSimulationProgress("/simulations/queue");
  return <QueueSimulation onProgress={markFinished} />;
};

export default QueueSimulationPage;
