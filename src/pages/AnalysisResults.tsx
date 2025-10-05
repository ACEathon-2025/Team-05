import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Scan,
  Brain,
  Utensils,
  Activity,
  CheckCircle,
  X,
  Lightbulb,
  Clock,
  TrendingUp,
  Camera,
  AlertCircle,
  Target,
  MapPin
} from 'lucide-react';
import GlowButton from '../components/GlowButton';

import { useLocation } from 'react-router-dom';

const AnalysisResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState('remedies');
  const navigate = useNavigate();
  const location = useLocation();
  const passedImage = (location.state && (location.state as any).image) || null;

  const detectionResults = {
    pimples: 8,
    darkSpots: 3,
    severity: 'Moderate',
    overallScore: 67,
  };

  const rootCauses = [
    { icon: Brain, title: 'Stress Factors', confidence: 85, description: 'Elevated stress levels detected' },
    { icon: Activity, title: 'Hormonal Changes', confidence: 72, description: 'Hormonal fluctuations affecting skin' },
    { icon: Utensils, title: 'Dietary Factors', confidence: 68, description: 'Diet correlation with skin condition' },
    { icon: Clock, title: 'Sleep Quality', confidence: 54, description: 'Sleep patterns affecting skin health' },
  ];

  const recommendations = {
    remedies: [
      {
        title: 'Natural Clay Mask',
        ingredients: ['Bentonite clay', 'Water', 'Honey'],
        steps: ['Mix clay with water to form paste', 'Add honey for moisturizing', 'Apply to clean face', 'Leave for 15 minutes', 'Rinse with lukewarm water'],
        timeline: '2-3 weeks for improvement'
      },
      {
        title: 'Green Tea Toner',
        ingredients: ['Green tea bags', 'Hot water', 'Cotton pads'],
        steps: ['Steep tea bags in hot water', 'Let cool completely', 'Apply with cotton pad', 'Use twice daily'],
        timeline: '1-2 weeks for results'
      }
    ],
    diet: [
      { type: 'avoid', items: ['Processed foods', 'High-sugar items', 'Dairy products', 'Fried foods'] },
      { type: 'increase', items: ['Fresh vegetables', 'Fruits', 'Water intake', 'Lean proteins'] }
    ],
    lifestyle: [
      'Maintain consistent sleep schedule',
      'Practice stress management',
      'Regular exercise routine',
      'Proper skincare hygiene'
    ]
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
              <span className="text-gray-400">Analysis Results</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <GlowButton variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </GlowButton>
              <GlowButton variant="secondary" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share with Doctor
              </GlowButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Scan Results Overview */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="glassmorphism rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6">Skin Analysis</h2>
            
            {/* Face Image with Markers */}
            <div className="relative bg-gray-900 rounded-xl h-80 mb-6 flex items-center justify-center border border-gray-700">
              {passedImage ? (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <img src={passedImage} alt="analyzed" className="max-h-72 rounded-lg shadow-lg object-contain" />
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

          <div className="space-y-6">
            {/* Overall Score */}
            <div className="glassmorphism rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Overall Score</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold gradient-text">{detectionResults.overallScore}/100</span>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  detectionResults.severity === 'Mild' ? 'bg-green-500/20 text-green-400' :
                  detectionResults.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {detectionResults.severity}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${detectionResults.overallScore}%` }}
                ></div>
              </div>
            </div>

            {/* Detection Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glassmorphism rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pimples</p>
                    <p className="text-2xl font-bold text-red-400">{detectionResults.pimples}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-red-400" />
                </div>
              </div>
              
              <div className="glassmorphism rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Dark Spots</p>
                    <p className="text-2xl font-bold text-yellow-400">{detectionResults.darkSpots}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div className="glassmorphism rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-6">Contributing Factors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rootCauses.map((cause, index) => (
              <div key={index} className="bg-gray-900/50 rounded-xl p-6 hover:bg-purple-900/10 transition-colors">
                <div className="flex items-center mb-4">
                  <cause.icon className="w-8 h-8 text-purple-400 mr-3" />
                  <div>
                    <h4 className="font-semibold">{cause.title}</h4>
                    <p className="text-sm text-purple-400">{cause.confidence}% match</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{cause.description}</p>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full"
                    style={{ width: `${cause.confidence}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="glassmorphism rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-6">Treatment Recommendations</h2>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-700">
            {[
              { id: 'remedies', label: 'Natural Treatments', icon: Lightbulb },
              { id: 'diet', label: 'Nutrition', icon: Utensils },
              { id: 'lifestyle', label: 'Lifestyle', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
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

          {/* Tab Content */}
          <div className="min-h-80">
            {activeTab === 'remedies' && (
              <div className="space-y-8">
                {recommendations.remedies.map((remedy, index) => (
                  <div key={index} className="bg-gray-900/30 rounded-xl p-6">
                    <h4 className="text-lg font-bold mb-4 text-purple-400">{remedy.title}</h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3 text-gray-300">Ingredients:</h5>
                        <ul className="space-y-2">
                          {remedy.ingredients.map((ingredient, i) => (
                            <li key={i} className="flex items-center text-gray-300">
                              <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                              {ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-3 text-gray-300">Instructions:</h5>
                        <ol className="space-y-2">
                          {remedy.steps.map((step, i) => (
                            <li key={i} className="flex text-gray-300">
                              <span className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-1">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-900/10 rounded-lg border border-blue-500/20">
                      <Clock className="w-5 h-5 text-blue-400 inline mr-2" />
                      <span className="text-blue-400 font-medium">Timeline: </span>
                      <span className="text-gray-300">{remedy.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'diet' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-900/10 rounded-xl p-6 border border-red-500/20">
                  <h4 className="text-lg font-bold mb-4 text-red-400 flex items-center">
                    <X className="w-6 h-6 mr-2" />
                    Limit These
                  </h4>
                  <ul className="space-y-3">
                    {recommendations.diet[0].items.map((item, i) => (
                      <li key={i} className="flex items-center text-gray-300">
                        <X className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-green-900/10 rounded-xl p-6 border border-green-500/20">
                  <h4 className="text-lg font-bold mb-4 text-green-400 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Include More
                  </h4>
                  <ul className="space-y-3">
                    {recommendations.diet[1].items.map((item, i) => (
                      <li key={i} className="flex items-center text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'lifestyle' && (
              <div className="grid md:grid-cols-2 gap-6">
                {recommendations.lifestyle.map((tip, index) => (
                  <div key={index} className="bg-gray-900/30 rounded-xl p-6 flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mr-4 flex-shrink-0" />
                    <span className="text-gray-300">{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="glassmorphism rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6">Progress Overview</h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Before/After Comparison */}
            <div className="lg:col-span-2">
              <h4 className="font-medium mb-4">Comparison</h4>
                    <AlertCircle className="w-8 h-8 text-red-400" />
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
            
            {/* Metrics */}
            <div className="space-y-4">
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <GlowButton onClick={() => navigate('/dashboard')} size="lg">
            New Analysis
          </GlowButton>
          <GlowButton variant="secondary" size="lg">
            <Download className="w-5 h-5 mr-2" />
            Download Report
          </GlowButton>
          <GlowButton variant="secondary" size="lg">
            <Share className="w-5 h-5 mr-2" />
            Share Results
          </GlowButton>
        </div>
      </div>

  );
};

export default AnalysisResults;