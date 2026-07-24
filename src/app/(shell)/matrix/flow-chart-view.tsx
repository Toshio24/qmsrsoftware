"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dagre from "@dagrejs/dagre";
import { ReactFlow, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { statusBadgeClasses } from "@/lib/domain/formatField";
import type { ItemType, ItemStatus } from "@/generated/prisma/enums";

type FlowItem = {
  id: string;
  humanCode: string;
  title: string;
  itemType: ItemType;
  status: ItemStatus;
};

type FlowLink = {
  id: string;
  linkType: string;
  sourceItemId: string;
  targetItemId: string;
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;

function layout(items: FlowItem[], links: FlowLink[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 24, ranksep: 80 });

  for (const item of items) {
    graph.setNode(item.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const link of links) {
    graph.setEdge(link.sourceItemId, link.targetItemId);
  }
  dagre.layout(graph);

  const nodes: Node[] = items.map((item) => {
    const pos = graph.node(item.id);
    return {
      id: item.id,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { item },
      type: "qmsItem",
      style: { width: NODE_WIDTH },
    };
  });

  const edges: Edge[] = links.map((link) => ({
    id: link.id,
    source: link.sourceItemId,
    target: link.targetItemId,
    label: link.linkType,
    animated: false,
    style: { stroke: "#a3a3a3" },
    labelStyle: { fill: "#737373", fontSize: 10 },
  }));

  return { nodes, edges };
}

function ItemNode({ data }: { data: { item: FlowItem } }) {
  const { item } = data;
  return (
    <div className="rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-mono text-[10px] text-neutral-500">{item.humanCode}</p>
      <p className="line-clamp-1 text-xs font-medium">{item.title}</p>
      <span className={`mt-1 inline-block rounded-full px-1.5 py-0 text-[10px] ${statusBadgeClasses(item.status)}`}>
        {item.status}
      </span>
    </div>
  );
}

const nodeTypes = { qmsItem: ItemNode };

export function FlowChartView({ items, links }: { items: FlowItem[]; links: FlowLink[] }) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => layout(items, links), [items, links]);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No items match this filter yet.
      </p>
    );
  }

  return (
    <div className="h-[600px] rounded-lg border border-neutral-200 dark:border-neutral-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={(_, node) => router.push(`/matrix?view=flow&focus=${node.id}`)}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
