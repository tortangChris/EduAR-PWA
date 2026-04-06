import { useLocation } from "react-router-dom";
import ArraySimulation from "../components/simulations/ArraySimulation";
import { useSimulationProgress } from "../services/useSimulationProgress";

const ROUTE = "/simulations/array";

const ArraySimulationPage = () => {
  const { markFinished } = useSimulationProgress(ROUTE);

  return <ArraySimulation onProgress={markFinished} />;
};

export default ArraySimulationPage;
