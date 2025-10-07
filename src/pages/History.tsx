import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar,
  TrendingUp,
  Activity,
  Eye,
  Download,
  Filter,
  Search,
  MoreVertical,
  Target
} from 'lucide-react';
import { supabase, analysisHelpers, AnalysisHistoryItem } from '../utils/supabaseClient';

const History: React.FC = () => {
  const navigate = useNavigate();
  // User state is needed for authentication checks
  const [, setUser] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  // Load user and history data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        // Get analysis history if user is authenticated
        if (session?.user) {
          const { history, error } = await analysisHelpers.getAnalysisHistory();
          
          if (error) {
            console.error('Error loading history:', error);
          } else {
            setHistoryItems(history);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredHistory = historyItems
    .filter(item => filterSeverity === 'all' || item.severity.toLowerCase() === filterSeverity.toLowerCase())
    .filter(item => {
      // Search in notes if available
      if (searchTerm === '') return true;
      return (
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.analysis_data.issue_description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.score - a.score;
    });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Mild': return 'text-green-400 bg-green-500/10';
      case 'Moderate': return 'text-yellow-400 bg-yellow-500/10';
      case 'Severe': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold gradient-text">FaceCare AI</h1>
              <span className="text-gray-400">Analysis History</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Analysis History</h2>
          <p className="text-gray-300">Track your skin health journey over time</p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <div className="glassmorphism rounded-xl p-6 mb-8 flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glassmorphism rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Scans</p>
                  <p className="text-2xl font-bold gradient-text">{historyItems.length}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="glassmorphism rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Average Score</p>
                  <p className="text-2xl font-bold gradient-text">
                    {historyItems.length > 0 ? 
                      Math.round(historyItems.reduce((acc, item) => acc + item.score, 0) / historyItems.length) : 
                      '--'
                    }
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <div className="glassmorphism rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Best Score</p>
                  <p className="text-2xl font-bold gradient-text">
                    {historyItems.length > 0 ? 
                      Math.max(...historyItems.map(item => item.score)) : 
                      '--'
                    }
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="glassmorphism rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">This Month</p>
                  <p className="text-2xl font-bold gradient-text">
                    {historyItems.filter(item => 
                      new Date(item.date).getMonth() === new Date().getMonth() &&
                      new Date(item.date).getFullYear() === new Date().getFullYear()
                    ).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="glassmorphism rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none w-full sm:w-64"
                />
              </div>

              {/* Severity Filter */}
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              >
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="glassmorphism rounded-xl p-6 hover:bg-purple-900/10 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span className="font-semibold text-lg">Analysis #{item.id.split('_')[1]}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                        {item.score}/100
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate('/analysis', { state: { analysisId: item.id } })}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="View Analysis"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="More Options"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Issue Description */}
                <div className="bg-gray-900/30 rounded-lg p-4 mt-4">
                  <p className="text-gray-300 text-sm">
                    {item.analysis_data.issue_description || 'No issue description available.'}
                  </p>
                </div>

                {/* Issue Locations */}
                {item.analysis_data.issue_locations && item.analysis_data.issue_locations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Affected Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.analysis_data.issue_locations.map((loc, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          {loc.body_part}: {loc.location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div className="bg-gray-900/30 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-400 mb-1">Notes:</p>
                    <p className="text-gray-300 text-sm">{item.notes}</p>
                  </div>
                )}
                
                {/* Additional info button */}
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => navigate('/analysis', { state: { analysisId: item.id } })}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    View Full Analysis →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No history found</h3>
            <p className="text-gray-500">Try adjusting your filters or start your first analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;