import { PipelineBoard } from "./pipeline-board";

export const dynamic = "force-dynamic";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Drag events between columns to update status
        </p>
      </div>
      <PipelineBoard />
    </div>
  );
}
