import React from 'react';

const Legend = () => {
    const legendItems = [
        { className: 'well-no-data', label: 'No data' },
        { className: 'well-very-low', label: '< 20% (Very Low)' },
        { className: 'well-growing', label: '20-60% (Growing)' },
        { className: 'well-optimal', label: '60-90% (Optimal)' },
        { className: 'well-over-confluent', label: '> 90% (Over-confluent)' },
    ];

    return (
        <div className="legend">
            {legendItems.map((item, index) => (
                <div key={index} className="legend-item">
                    <div className={`legend-color ${item.className}`}></div>
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default Legend;