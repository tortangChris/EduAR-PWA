import React from "react";
import { useParams, useNavigate } from "react-router-dom";

import Arrays from "./Arrays";
import Sorting from "./Sorting";
import LinkedList from "./LinkedList";
import DynamicMultiDimensionalArrays from "./DynamicMultiDimensionalArrays";
import StackAndQueue from "./StackAndQueue";
import TreeRecursion from "./TreeRecursion";
import SetDataStructure from "./SetDataStructure";
import GraphDataStructure from "./GraphDataStructure";
import MapHashTable from "./MapHashTable";

// config: id ng module -> component
const modulesConfig = {
  arrays: Arrays,
  sorting: Sorting,
  "linked-list": LinkedList,
  "dynamic-and-multi-dimensional-arrays": DynamicMultiDimensionalArrays,
  "stack-and-queue": StackAndQueue,
  "tree-data-structure-recursion": TreeRecursion,
  "set-data-structure": SetDataStructure,
  "graph-data-structure": GraphDataStructure,
  "map-and-hash-table": MapHashTable,
};

const ModuleWrapper = () => {
  const { module, page } = useParams();
  const navigate = useNavigate();

  const ModuleComponent = modulesConfig[module];
  if (!ModuleComponent) return <div>⚠️ Module not found</div>;

  // 1-based system → convert to 0-based index
  const currentPage = page ? Number(page) - 1 : 0;

  return (
    <ModuleComponent
      currentPage={currentPage}
      onPageChange={(newPage) => navigate(`/modules/${module}/${newPage + 1}`)} // +1 para 1-based sa URL
    />
  );
};

export default ModuleWrapper;
