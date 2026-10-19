interface SparklineProps {
  values: Array<number | null>;
  width?: number;
  height?: number;
}

export default function Sparkline({ values, width = 96, height = 28 }: SparklineProps) {
  const points = values
    .map((value, index) => (value === null ? null : { x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width, y: height - 2 - (value / 100) * (height - 4) }))
    .filter((point): point is { x: number; y: number } => point !== null);

  if (points.length < 2) {
    return <span className="sparkline sparkline--empty" style={{ width, height }} aria-hidden="true" />;
  }

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="sparkline__area" d={area} />
      <path className="sparkline__line" d={line} />
      <circle className="sparkline__dot" cx={last.x} cy={last.y} r={2.5} />
    </svg>
  );
}
