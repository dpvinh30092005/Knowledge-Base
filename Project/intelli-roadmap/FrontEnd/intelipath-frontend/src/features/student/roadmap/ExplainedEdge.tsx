import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

/**
 * A roadmap edge that can say why it exists.
 *
 * The backend orders the roadmap per student — by their level, the skills they
 * already hold and current market demand — and sends one sentence of
 * justification with each connection. Rendering it as a native `<title>` keeps
 * the tooltip free of layout, portals and hover state, and makes it readable by
 * a screen reader for the same price.
 *
 * An edge with no reason renders exactly like the plain edge it replaces.
 */
const ExplainedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const reason = typeof data?.reason === 'string' ? data.reason : null;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {reason && (
        // Widened, invisible hit area: a 2-3px stroke is close to impossible to
        // hover deliberately, so the tooltip would never appear on the real path.
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={18}
          style={{ pointerEvents: 'stroke', cursor: 'help' }}
        >
          <title>{reason}</title>
        </path>
      )}
    </>
  );
};

export default ExplainedEdge;
