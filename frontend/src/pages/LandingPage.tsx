import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight,
  Award
} from 'lucide-react';
import GlowButton from '../components/GlowButton';
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
          logo="/images/facecare.png"
          logoAlt="FaceCare AI"
          items={navItems}
          activeHref={location.pathname}
          ease="power2.easeOut"
          className="mt-6"
          baseColor="#1db954" // Green for skin care
          pillColor="#0a0a0a"
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
              ...{
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
                  leftCars: [0xFFFFFF, 0xDDDDDD, 0xCCCCCC],
                  rightCars: [0x1db954, 0xA7FFB2, 0x52FF7A], // Green shades
                  sticks: 0x1db954, // Green
                }
              }
            }}
          />
        </div>
        
        <div className="max-w-5xl mx-auto text-center p-8 relative z-10">
          <div className="mb-8">
            <div className="mb-4">
              <div className="overflow-hidden py-2">
                <TrueFocus  
                  sentence="Smart Skin Care"
                  manualMode={false}
                  blurAmount={1.5}
                  borderColor="#1db954"
                  glowColor="rgba(29,185,84,0.55)"
                  animationDuration={1.2}
                  pauseBetweenAnimations={1.8}
                  fontSize="2.6rem"
                  fontWeight={700}
                />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mt-3 text-white">
                Skin Health Analysis
              </h2>
            </div>

            <p className="text-xs md:text-sm text-gray-200 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 font-light">
              Professional-grade skin health assessment, personalized recommendations, and expert analysis powered by AI.
            </p>

            <div className="flex justify-center px-2 mt-4">
              <GlowButton 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center text-xs w-full sm:w-auto px-6 py-2 tracking-wider bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <span>START ANALYSIS</span>
                <ArrowRight className="w-4 h-4" />
              </GlowButton>
            </div>
          </div>
        </div>
      </section>

      {/* Image Grid Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Your skin deserves better than guesswork
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Professional skincare analysis meets cutting-edge technology. See the difference personalized care makes.
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              {/* Top left */}
              <div className="relative group overflow-hidden rounded-2xl shadow-lg">
                <img 
                  src="/images/skin type.png"
                  alt="Skin type analysis"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-semibold">Skin Type Analysis</div>
                  <div className="text-sm opacity-90">Personalized for your skin type</div>
                </div>
              </div>
              
              {/* Top right */}
              <div className="relative group overflow-hidden rounded-2xl shadow-lg">
                <img 
                  src="/images/personized ai.png"
                  alt="Personalized AI analysis"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-semibold">Personalized AI</div>
                  <div className="text-sm opacity-90">Instant professional insights</div>
                </div>
              </div>
              
              {/* Bottom left */}
              <div className="relative group overflow-hidden rounded-2xl shadow-lg">
                <img 
                  src="/images/natural ingreedients.png.png"
                  alt="Natural skincare ingredients"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-semibold">Natural Ingredients</div>
                  <div className="text-sm opacity-90">Science-backed formulations</div>
                </div>
              </div>
              
              {/* Bottom right */}
              <div className="relative group overflow-hidden rounded-2xl shadow-lg">
                <img 
                  src="/images/products.png"
                  alt="Expert skincare products"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-semibold">Expert Products</div>
                  <div className="text-sm opacity-90">Curated recommendations</div>
                </div>
              </div>
            </div>
            
            {/* Center description popup */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-green-200 max-w-sm text-center transform hover:scale-105 transition-transform">
                <div className="text-2xl font-bold text-green-600 mb-2">✨ AI-Powered</div>
                <div className="text-lg text-gray-800 font-semibold mb-1">Smart Analysis</div>
                <div className="text-sm text-gray-600">Advanced technology for your skin</div>
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-4 bg-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="/images/natural insights.png" 
                alt="Natural insights for beautiful skin"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-xl font-bold text-green-600">🌿 Natural</div>
                <div className="text-sm text-gray-600">Ingredient Focus</div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Get personalized skin insights instantly
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Our technology analyzes your skin in seconds, providing professional-grade insights 
                that typically require expensive consultations. Know exactly what your skin needs, when it needs it.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1 mr-4">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Instant analysis from your phone camera</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1 mr-4">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Personalized product recommendations that actually work</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1 mr-4">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Track your progress over time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Reimagined */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Three steps to healthier skin
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've made professional skin analysis as simple as taking a selfie
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <img 
                  src="/images/skin type.png" 
                  alt="Skin type analysis capture"
                  className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Capture</h3>
              <p className="text-gray-600 leading-relaxed">
                Take a quick photo or use live camera mode. Our system works with any smartphone camera - no special equipment needed.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <img 
                  src="/images/personized ai.png" 
                  alt="AI analysis visualization"
                  className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Analyze</h3>
              <p className="text-gray-600 leading-relaxed">
                Our system examines texture, tone, moisture levels, and identifies potential concerns in under 5 seconds.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <img 
                  src="/images/products.png" 
                  alt="Expert skincare products"
                  className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Transform</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your personalized skin report with specific product recommendations and a custom routine plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">🔬 AI</div>
              <div className="text-gray-300">Advanced Technology</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">🌿 Natural</div>
              <div className="text-gray-300">Ingredient Analysis</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">📱 Mobile</div>
              <div className="text-gray-300">Easy to Use</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">⚡ Fast</div>
              <div className="text-gray-300">Quick Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
  <section className="py-20 px-4 bg-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-green-700">
            Ready to Transform Your Skin Health?
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our AI-powered skin analysis technology
          </p>
          <GlowButton 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-12 py-4 bg-green-600 hover:bg-green-700 text-white"
          >
            Start Free Analysis
          </GlowButton>
        </div>
      </section>

      {/* Footer */}
  <footer className="bg-green-900 border-t border-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <h3 className="text-xl font-bold text-green-400 mb-4">FaceCare AI</h3>
              <p className="text-green-100 text-sm mb-4">
                Professional skin health analysis platform providing 
                accurate assessments and personalized treatment recommendations.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <span className="text-xs text-white">f</span>
                </div>
                <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <span className="text-xs text-white">t</span>
                </div>
                <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <span className="text-xs text-white">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-200">Product</h4>
              <ul className="space-y-2 text-sm text-green-100">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-200">Company</h4>
              <ul className="space-y-2 text-sm text-green-100">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-200">Support</h4>
              <ul className="space-y-2 text-sm text-green-100">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="section-divider my-8"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-green-100 mb-4 md:mb-0">
              © 2025 FaceCare AI Technologies Inc. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-green-100">
              <span>Made with AI Technology</span>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-green-300" />
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