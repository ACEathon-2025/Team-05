import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase.config';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Analysis data interfaces
export interface IssueLocation {
  body_part: string;
  location: string;
}

export interface AnalysisData {
  healthy: number;
  level: 'low' | 'medium' | 'high';
  issue_locations: IssueLocation[];
  issue_description: string;
  remedies_ayurvedic: string[];
  yoga_recommendations: string[];
  faster_supplements: string[];
}

export interface AnalysisHistoryItem {
  id: string;
  user_id: string;
  date: string;
  severity: 'Mild' | 'Moderate' | 'High';
  score: number;
  imageUrl?: string;
  notes?: string;
  analysis_data: AnalysisData;
}

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },
};

// Analysis helpers
export const analysisHelpers = {
  // Convert backend severity level to UI severity
  mapSeverityLevel: (level: 'low' | 'medium' | 'high'): 'Mild' | 'Moderate' | 'High' => {
    switch(level) {
      case 'low': return 'Mild';
      case 'medium': return 'Moderate';
      case 'high': return 'High';
      default: return 'Moderate' as 'Moderate';
    }
  },

  // Save analysis result to local storage (temporary storage solution)
  saveAnalysisResult: async (analysisData: AnalysisData, imageUrl?: string) => {
    try {
      // Get current user
      const { user } = await authHelpers.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Generate a unique ID
      const id = `analysis_${Date.now()}`;
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Convert analysis score and level to history format
      const score = analysisData.healthy;
      const severity = analysisHelpers.mapSeverityLevel(analysisData.level);
      
      // Create analysis history item
      const historyItem: AnalysisHistoryItem = {
        id,
        user_id: user.id,
        date,
        severity,
        score,
        imageUrl,
        notes: `Auto-generated analysis on ${date}`,
        analysis_data: analysisData
      };
      
      // Get existing history from localStorage
      const existingHistoryString = localStorage.getItem('analysisHistory');
      const existingHistory: AnalysisHistoryItem[] = existingHistoryString 
        ? JSON.parse(existingHistoryString) 
        : [];
      
      // Add new history item
      const updatedHistory = [historyItem, ...existingHistory];
      
      // Save back to localStorage
      localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
      
      return { historyItem, error: null };
    } catch (error) {
      console.error('Error saving analysis result:', error);
      return { historyItem: null, error };
    }
  },
  
  // Get all analysis history for current user
  getAnalysisHistory: async () => {
    try {
      // Get current user
      const { user } = await authHelpers.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get history from localStorage
      const historyString = localStorage.getItem('analysisHistory');
      const allHistory: AnalysisHistoryItem[] = historyString 
        ? JSON.parse(historyString) 
        : [];
      
      // Filter by current user
      const userHistory = allHistory.filter(item => item.user_id === user.id);
      
      return { history: userHistory, error: null };
    } catch (error) {
      console.error('Error getting analysis history:', error);
      return { history: [], error };
    }
  },
  
  // Get a specific analysis by ID
  getAnalysisById: async (id: string) => {
    try {
      // Get all history
      const { history } = await analysisHelpers.getAnalysisHistory();
      
      // Find specific analysis
      const analysis = history.find(item => item.id === id);
      
      if (!analysis) {
        throw new Error('Analysis not found');
      }
      
      return { analysis, error: null };
    } catch (error) {
      console.error('Error getting analysis by ID:', error);
      return { analysis: null, error };
    }
  },

  // Get the most recent analysis
  getLatestAnalysis: async () => {
    try {
      // Get all history
      const { history } = await analysisHelpers.getAnalysisHistory();
      
      if (history.length === 0) {
        return { analysis: null, error: null };
      }
      
      // Sort by date (newest first)
      const sortedHistory = [...history].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      return { analysis: sortedHistory[0], error: null };
    } catch (error) {
      console.error('Error getting latest analysis:', error);
      return { analysis: null, error };
    }
  }
};