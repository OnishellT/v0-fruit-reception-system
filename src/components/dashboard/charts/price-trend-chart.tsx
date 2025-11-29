/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react';
import React from 'react';

const PriceTrendChartReact = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos disponibles</div>;
    }

    const prices = data.map(d => Number(d.price));
    const maxPrice = Math.max(...prices) * 1.1; // Add 10% padding
    const minPrice = Math.min(...prices) * 0.9;

    const chartHeight = 300;
    const chartWidth = 600; // Viewbox width
    const marginLeft = 50;
    const marginBottom = 30;
    const availableWidth = chartWidth - marginLeft - 20;
    const availableHeight = chartHeight;

    const getX = (index: number) => marginLeft + (index / (data.length - 1)) * availableWidth;
    const getY = (price: number) => 20 + availableHeight - ((price - minPrice) / (maxPrice - minPrice)) * availableHeight;

    const points = data.map((d, i) => `${getX(i)},${getY(Number(d.price))}`).join(' ');

    return (
        <div className="w-full h-[350px] overflow-x-auto">
            <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight + marginBottom + 20}`} preserveAspectRatio="none">
                {/* Grid Lines (Horizontal) */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = 20 + availableHeight - ratio * availableHeight;
                    const price = minPrice + ratio * (maxPrice - minPrice);
                    return (
                        <g key={i}>
                            <line x1={marginLeft} y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
                            <text x={marginLeft - 10} y={y + 4} textAnchor="end" fontSize="10" className="fill-gray-400">
                                ${price.toFixed(2)}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line x1={marginLeft} y1={20} x2={marginLeft} y2={chartHeight + 20} stroke="#9ca3af" strokeWidth="1" />
                <line x1={marginLeft} y1={chartHeight + 20} x2={chartWidth} y2={chartHeight + 20} stroke="#9ca3af" strokeWidth="1" />

                {/* Line */}
                <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    points={points}
                />

                {/* Points */}
                {data.map((d, i) => (
                    <g key={i} className="group">
                        <circle
                            cx={getX(i)}
                            cy={getY(Number(d.price))}
                            r="4"
                            fill="#2563eb"
                            className="transition-all duration-300 hover:r-6"
                        >
                            <title>{`${d.date}: $${Number(d.price).toFixed(2)}`}</title>
                        </circle>
                        {/* Tooltip on hover */}
                        <text
                            x={getX(i)}
                            y={getY(Number(d.price)) - 10}
                            textAnchor="middle"
                            className="text-xs fill-blue-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            fontSize="12"
                        >
                            ${Number(d.price).toFixed(2)}
                        </text>
                        {/* X Axis Label */}
                        <text
                            x={getX(i)}
                            y={chartHeight + 35}
                            textAnchor="middle"
                            fontSize="10"
                            className="fill-gray-500"
                            transform={`rotate(45, ${getX(i)}, ${chartHeight + 35})`}
                        >
                            {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export const PriceTrendChart = qwikify$(PriceTrendChartReact, { eagerness: 'visible' });
