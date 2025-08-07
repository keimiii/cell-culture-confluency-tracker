import axios from 'axios';

class FlaskAPI {
    constructor(baseUrl = '/api') {  // Using proxy in package.json
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.data?.error) {
                    throw new Error(error.response.data.error);
                }
                throw error;
            }
        );
    }

    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    async getMicroplates() {
        try {
            const response = await this.client.get('/microplates');
            return response.data;
        } catch (error) {
            console.error('Error fetching microplates:', error);
            throw error;
        }
    }

    async getLatestMeasurements(microplateId) {
        try {
            const response = await this.client.get(`/microplates/${microplateId}/measurements/latest`);
            return response.data;
        } catch (error) {
            console.error('Error fetching measurements:', error);
            throw error;
        }
    }

    async submitMeasurement(microplateId, row, column, confluencyPercentage, notes = null) {
        try {
            const response = await this.client.post(`/microplates/${microplateId}/measurements`, {
                row,
                column,
                confluency_percentage: confluencyPercentage,
                notes
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting measurement:', error);
            throw error;
        }
    }

    async createMicroplate(name, rows = 2, columns = 3) {
        try {
            const response = await this.client.post('/microplates', {
                name,
                rows,
                columns
            });
            return response.data;
        } catch (error) {
            console.error('Error creating microplate:', error);
            throw error;
        }
    }
}

export const api = new FlaskAPI();
export default api;