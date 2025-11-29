/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react';
import React from 'react';

const WeightByFruitChartReact = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos disponibles</div>;
    }

    const maxWeight = Math.max(...data.map(d => Number(d.weight)));
    const chartHeight = 300;
    const chartWidth = 500; // Viewbox width
    const barWidth = 40;
    const gap = 20;
    const marginLeft = 50;
    const marginBottom = 30;

    // Calculate effective width based on data points
    const totalWidth = Math.max(chartWidth, data.length * (barWidth + gap) + marginLeft + 20);

    return (
        <div className="w-full h-[350px] overflow-x-auto">
            <svg width="100%" height="100%" viewBox={`0 0 ${totalWidth} ${chartHeight + marginBottom + 20}`} preserveAspectRatio="none">
                {/* Y Axis */}
                <line x1={marginLeft} y1={20} x2={marginLeft} y2={chartHeight + 20} stroke="#e5e7eb" strokeWidth="2" />

                {/* X Axis */}
                <line x1={marginLeft} y1={chartHeight + 20} x2={totalWidth} y2={chartHeight + 20} stroke="#e5e7eb" strokeWidth="2" />

                {/* Bars */}
                {data.map((d, i) => {
                    const height = (Number(d.weight) / maxWeight) * chartHeight;
                    const x = marginLeft + gap + i * (barWidth + gap);
                    const y = chartHeight + 20 - height;

                    return (
                        <g key={i} className="group">
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={height}
                                fill="#16a34a"
                                className="transition-all duration-300 hover:opacity-80"
                                rx="4"
                            >
                                <title>{`${d.name}: ${Number(d.weight).toFixed(2)} kg`}</title>
                            </rect>
                            {/* Label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartHeight + 40}
                                textAnchor="middle"
                                className="text-xs fill-gray-500"
                                fontSize="12"
                            >
                                {d.name.substring(0, 10)}
                            </text>
                            {/* Value on hover (simple) or always visible if space permits */}
                            <text
                                x={x + barWidth / 2}
                                y={y - 5}
                                textAnchor="middle"
                                className="text-xs fill-gray-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                fontSize="12"
                            >
                                {Number(d.weight).toFixed(0)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const WeightByFruitChart = qwikify$(WeightByFruitChartReact, { eagerness: 'visible' });
