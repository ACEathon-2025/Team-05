import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Brain, 
  Shield, 
  Activity,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Award,
  Zap
} from 'lucide-react';
import GlowButton from '../components/GlowButton';
import FeatureCard from '../components/FeatureCard';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg md:text-xl font-bold gradient-text">FaceCare AI</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
              <GlowButton onClick={() => navigate('/auth')} size="sm">
                Get Started
              </GlowButton>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <GlowButton onClick={() => navigate('/auth')} size="sm">
                Sign In
              </GlowButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              Professional AI-Powered
              <span className="gradient-text block">Skin Health Analysis</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Advanced artificial intelligence technology for comprehensive skin health assessment, 
              personalized treatment recommendations, and professional-grade analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <GlowButton 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-sm md:text-base w-full sm:w-auto"
              >
                Start Analysis
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </GlowButton>
              <button className="flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-white border border-gray-600 rounded-lg hover:border-purple-500 transition-colors w-full sm:w-auto">
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Advanced AI Technology
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              Cutting-edge machine learning algorithms provide accurate skin analysis 
              and personalized treatment recommendations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <FeatureCard
              icon={Camera}
              title="Real-Time Scanning"
              description="Advanced computer vision technology for instant skin analysis and detection"
            />
            <FeatureCard
              icon={Brain}
              title="AI Analysis"
              description="Deep learning algorithms identify patterns and provide accurate assessments"
            />
            <FeatureCard
              icon={Shield}
              title="Safety Validation"
              description="Professional-grade safety checking for skincare products and treatments"
            />
            <FeatureCard
              icon={Activity}
              title="Progress Tracking"
              description="Comprehensive monitoring and analytics for treatment effectiveness"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Simple three-step process for comprehensive skin health analysis
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload or Scan</h3>
              <p className="text-gray-300">
                Upload a photo or use live camera scanning for real-time analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
              <p className="text-gray-300">
                Advanced algorithms analyze your skin condition and identify issues
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Results</h3>
              <p className="text-gray-300">
                Receive detailed analysis and personalized treatment recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">98%</div>
              <div className="text-gray-300">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-gray-300">Users Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-gray-300">Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">5 Sec</div>
              <div className="text-gray-300">Analysis Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            Ready to Transform Your Skin Health?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our AI-powered skin analysis technology
          </p>
          <GlowButton 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-12 py-4"
          >
            Start Free Analysis
          </GlowButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <h3 className="text-xl font-bold gradient-text mb-4">FaceCare AI</h3>
              <p className="text-gray-400 text-sm mb-4">
                Professional AI-powered skin health analysis platform providing 
                accurate assessments and personalized treatment recommendations.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                  <span className="text-xs">f</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                  <span className="text-xs">t</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                  <span className="text-xs">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="section-divider my-8"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2025 FaceCare AI Technologies Inc. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Made with AI Technology</span>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;