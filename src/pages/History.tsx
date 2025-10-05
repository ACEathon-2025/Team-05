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
  MoreVertical
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface HistoryItem {
  id: string;
  date: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  score: number;
  imageUrl?: string;
  notes?: string;
}

const History: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  // Mock history data - in real app, fetch from database
  const mockHistory: HistoryItem[] = [
    { id: '1', date: '2025-01-14', severity: 'Moderate', score: 67, notes: 'Some improvement noted' },
    { id: '2', date: '2025-01-10', severity: 'Mild', score: 78, notes: 'Good progress' },
    { id: '3', date: '2025-01-05', severity: 'Severe', score: 45, notes: 'Need more treatment' },
    { id: '4', date: '2025-01-01', severity: 'Moderate', score: 62, notes: 'Starting treatment' },
    { id: '5', date: '2024-12-28', severity: 'Severe', score: 38, notes: 'Initial consultation' },
    { id: '6', date: '2024-12-25', severity: 'Mild', score: 82, notes: 'Holiday stress impact' },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();
    setHistoryItems(mockHistory);
  }, []);

  const filteredHistory = historyItems
    .filter(item => filterSeverity === 'all' || item.severity.toLowerCase() === filterSeverity)
    .filter(item => item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
                  {Math.round(historyItems.reduce((acc, item) => acc + item.score, 0) / historyItems.length)}
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
                  {Math.max(...historyItems.map(item => item.score))}
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
                    new Date(item.date).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

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
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="glassmorphism rounded-xl p-6 hover:bg-purple-900/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-semibold text-lg">Analysis #{item.id}</span>
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

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                      {item.score}/100
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate('/analysis')}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {item.notes && (
                <div className="bg-gray-900/30 rounded-lg p-4 mt-4">
                  <p className="text-gray-300 text-sm">{item.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredHistory.length === 0 && (
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