/**
 * Get CSS class for well based on confluency percentage
 * @param {number|null} confluency - Confluency percentage
 * @returns {string} CSS class name
 */
export function getWellColor(confluency) {
    if (confluency === null || confluency === undefined) return 'well-no-data';
    if (confluency < 20) return 'well-very-low';
    if (confluency <= 60) return 'well-growing';
    if (confluency <= 90) return 'well-optimal';
    return 'well-over-confluent';
}

/**
 * Format well ID from row and column indices
 * @param {number} row - Row index (0-based)
 * @param {number} column - Column index (0-based)
 * @returns {string} Formatted well ID (e.g., "A1", "B3")
 */
export function formatWellId(row, column) {
    return `${String.fromCharCode(65 + row)}${column + 1}`;
}

/**
 * Get confluency status description
 * @param {number|null} confluency - Confluency percentage
 * @returns {string} Status description
 */
export function getConfluencyStatus(confluency) {
    if (confluency === null || confluency === undefined) return 'No data';
    if (confluency < 20) return 'Very Low';
    if (confluency <= 60) return 'Growing';
    if (confluency <= 90) return 'Optimal';
    return 'Over-confluent';
}

/**
 * Validate confluency percentage
 * @param {number} confluency - Confluency percentage to validate
 * @returns {{isValid: boolean, error?: string}}
 */
export function validateConfluency(confluency) {
    if (isNaN(confluency)) {
        return { isValid: false, error: 'Confluency must be a number' };
    }
    if (confluency < 0 || confluency > 100) {
        return { isValid: false, error: 'Confluency must be between 0 and 100' };
    }
    return { isValid: true };
}

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Invalid date';
    }
}

/**
 * Generate array of row labels (A, B, C, ...)
 * @param {number} rowCount - Number of rows
 * @returns {string[]} Array of row labels
 */
export function generateRowLabels(rowCount) {
    return Array.from({ length: rowCount }, (_, i) => String.fromCharCode(65 + i));
}

/**
 * Generate array of column labels (1, 2, 3, ...)
 * @param {number} columnCount - Number of columns
 * @returns {string[]} Array of column labels
 */
export function generateColumnLabels(columnCount) {
    return Array.from({ length: columnCount }, (_, i) => (i + 1).toString());
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
}

/**
 * Calculate average confluency from measurements
 * @param {Array} measurements - Array of measurement objects
 * @returns {number|null} Average confluency or null if no measurements
 */
export function calculateAverageConfluency(measurements) {
    if (!measurements || measurements.length === 0) return null;

    const total = measurements.reduce((sum, measurement) => {
        return sum + measurement.confluency_percentage;
    }, 0);

    return Math.round((total / measurements.length) * 100) / 100; // Round to 2 decimal places
}