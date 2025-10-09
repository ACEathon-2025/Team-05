import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, 
  Brain, 
  Shield, 
  Activity,
  ArrowRight,
  Award
} from 'lucide-react';
import GlowButton from '../components/GlowButton';
import FeatureCard from '../components/FeatureCard';
import Hyperspeed from '../components/hyperspped';
import PillNav from '../components/nav';
import TrueFocus from '../components/focus';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items for PillNav
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'Sign In', href: '/auth' }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* PillNav Navigation */}
      <div className="flex justify-center w-full fixed top-0 z-50">
        <PillNav 
          logo="/images/facecare.png" // Use logo from public/images/facecare.png
          logoAlt="FaceCare AI"
          items={navItems}
          activeHref={location.pathname}
          ease="power2.easeOut"
          className="mt-6"
          baseColor="#5227FF" // Purple matching the color scheme
          pillColor="#0a0a0a" // Dark background for pills
          hoveredPillTextColor="#fff"
          pillTextColor="#fff"
        />
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-32 relative z-10">
        {/* Hyperspeed Background for hero section only */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Hyperspeed
            effectOptions={{
              distortion: 'turbulentDistortion',
              length: 400,
              roadWidth: 10,
              islandWidth: 2,
              lanesPerRoad: 4,
              fov: 90,
              fovSpeedUp: 150,
              speedUp: 2,
              carLightsFade: 0.4,
              totalSideLightSticks: 20,
              lightPairsPerRoadWay: 40,
              shoulderLinesWidthPercentage: 0.05,
              brokenLinesWidthPercentage: 0.1,
              brokenLinesLengthPercentage: 0.5,
              lightStickWidth: [0.12, 0.5],
              lightStickHeight: [1.3, 1.7],
              movingAwaySpeed: [60, 80],
              movingCloserSpeed: [-120, -160],
              carLightsLength: [400 * 0.03, 400 * 0.2],
              carLightsRadius: [0.05, 0.14],
              carWidthPercentage: [0.3, 0.5],
              carShiftX: [-0.8, 0.8],
              carFloorSeparation: [0, 5],
              colors: {
                roadColor: 0x080808,
                islandColor: 0x0a0a0a,
                background: 0x000000,
                shoulderLines: 0xFFFFFF,
                brokenLines: 0xFFFFFF,
                // Updated to black/white/purple theme
                leftCars: [0xFFFFFF, 0xDDDDDD, 0xCCCCCC],
                rightCars: [0x5227FF, 0x7A5AF8, 0x9F88FF],
                sticks: 0x5227FF,
              }
            }}
          />
        </div>
        
        <div className="max-w-5xl mx-auto text-center p-8 relative z-10">
          <div className="mb-8">
            <div className="mb-4">
              <div className="overflow-hidden py-2">
                <TrueFocus 
                  sentence="Professional AI-Powered"
                  manualMode={false}
                  blurAmount={1.5}
                  borderColor="#5227FF"
                  glowColor="rgba(82, 39, 255, 0.6)"
                  animationDuration={1.2}
                  pauseBetweenAnimations={1.8}
                  fontSize="2.6rem"
                  fontWeight={650}
                />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mt-3">
                Skin Health Analysis
              </h2>
            </div>

            <p className="text-xs md:text-sm text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 font-light">
              Advanced artificial intelligence technology for comprehensive skin health assessment,
              personalized treatment recommendations, and professional-grade analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center px-2 mt-4">
              <GlowButton 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="text-xs w-full sm:w-auto px-6 py-2 tracking-wider"
              >
                START ANALYSIS
                <ArrowRight className="w-20 h-3 ml-2" />
              </GlowButton>
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