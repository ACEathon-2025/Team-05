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
  FileImage
} from 'lucide-react';
import GlowButton from '../components/GlowButton';

const Dashboard: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'camera' | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const previousScans = [
    { id: 1, date: '2025-01-14', severity: 'Moderate', score: 67 },
    { id: 2, date: '2025-01-10', severity: 'Mild', score: 78 },
    { id: 3, date: '2025-01-05', severity: 'Severe', score: 45 },
  ];

  const handleAnalysis = () => {
    // Prefer captured image, then file preview
    const image = capturedImage || previewUrl || null;
    navigate('/analysis', { state: { image } });
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold gradient-text">FaceCare AI</h1>
              
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-white font-medium border-b-2 border-purple-500 pb-1">Dashboard</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">History</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Profile</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Settings</a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden md:block font-medium">John Smith</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl py-2 border border-gray-700">
                    <a href="#" className="block px-4 py-2 hover:bg-gray-800 transition-colors">
                      <User className="w-4 h-4 inline mr-2" />
                      Profile
                    </a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-800 transition-colors">
                      <Settings className="w-4 h-4 inline mr-2" />
                      Settings
                    </a>
                    <hr className="my-2 border-gray-700" />
                    <a 
                      href="#" 
                      onClick={() => navigate('/')}
                      className="block px-4 py-2 hover:bg-gray-800 transition-colors text-red-400"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back, John</h2>
          <p className="text-gray-300">Ready for your skin health analysis?</p>
        </div>

        {/* Main Analysis Section */}
        <div className="glassmorphism rounded-2xl p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Start New Analysis</h3>
            <p className="text-gray-300 mb-8">
              Choose your preferred method for skin analysis
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => { setUploadMethod('upload'); }}
                className={`flex items-center justify-center px-6 py-4 rounded-lg border-2 transition-all ${
                  uploadMethod === 'upload' 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-600 hover:border-purple-500'
                }`}
              >
                <Upload className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Upload Photo</div>
                  <div className="text-sm text-gray-400">From gallery or files</div>
                </div>
              </button>
              
              <button
                onClick={() => { setUploadMethod('camera'); openCamera(); }}
                className={`flex items-center justify-center px-6 py-4 rounded-lg border-2 transition-all ${
                  uploadMethod === 'camera' 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-600 hover:border-purple-500'
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
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 mb-6 hover:border-purple-500 transition-colors">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {!previewUrl && !capturedImage && (
                  <div className="text-center p-6">
                    <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300 mb-2">Drag and drop your image here or choose a file</p>
                    <p className="text-sm text-gray-500">JPG, PNG, HEIC up to 10MB</p>
                  </div>
                )}
                {(previewUrl || capturedImage) && (
                  <div className="flex flex-col items-center space-y-4">
                    <img src={capturedImage || previewUrl || undefined} alt="preview" className="max-h-64 rounded-md shadow-md" />
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
              <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-600 text-center">
                <Camera className="w-14 h-14 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300 mb-2">Camera will open for live scanning</p>
                <p className="text-sm text-gray-500 mb-4">Position your face in the frame</p>
                <div className="flex justify-center gap-3">
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
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
                <div className="bg-gray-900 rounded-xl p-6 w-11/12 max-w-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Live Camera</h4>
                    <button className="text-gray-400 hover:text-white" onClick={() => { setShowCameraModal(false); stopCameraStream(); }}>Close</button>
                  </div>
                  <div className="bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} className="w-full h-80 bg-black" autoPlay playsInline muted />
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={() => { setShowCameraModal(false); stopCameraStream(); }} className="px-4 py-2 bg-gray-700 rounded-md">Cancel</button>
                    <button onClick={handleCapture} className="px-4 py-2 bg-purple-600 text-white rounded-md">Capture</button>
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
            <h3 className="text-xl font-bold">Recent Analysis</h3>
            <a href="#" className="text-purple-400 hover:text-purple-300 font-medium">View All</a>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {previousScans.map((scan) => (
              <div 
                key={scan.id} 
                className="glassmorphism rounded-xl p-6 hover:bg-purple-900/10 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/analysis')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    scan.severity === 'Mild' ? 'bg-green-500/20 text-green-400' :
                    scan.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {scan.severity}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-lg font-semibold">Score: {scan.score}/100</div>
                </div>
                
                <div className="flex items-center text-gray-300 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  {scan.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glassmorphism rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Total Scans</p>
                <p className="text-2xl font-bold gradient-text">24</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-green-400 text-sm">+12% this month</p>
          </div>
          
          <div className="glassmorphism rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Improvement</p>
                <p className="text-2xl font-bold gradient-text">67%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-green-400 text-sm">+23% improvement</p>
          </div>
          
          <div className="glassmorphism rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Streak</p>
                <p className="text-2xl font-bold gradient-text">7 days</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-green-400 text-sm">Keep it up!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;