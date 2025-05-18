import { getStraightPath } from 'reactflow';

export default function FloatingEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    style = {},
    data = {},
}) {
    const {
        sourcePosition = 'right',
        targetPosition = 'left',
    } = data;

    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <path
            id={id}
            d={edgePath}
            className="react-flow__edge-path"
            style={{ stroke: '#999', ...style }}
            markerEnd={markerEnd || {
                type: 'arrowclosed',
                width: 12,
                height: 12,
                color: style?.stroke || '#999',
            }}

        />
    );
}
