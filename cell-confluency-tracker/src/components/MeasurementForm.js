import React, {useState, useEffect} from 'react';
import {validateConfluency, generateRowLabels, generateColumnLabels} from '../utils/helper';
import '../styles/MeasurementForm.css';
import api from '../services/api';
import {Modal} from "@mui/material";

const MeasurementForm = ({onMeasurementSubmitted}) => {
    const [microplate, setMicroplate] = useState(null);
    const [row, setRow] = useState('');
    const [column, setColumn] = useState('');
    const [confluency, setConfluency] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [modalVisible, setModalVisible] = useState(false);


    useEffect(() => {
        loadMicroplate();
    }, []);

    const loadMicroplate = async () => {
        try {
            const plates = await api.getMicroplates();
            if (plates.length > 0) {
                setMicroplate(plates[0]);
            }
        } catch (error) {
            console.error('Error loading microplate:', error);
        }
    };

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    const resetForm = () => {
        setRow('');
        setColumn('');
        setConfluency('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!microplate) {
            showMessage('No microplate available', 'error');
            return;
        }

        if (!row || !column || !confluency) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        const confluencyNum = parseFloat(confluency);
        const validation = validateConfluency(confluencyNum);

        if (!validation.isValid) {
            showMessage(validation.error, 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.submitMeasurement(
                microplate.id,
                parseInt(row),
                parseInt(column),
                confluencyNum,
            );

            showMessage('Measurement submitted successfully!', 'success');
            resetForm();

            if (onMeasurementSubmitted) {
                onMeasurementSubmitted();
            }
        } catch (error) {
            showMessage(error.message || 'Error submitting measurement', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRowOptions = () => {
        if (!microplate) return [];
        return generateRowLabels(microplate.rows).map((label, index) => (
            <option key={index} value={index}>
                {label}
            </option>
        ));
    };

    const getColumnOptions = () => {
        if (!microplate) return [];
        return generateColumnLabels(microplate.columns).map((label, index) => (
            <option key={index} value={index}>
                {label}
            </option>
        ));
    };

    return (
        <div className="measurement-section">
            <h2 className="measurement-title">Add Measurement</h2>

            {message && (
                <div className={`message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">
                        Microplate
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        value={microplate ? microplate.name : 'Loading...'}
                        disabled
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Row *
                    </label>
                    <select
                        className="form-select"
                        value={row}
                        onChange={(e) => setRow(e.target.value)}
                        required
                    >
                        <option value="">Select Row</option>
                        {getRowOptions()}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Column *
                    </label>
                    <select
                        className="form-select"
                        value={column}
                        onChange={(e) => setColumn(e.target.value)}
                        required
                    >
                        <option value="">Select Column</option>
                        {getColumnOptions()}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Confluency (%) *
                    </label>
                    <input
                        type="number"
                        className="form-input"
                        value={confluency}
                        onChange={(e) => setConfluency(e.target.value)}
                        placeholder="Enter confluency percentage (0-100)"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting || !microplate}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Measurement'}
                </button>
            </form>

        </div>
    );
};

export default MeasurementForm;