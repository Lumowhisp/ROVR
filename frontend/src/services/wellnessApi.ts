import api from './api';

export type FlowLevel = 'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY';

export type Symptom =
    | 'CRAMPS'
    | 'HEADACHE'
    | 'FATIGUE'
    | 'BLOATING'
    | 'ACNE'
    | 'BACK_PAIN'
    | 'BREAST_TENDERNESS';

export interface CyclePayload {
    cycleStart: string; // "YYYY-MM-DD"
    cycleEnd?: string;
    periodLength?: number;
}

export interface DailyLogPayload {
    date: string; // "YYYY-MM-DD"
    flow?: FlowLevel;
    painLevel?: number;
    symptoms?: Symptom[];
    mood?: {
        mood?: number;
        energy?: number;
        stress?: number;
        sleepQuality?: number;
        motivation?: number;
    };
    notes?: string;
}

// Wellness API calls — mirrors the authAPI/onboardAPI/profileAPI pattern
// in this file's sibling api.ts, reusing the same axios instance (and
// therefore the same JWT interceptor and dynamic host resolution).
export const wellnessAPI = {
    logCycle: async (data: CyclePayload) => {
        const response = await api.post('/api/wellness/cycle', data);
        return response.data;
    },

    getCurrentCycle: async () => {
        const response = await api.get('/api/wellness/cycle/current');
        return response.data;
    },

    getCycleHistory: async () => {
        const response = await api.get('/api/wellness/cycle/history');
        return response.data;
    },

    saveDailyLog: async (data: DailyLogPayload) => {
        const response = await api.post('/api/wellness/daily-log', data);
        return response.data;
    },

    getDailyLog: async (date: string) => {
        const response = await api.get(`/api/wellness/daily-log/${date}`);
        return response.data;
    },

    getCalendar: async (month: string) => {
        const response = await api.get('/api/wellness/calendar', {
            params: { month },
        });
        return response.data;
    },

    getRecommendations: async () => {
        const response = await api.get('/api/wellness/recommendations');
        return response.data;
    },
};
