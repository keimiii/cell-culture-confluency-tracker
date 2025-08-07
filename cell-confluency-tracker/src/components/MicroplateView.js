import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Legend from './Legend';
import { getWellColor, formatWellId, formatTimestamp } from '../utils/helper';
import '../styles/MicroplateView.css';

const MicroplateView = ({ refreshTrigger }) => {
    const [measurements, setMeasurements] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [microplate, setMicroplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [error, setError] = useState(null);

    const loadMeasurements = async () => {
        if (!microplate) return;

        try {
            setConnectionStatus('connected');
            const data = await api.getLatestMeasurements(microplate.id);
            setMeasurements(data);

            if (data.length > 0) {
                const latest = data.reduce((latest, current) =>
                    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
                );
                setLastUpdated(new Date(latest.timestamp));
            }
            setError(null);
        } catch (error) {
            console.error('Error loading measurements:', error);
            setConnectionStatus('error');
            setError(error.message);
        }
    };

    const loadMicroplate = async () => {
        try {
            const plates = await api.getMicroplates();
            if (plates.length > 0) {
                setMicroplate(plates[0]); // Use first available plate
            } else {
                // Create default microplate if none exists
                const newPlate = await api.createMicroplate('Plate-001', 2, 3);
                setMicroplate(newPlate);
            }
        } catch (error) {
            console.error('Error loading microplate:', error);
            setError(error.message);
        }
    };

    const initialize = async () => {
        setIsLoading(true);
        try {
            await api.checkHealth();
            await loadMicroplate();
        } catch (error) {
            console.error('Failed to initialize:', error);
            setConnectionStatus('error');
            setError('Unable to connect to Flask backend. Make sure the server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (microplate) {
            loadMeasurements();
        }
    }, [loadMeasurements, microplate, refreshTrigger]);

    // Refresh measurements every 5 seconds
    useEffect(() => {
        if (!microplate) return;

        const interval = setInterval(loadMeasurements, 5000);
        return () => clearInterval(interval);
    }, [loadMeasurements, microplate]);


    // Get specific measurements for current well
    const getMeasurementForWell = (row, column) => {
        return measurements.find(m => m.row === row && m.column === column);
    };

    // Render each well's measurements
    const renderWell = (row, col) => {
        const measurement = getMeasurementForWell(row, col);
        const confluency = measurement ? measurement.confluency_percentage : null;

        return (
            <div
                key={`${row}-${col}`}
                className={`well ${getWellColor(confluency)}`}
                title={measurement ?
                    `Well ${formatWellId(row, col)}: ${confluency}%\nLast updated: ${formatTimestamp(measurement.timestamp)}${measurement.notes ? `\nNotes: ${measurement.notes}` : ''}` :
                    `Well ${formatWellId(row, col)}: No data`
                }
            >
                <div className="well-id">{formatWellId(row, col)}</div>
                <div className="well-confluency">
                    {confluency !== null ? `${confluency}%` : 'No data'}
                </div>
            </div>
        );
    };

    const renderGrid = () => {
        if (!microplate) return null;

        const wells = [];
        for (let row = 0; row < microplate.rows; row++) {
            for (let col = 0; col < microplate.columns; col++) {
                wells.push(renderWell(row, col));
            }
        }
        return wells;
    };

    if (isLoading) {
        return (
            <div className="microplate-section">
                <div className="microplate-header">
                    <div>
                        <h2 className="microplate-title">Loading Microplate...</h2>
                        <div className="last-updated">
                            Connecting to server...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (connectionStatus === 'error' && !microplate) {
        return (
            <div className="microplate-section">
                <div className="microplate-header">
                    <div>
                        <h2 className="microplate-title">Connection Error</h2>
                        <div className="last-updated error-text">
                            {error || 'Unable to connect to Flask backend. Make sure the server is running on http://localhost:5000'}
                        </div>
                        <button
                            className="retry-button"
                            onClick={initialize}
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="microplate-section">
            <div className="microplate-header">
                <div>
                    <h2 className="microplate-title">
                        {microplate ?
                            `${microplate.name} (${microplate.rows}×${microplate.columns} wells)` :
                            'Loading...'
                        }
                    </h2>
                    <div className="last-updated">
                        Status: <span className={`status-indicator ${connectionStatus}`}>
                            {connectionStatus === 'connected' ? '● Connected' : '● Disconnected'}
                        </span>
                        {lastUpdated && (
                            <span> | Last updated: {formatTimestamp(lastUpdated)}</span>
                        )}
                        {error && (
                            <span className="error-text"> | Error: {error}</span>
                        )}
                    </div>
                </div>
            </div>

            <div
                className="microplate-grid"
                style={{
                    gridTemplateColumns: microplate ? `repeat(${microplate.columns}, 1fr)` : 'repeat(3, 1fr)'
                }}
            >
                {renderGrid()}
            </div>

            <Legend />
        </div>
    );
};

export default MicroplateView;