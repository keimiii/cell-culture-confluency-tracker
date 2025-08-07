import React, { useState } from 'react';
import MicroplateView from './components/MicroplateView';
import MeasurementForm from './components/MeasurementForm';
import './styles/App.css';

function App() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleMeasurementSubmitted = () => {
        // Trigger refresh of the microplate view
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="App">
            <div className="container">
                <div className="header">
                    <h1>Cell Confluency Tracker</h1>
                    <p>Monitor and track cell growth across microplate wells</p>
                </div>

                <div className="main-content">
                    <MicroplateView refreshTrigger={refreshKey} />
                    <MeasurementForm onMeasurementSubmitted={handleMeasurementSubmitted} />
                </div>
            </div>
        </div>
    );
}

export default App;