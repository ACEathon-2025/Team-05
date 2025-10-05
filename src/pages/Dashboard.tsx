import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  User, 
  Settings, 
  Bell, 
  LogOut,
  Clock,
  TrendingUp,
  Activity,
  FileImage,
  MessageCircle,
  Menu,
  X
} from 'lucide-react';
import GlowButton from '../components/GlowButton';
import { supabase } from '../utils/supabaseClient';
import { useTheme } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'camera' | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const previousScans = [
    { id: 1, date: '2025-01-14', severity: 'Moderate', score: 67 },
    { id: 2, date: '2025-01-10', severity: 'Mild', score: 78 },
    { id: 3, date: '2025-01-05', severity: 'Severe', score: 45 },
  ];

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAnalysis = () => {
    // Prefer captured image, then file preview
    const image = capturedImage || previewUrl || null;
    navigate('/analysis', { state: { image } });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
      } else {
        // Successfully signed out, navigate to home/auth page
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Still navigate to home even if there's an error
      navigate('/');
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCameraModal(true);
    } catch (err: any) {
      console.error('Camera error', err);
      setCameraError(err?.message || 'Unable to access camera.');
    }
  };

  const closeCamera = () => {
    setShowCameraModal(false);
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!showCameraModal) stopCameraStream();
    // cleanup on unmount
    return () => stopCameraStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCameraModal]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    // stop camera and navigate to analysis with captured image
    setShowCameraModal(false);
    stopCameraStream();
    navigate('/analysis', { state: { image: dataUrl } });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // revoke preview object URL when selectedFile changes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch {};
      }
    };
  }, [previewUrl]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${
        isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold gradient-text">FaceCare AI</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <a href="#" className={`font-medium border-b-2 border-purple-500 pb-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Dashboard</a>
              <button onClick={() => navigate('/history')} className={`transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>History</button>
              <button onClick={() => navigate('/profile')} className={`transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>Profile</button>
              <button onClick={() => navigate('/profile')} className={`transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>Settings</button>
            </nav>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center space-x-4">
              <button className={`relative p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-medium">
                    {user?.email ? user.email.split('@')[0] : 'User'}
                  </span>
                </button>

                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-2 border z-50 ${
                    isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <button onClick={() => navigate('/profile')} className={`block w-full text-left px-4 py-2 transition-colors ${
                      isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}>
                      <User className="w-4 h-4 inline mr-2" />
                      Profile
                    </button>
                    <button onClick={() => navigate('/profile')} className={`block w-full text-left px-4 py-2 transition-colors ${
                      isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}>
                      <Settings className="w-4 h-4 inline mr-2" />
                      Settings
                    </button>
                    <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleSignOut();
                      }}
                      className={`block px-4 py-2 transition-colors text-red-400 ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <button className={`relative p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
              </button>
              
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className={`md:hidden border-t py-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <nav className="flex flex-col space-y-2">
                <a href="#" className={`font-medium px-2 py-2 rounded border-l-4 border-purple-500 ${
                  isDarkMode ? 'text-white bg-gray-800/50' : 'text-gray-900 bg-gray-100'
                }`}>Dashboard</a>
                <button onClick={() => {
                  navigate('/history');
                  setShowMobileMenu(false);
                }} className={`text-left px-2 py-2 rounded transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>History</button>
                <button onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }} className={`text-left px-2 py-2 rounded transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>Profile</button>
                <button onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }} className={`text-left px-2 py-2 rounded transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>Settings</button>
                
                <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                
                <div className="flex items-center space-x-3 px-2 py-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-medium">
                    {user?.email ? user.email.split('@')[0] : 'User'}
                  </span>
                </div>
                
                <button onClick={handleSignOut} className={`text-left px-2 py-2 rounded transition-colors text-red-400 ${
                  isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100'
                }`}>
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Sign Out
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Welcome back, {user?.email ? user.email.split('@')[0] : 'User'}
          </h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ready for your skin health analysis?</p>
        </div>

        {/* Main Analysis Section */}
        <div className="glassmorphism rounded-2xl p-4 md:p-8 mb-8 md:mb-12">
          <div className="text-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Start New Analysis</h3>
            <p className={`mb-6 md:mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Choose your preferred method for skin analysis
            </p>
            
            <div className="flex flex-col gap-4 justify-center mb-6 md:mb-8">
              <button
                onClick={() => { setUploadMethod('upload'); }}
                className={`flex items-center justify-center px-4 md:px-6 py-4 rounded-lg border-2 transition-all ${
                  uploadMethod === 'upload' 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : `border-gray-600 hover:border-purple-500 ${isDarkMode ? '' : 'border-gray-300'}`
                }`}
              >
                <Upload className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Upload Photo</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>From gallery or files</div>
                </div>
              </button>
              
              <button
                onClick={() => { setUploadMethod('camera'); openCamera(); }}
                className={`flex items-center justify-center px-4 md:px-6 py-4 rounded-lg border-2 transition-all ${
                  uploadMethod === 'camera' 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : `border-gray-600 hover:border-purple-500 ${isDarkMode ? '' : 'border-gray-300'}`
                }`}
              >
                <Camera className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Live Camera</div>
                  <div className="text-sm text-gray-400">Real-time scanning</div>
                </div>
              </button>
            </div>

            {uploadMethod === 'upload' && (
              <div className={`border-2 border-dashed rounded-xl p-4 md:p-6 mb-6 hover:border-purple-500 transition-colors ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {!previewUrl && !capturedImage && (
                  <div className="text-center p-4 md:p-6">
                    <FileImage className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-400" />
                    <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Drag and drop your image here or choose a file</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG, HEIC up to 10MB</p>
                  </div>
                )}
                {(previewUrl || capturedImage) && (
                  <div className="flex flex-col items-center space-y-4">
                    <img src={capturedImage || previewUrl || undefined} alt="preview" className="max-h-48 md:max-h-64 rounded-md shadow-md w-full max-w-sm object-contain" />
                    <div className="flex gap-3">
                      <GlowButton onClick={() => fileInputRef.current?.click()} variant="secondary">Change</GlowButton>
                      <GlowButton onClick={handleAnalysis}>Analyze</GlowButton>
                    </div>
                  </div>
                )}
                {!previewUrl && !capturedImage && (
                  <div className="mt-4 flex justify-center">
                    <GlowButton onClick={() => fileInputRef.current?.click()}>Choose File</GlowButton>
                  </div>
                )}
              </div>
            )}

            {uploadMethod === 'camera' && (
              <div className={`rounded-xl p-4 md:p-6 mb-6 border text-center ${
                isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'
              }`}>
                <Camera className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-gray-400" />
                <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Camera will open for live scanning</p>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Position your face in the frame</p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <GlowButton onClick={openCamera}>Open Camera</GlowButton>
                  <GlowButton variant="secondary" onClick={() => { setCapturedImage(null); setPreviewUrl(null); }}>Clear</GlowButton>
                </div>
                {cameraError && <p className="text-red-400 text-sm mt-3">{cameraError}</p>}
              </div>
            )}

            {/* When uploadMethod is set we show contextual actions above; keep this area for spacing */}
            {false && uploadMethod && (
              <GlowButton onClick={handleAnalysis} size="lg" className="px-12">
                {uploadMethod === 'upload' ? 'Choose File' : 'Start Camera'}
              </GlowButton>
            )}

            {/* Camera modal */}
            {showCameraModal && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Live Camera</h4>
                    <button 
                      className={`transition-colors ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`} 
                      onClick={() => { setShowCameraModal(false); stopCameraStream(); }}
                    >
                      Close
                    </button>
                  </div>
                  <div className="bg-black rounded-md overflow-hidden mb-4">
                    <video ref={videoRef} className="w-full h-48 md:h-80 bg-black object-cover" autoPlay playsInline muted />
                  </div>
                  <div className="flex justify-end gap-3 flex-wrap">
                    <button 
                      onClick={() => { setShowCameraModal(false); stopCameraStream(); }} 
                      className={`px-4 py-2 rounded-md transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCapture} 
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Capture
                    </button>
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Previous Scans */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg md:text-xl font-bold">Recent Analysis</h3>
            <button onClick={() => navigate('/history')} className="text-purple-400 hover:text-purple-300 font-medium text-sm md:text-base">View All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {previousScans.map((scan) => (
              <div 
                key={scan.id} 
                className="glassmorphism rounded-xl p-4 md:p-6 hover:bg-purple-900/10 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/analysis')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                    scan.severity === 'Mild' ? 'bg-green-500/20 text-green-400' :
                    scan.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{scan.severity}</span>
                </div>
                <div className="mb-3">
                  <div className="text-2xl md:text-3xl font-bold text-purple-400">{scan.score}</div>
                  <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Health Score</div>
                </div>
                <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {scan.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Consultation Section */}
        <div className="glassmorphism rounded-2xl p-8 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Get Personalized Skincare Advice</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Chat with our AI consultant to get personalized skincare recommendations based on your skin type, concerns, and lifestyle.
            </p>
            <GlowButton onClick={() => navigate('/chat')} size="lg" className="px-8">
              Start AI Consultation
            </GlowButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glassmorphism rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Scans</p>
                <p className="text-xl md:text-2xl font-bold gradient-text">24</p>
              </div>
              <Activity className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
            </div>
            <p className="text-green-400 text-sm">+12% this month</p>
          </div>
          
          <div className="glassmorphism rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Improvement</p>
                <p className="text-xl md:text-2xl font-bold gradient-text">67%</p>
              </div>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
            </div>
            <p className="text-green-400 text-sm">+23% improvement</p>
          </div>
          
          <div className="glassmorphism rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Streak</p>
                <p className="text-xl md:text-2xl font-bold gradient-text">7 days</p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
            </div>
            <p className="text-green-400 text-sm">Keep it up!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;