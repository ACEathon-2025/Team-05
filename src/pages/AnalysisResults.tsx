import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Scan,
  Activity,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Target,
  MapPin,
  Loader2
} from 'lucide-react';
import GlowButton from '../components/GlowButton';
import { useLocation } from 'react-router-dom';
import { analysisHelpers } from '../utils/supabaseClient';

// Define types based on backend response structure
interface IssueLocation {
  body_part: string;
  location: string;
}

interface AnalysisData {
  healthy: number;
  level: 'low' | 'medium' | 'high';
  issue_locations: IssueLocation[];
  issue_description: string;
  remedies_ayurvedic: string[];
  yoga_recommendations: string[];
  faster_supplements: string[];
}

interface BackendResponse {
  success: boolean;
  data: AnalysisData;
  raw_output?: string;
  error?: string;
  details?: string;
}

const AnalysisResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState('remedies');
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const passedImage = (location.state && (location.state as any).image) || null;

  // Function to convert various image formats to base64
  const convertToBase64 = async (imageData: string): Promise<string> => {
    console.log('🔄 Converting image to base64...');
    console.log('📷 Input image data type:', typeof imageData);
    console.log('📷 Input image data starts with:', imageData.substring(0, 50));

    // If already base64 data URL, return as is
    if (imageData.startsWith('data:image/')) {
      console.log('✅ Already base64 data URL');
      return imageData;
    }

    // If it's a blob URL, convert to base64
    if (imageData.startsWith('blob:')) {
      console.log('🔄 Converting blob URL to base64...');
      try {
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            console.log('✅ Blob converted to base64, length:', base64.length);
            resolve(base64);
          };
          reader.onerror = () => {
            console.error('❌ Failed to convert blob to base64');
            reject(new Error('Failed to convert blob to base64'));
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('❌ Error fetching blob:', error);
        throw new Error('Failed to fetch blob URL');
      }
    }

    // If it's a file path or other format, try to handle it
    console.log('⚠️ Unknown image format, attempting to use as-is');
    return imageData;
  };

  // Function to call backend analysis
  const analyzeImage = async (imageData: string) => {
    console.log('🚀 Starting backend analysis...');
    console.log('📷 Original image data length:', imageData.length);
    
    try {
      setIsLoading(true);
      setError(null);

      // Convert image to base64 format
      const base64Image = await convertToBase64(imageData);
      console.log('📷 Converted image data length:', base64Image.length);
      console.log('📷 Converted image starts with:', base64Image.substring(0, 50));
      
      const response = await fetch('http://localhost:5000/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        }),
      });

      console.log('📡 Backend response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: BackendResponse = await response.json();
      console.log('✅ Backend analysis completed:', result);

      if (result.success && result.data) {
        setAnalysisData(result.data);
        console.log('📊 Analysis data set:', result.data);
        
        // Save analysis to localStorage so chat/medicine flows can reference it
        try {
          localStorage.setItem('facecare_analysis', JSON.stringify(result.data));
          console.log('💾 Saved analysis to localStorage (facecare_analysis)');
        } catch (e) {
          console.warn('Could not save analysis to localStorage', e);
        }

        // Save analysis result to history
        try {
          const { historyItem, error } = await analysisHelpers.saveAnalysisResult(result.data, base64Image);
          if (error) {
            console.error('⚠️ Error saving analysis to history:', error);
          } else {
            console.log('✅ Analysis saved to history:', historyItem);
          }
        } catch (saveError) {
          console.error('⚠️ Failed to save analysis:', saveError);
        }
      } else {
        console.error('❌ Backend returned unsuccessful result:', result);
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('❌ Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Load an existing analysis from history by ID
  const loadAnalysisById = async (analysisId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading analysis from history with ID:', analysisId);
      const { analysis, error } = await analysisHelpers.getAnalysisById(analysisId);
      
      if (error || !analysis) {
        console.error('❌ Failed to load analysis:', error);
        throw new Error('Analysis not found or could not be loaded');
      }
      
      console.log('✅ Loaded analysis from history:', analysis);
      setAnalysisData(analysis.analysis_data);
    } catch (error) {
      console.error('❌ Error loading analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze image when component mounts or load existing analysis
  useEffect(() => {
    console.log('🎯 Component mounted');
    
    // Check if we have an analysisId in the state
    const analysisId = location.state && (location.state as any).analysisId;
    
    if (analysisId) {
      // If we have an analysis ID, load that specific analysis
      console.log('🔍 Found analysis ID in state:', analysisId);
      loadAnalysisById(analysisId);
    } else if (passedImage) {
      // If we have an image, analyze it
      console.log('📷 Found image in state, analyzing...');
      analyzeImage(passedImage);
    } else {
      // No image or analysis ID provided
      console.warn('⚠️ No image or analysis ID provided');
      setError('No image or analysis ID provided');
      setIsLoading(false);
    }
  }, [passedImage, location.state]);

  // Get severity color based on level
  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Get severity color based on level (extending the previous function)

  // Export the current analysis as a printable report (open print preview so user can save as PDF)
  const exportReportAsPDF = () => {
    if (!analysisData) return;
    try {
      const reportHtml = `
        <html>
          <head>
            <title>FaceCare AI - Analysis Report</title>
            <style>
              body { background: #0b0b0b; color: #fff; font-family: Arial, Helvetica, sans-serif; padding: 24px }
              .header { display:flex; justify-content:space-between; align-items:center }
              .score { font-size:28px; font-weight:700 }
              .section { margin-top:18px }
              .issue { margin-bottom:8px }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>FaceCare AI — Analysis Report</h1>
                <div>Generated: ${new Date().toLocaleString()}</div>
              </div>
              <div class="score">${analysisData.healthy}/100</div>
            </div>
            <div class="section">
              <h2>Summary</h2>
              <p>${analysisData.issue_description}</p>
            </div>
            <div class="section">
              <h2>Detected Issues</h2>
              ${analysisData.issue_locations.map(i => `<div class="issue"><strong>${i.body_part}</strong>: ${i.location}</div>`).join('')}
            </div>
            <div class="section">
              <h2>Ayurvedic Remedies</h2>
              ${analysisData.remedies_ayurvedic.map(r => `<div class="issue">${r}</div>`).join('')}
            </div>
            <div class="section">
              <h2>Yoga Recommendations</h2>
              ${analysisData.yoga_recommendations.map(r => `<div class="issue">${r}</div>`).join('')}
            </div>
            <div class="section">
              <h2>Supplements</h2>
              ${analysisData.faster_supplements.map(s => `<div class="issue">${s}</div>`).join('')}
            </div>
            <script>
              setTimeout(()=>{ window.print(); }, 250);
            </script>
          </body>
        </html>
      `;

      const w = window.open('', '_blank');
      if (!w) {
        alert('Please allow popups to download the report.');
        return;
      }
      w.document.open();
      w.document.write(reportHtml);
      w.document.close();
    } catch (err) {
      console.error('Failed to export report', err);
      alert('Failed to export report');
    }
  };

  const shareReport = async () => {
    if (!analysisData) return;
    const summary = `FaceCare AI Analysis — Score ${analysisData.healthy}/100\nSummary: ${analysisData.issue_description}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: 'FaceCare AI Analysis Report',
          text: summary,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        alert('Summary copied to clipboard — you can paste it into a message or email.');
      } else {
        alert('Sharing not supported on this device.');
      }
    } catch (err) {
      console.error('Share failed', err);
      alert('Sharing failed');
    }
  };

  // Loading component
  if (isLoading) {
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
                <span className="text-gray-400">Analysis in Progress...</span>
              </div>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="glassmorphism rounded-2xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Analyzing Your Skin</h3>
            <p className="text-gray-300 mb-6">
              Our AI is carefully examining your image and generating personalized recommendations. This may take a few moments...
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Detecting skin conditions</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Analyzing root causes</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Generating Ayurvedic remedies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error component
  if (error) {
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
                <span className="text-gray-400">Analysis Error</span>
              </div>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="glassmorphism rounded-2xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Analysis Failed</h3>
            <p className="text-gray-300 mb-6">
              We encountered an error while analyzing your image. Please try again.
            </p>
            <p className="text-red-400 text-sm mb-6 font-mono bg-red-900/20 p-3 rounded">
              {error}
            </p>
            <div className="space-y-3">
              <GlowButton onClick={() => window.location.reload()} size="lg">
                Try Again
              </GlowButton>
              <GlowButton onClick={() => navigate('/dashboard')} variant="secondary" size="lg">
                Back to Dashboard
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no analysis data, show error
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Analysis Data</h2>
          <p className="text-gray-400">Unable to retrieve analysis results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">FaceCare AI</h1>
              <span className="text-gray-400 text-sm sm:text-base hidden sm:inline">Analysis Results</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 sm:space-x-4 flex-shrink-0">
              <GlowButton variant="secondary" size="sm" onClick={exportReportAsPDF} className="w-full sm:w-auto text-xs">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Download</span>
              </GlowButton>
              <GlowButton variant="secondary" size="sm" onClick={shareReport} className="w-full sm:w-auto text-xs">
                <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Share with Doctor</span>
                <span className="sm:hidden">Share</span>
              </GlowButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Scan Results Overview */}
        <div className="mb-12">
          {/* Face Image with Markers */}
          <div className="glassmorphism rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">Skin Analysis</h2>
            
            <div className="relative bg-gray-900 rounded-xl h-96 mb-6 flex items-center justify-center border border-gray-700">
              {passedImage ? (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <img src={passedImage} alt="analyzed" className="max-h-80 rounded-lg shadow-lg object-contain" />
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-600/20 to-cyan-500/20 rounded-full mx-auto mb-4 flex items-center justify-center relative">
                    <Scan className="w-16 h-16 text-purple-400" />
                    {/* Detection Markers */}
                    <div className="absolute top-2 right-4 w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="absolute bottom-6 left-2 w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="absolute top-8 left-6 w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <p className="text-gray-400">Analyzed facial areas</p>
                </div>
              )}
            </div>
          </div>

          {/* Overall Score */}
          <div className="glassmorphism rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Overall Health Score</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold gradient-text">{analysisData.healthy}/100</span>
              <span className={`px-4 py-2 rounded-full font-semibold capitalize ${getSeverityColor(analysisData.level)}`}>
                {analysisData.level}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${analysisData.healthy}%` }}
              ></div>
            </div>
          </div>

          {/* Issue Description */}
          <div className="glassmorphism rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Analysis Summary</h3>
            <p className="text-gray-300 leading-relaxed">
              {analysisData.issue_description}
            </p>
          </div>

          {/* Issue Locations */}
          <div className="glassmorphism rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Detected Issues</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.issue_locations.length > 0 ? (
                analysisData.issue_locations.map((issue, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-semibold">{issue.body_part}</p>
                        <p className="text-sm text-gray-400">{issue.location}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-4 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p>No significant issues detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="glassmorphism rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-6">Personalized Treatment Recommendations</h2>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8 border-b border-gray-700">
            <div className="flex flex-wrap gap-4">
              {[
                { id: 'remedies', label: 'Ayurvedic Remedies', icon: Lightbulb },
                { id: 'yoga', label: 'Yoga & Wellness', icon: Activity },
                { id: 'supplements', label: 'Supplements', icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-t-lg font-semibold transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-80">
            {activeTab === 'remedies' && (
              <div className="space-y-6">
                {analysisData.remedies_ayurvedic.length > 0 ? (
                  analysisData.remedies_ayurvedic.map((remedy, index) => (
                    <div key={index} className="bg-gray-900/30 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="prose prose-invert max-w-none">
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                              {remedy}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No specific Ayurvedic remedies available for your condition.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'yoga' && (
              <div className="space-y-6">
                {analysisData.yoga_recommendations.length > 0 ? (
                  analysisData.yoga_recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-gray-900/30 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="prose prose-invert max-w-none">
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                              {recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No specific yoga recommendations available.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'supplements' && (
              <div className="space-y-6">
                {analysisData.faster_supplements.length > 0 ? (
                  analysisData.faster_supplements.map((supplement, index) => (
                    <div key={index} className="bg-gray-900/30 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="prose prose-invert max-w-none">
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                              {supplement}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No specific supplement recommendations available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
                  {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 px-4">
          <GlowButton onClick={() => navigate('/dashboard')} size="lg" className="w-full sm:w-auto">
            New Analysis
          </GlowButton>
          <GlowButton variant="secondary" size="lg" onClick={exportReportAsPDF} className="w-full sm:w-auto">
            <Download className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">Download</span>
          </GlowButton>
          <GlowButton variant="secondary" size="lg" onClick={shareReport} className="w-full sm:w-auto">
            <Share className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Share Results</span>
            <span className="sm:hidden">Share</span>
          </GlowButton>
        </div>
      </div>
        {/* Progress Tracking */}
        <div className="glassmorphism rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6">Progress Overview</h2>
          
          {/* Metrics */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Issue Reduction</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-xl font-bold text-green-400">-34%</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Skin Health</span>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-400">+28%</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Overall Score</span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-purple-400">+15%</div>
            </div>
          </div>
          
          {/* Before/After Comparison */}
          <h4 className="font-medium mb-4">Comparison</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-center text-gray-400 mb-2 text-sm">Previous</p>
              <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-lg h-32 flex items-center justify-center">
                <span className="text-red-400 text-sm">More issues</span>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-center text-gray-400 mb-2 text-sm">Current</p>
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-lg h-32 flex items-center justify-center">
                <span className="text-green-400 text-sm">Improved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 px-4">
          <GlowButton onClick={() => navigate('/dashboard')} size="lg" className="w-full sm:w-auto">
            New Analysis
          </GlowButton>
          <GlowButton variant="secondary" size="lg" className="w-full sm:w-auto">
            <Download className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">Download</span>
          </GlowButton>
          <GlowButton variant="secondary" size="lg" className="w-full sm:w-auto">
            <Share className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Share Results</span>
            <span className="sm:hidden">Share</span>
          </GlowButton>
        </div>
      </div>
    
  );
};

export default AnalysisResults;