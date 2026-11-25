import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanBarcode,
  Search,
  Camera,
  CameraOff,
  Plus,
  AlertCircle,
  CheckCircle2,
  Apple,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Trash2,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchProductByBarcode,
  searchFoodByName,
  scaleItemByGrams,
  calculateMealTotals
} from '../services/foodService';
import {
  analyzeFoodImage,
  fileToBase64,
  dataUrlToBase64,
  isGeminiConfigured
} from '../services/aiFoodService';
import { saveMeal } from '../services/storageService';
import { getLocalDateString } from '../utils/calculations';
import Modal from '../components/common/Modal';

export default function FoodScanner() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ---------------- AI FOOD PHOTO SCANNER STATE ----------------
  const [aiCameraOpen, setAiCameraOpen] = useState(false);
  const [aiCameraError, setAiCameraError] = useState('');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const [photoPayload, setPhotoPayload] = useState(null); // { base64, mimeType }
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiMealName, setAiMealName] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [aiItems, setAiItems] = useState([]);
  const [aiCategory, setAiCategory] = useState('Lunch');
  const [aiSavedSuccess, setAiSavedSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const galleryInputRef = useRef(null);

  // ---------------- BARCODE & SEARCH STATE ----------------
  const [barcodeInput, setBarcodeInput] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [servingGrams, setServingGrams] = useState(100);
  const [mealCategory, setMealCategory] = useState('Lunch');

  // Camera Barcode Scanner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);

  // Manual Food Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualFood, setManualFood] = useState({
    name: '',
    brand: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    serving: '1 serving (100g)',
    category: 'Lunch'
  });

  const geminiReady = isGeminiConfigured();

  // Clean up cameras on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
      stopAiCamera();
    };
  }, []);

  // ---------------- AI PHOTO CAMERA & GALLERY HANDLERS ----------------
  const stopAiCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setAiCameraOpen(false);
  };

  const handleOpenAiCamera = async () => {
    setAiCameraError('');
    setAiError('');
    setAiSavedSuccess(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Camera capture is not supported in this browser. Please choose an image from your gallery.';
      setAiCameraError(msg);
      showToast(msg, 'error');
      return;
    }

    try {
      // Stop barcode scanner if active
      if (isCameraActive) {
        await stopCameraScanner();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      mediaStreamRef.current = stream;
      setAiCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      let msg = 'Unable to access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings or upload from gallery.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found. Please select a food photo from your gallery.';
      }
      setAiCameraError(msg);
      showToast(msg, 'error');
    }
  };

  const runAiFoodAnalysis = async (payload) => {
    setAiAnalyzing(true);
    setAiError('');
    setAiItems([]);
    setAiNotes('');
    setAiSavedSuccess(false);

    try {
      const result = await analyzeFoodImage(payload);
      setAiMealName(result.mealName);
      setAiNotes(result.notes);
      setAiItems(result.items);
      showToast(`Identified ${result.items.length} food item${result.items.length === 1 ? '' : 's'}!`, 'success');
    } catch (err) {
      setAiError(err.message || 'Failed to analyze food photo.');
      showToast(err.message || 'Food analysis failed.', 'error');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const payload = dataUrlToBase64(dataUrl);

    stopAiCamera();
    setCapturedPhotoUrl(dataUrl);
    setPhotoPayload(payload);
    runAiFoodAnalysis(payload);
  };

  const handleGallerySelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    stopAiCamera();
    setAiError('');
    setAiSavedSuccess(false);

    try {
      const { base64, mimeType, dataUrl } = await fileToBase64(file);
      setCapturedPhotoUrl(dataUrl);
      const payload = { base64, mimeType };
      setPhotoPayload(payload);
      runAiFoodAnalysis(payload);
    } catch (err) {
      setAiError(err.message || 'Could not read selected image.');
      showToast('Failed to load selected image.', 'error');
    }
  };

  const handleRetakeOrClear = () => {
    setCapturedPhotoUrl('');
    setPhotoPayload(null);
    setAiItems([]);
    setAiMealName('');
    setAiNotes('');
    setAiError('');
    setAiSavedSuccess(false);
  };

  const handleItemNameChange = (id, newName) => {
    setAiItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleItemPortionTextChange = (id, newPortion) => {
    setAiItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, portion: newPortion } : item))
    );
  };

  const handleItemGramsChange = (id, newGramsRaw) => {
    const newGrams = Math.max(1, parseInt(newGramsRaw, 10) || 1);
    setAiItems((prev) =>
      prev.map((item) => (item.id === id ? scaleItemByGrams(item, newGrams) : item))
    );
  };

  const handleRemoveAiItem = (id) => {
    setAiItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmAiMeal = () => {
    if (!user?.id || aiItems.length === 0) return;

    const today = getLocalDateString(new Date());
    aiItems.forEach((item) => {
      saveMeal(user.id, {
        name: item.name.trim() || 'Scanned Food Item',
        brand: 'AI Food Scanner',
        barcode: '',
        category: aiCategory,
        serving: item.portion || `${item.portionGrams}g`,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        sugar: item.sugar,
        date: today
      });
    });

    const totals = calculateMealTotals(aiItems);
    setAiSavedSuccess(true);
    showToast(
      `Saved ${aiItems.length} item${aiItems.length === 1 ? '' : 's'} (${totals.calories} kcal) to ${aiCategory}!`,
      'success'
    );
  };

  // ---------------- EXISTING BARCODE & SEARCH HANDLERS ----------------
  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore already stopped
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCameraScanner = async () => {
    setCameraError('');
    setIsCameraActive(true);

    try {
      setTimeout(async () => {
        const html5QrCode = new Html5Qrcode('barcode-reader');
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.333
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            stopCameraScanner();
            setBarcodeInput(decodedText);
            handleBarcodeSearch(decodedText);
          },
          () => {}
        );
      }, 200);
    } catch (err) {
      console.error('Camera barcode scanner error:', err);
      setCameraError('Camera access failed or permission was denied. You can enter the barcode manually.');
      setIsCameraActive(false);
    }
  };

  const handleBarcodeSearch = async (codeToSearch = barcodeInput) => {
    const code = codeToSearch.trim();
    if (!code) {
      setSearchError('Please enter a barcode number.');
      return;
    }

    setLoading(true);
    setSearchError('');
    setSelectedProduct(null);

    try {
      const product = await fetchProductByBarcode(code);
      setSelectedProduct(product);
      setServingGrams(100);
      showToast(`Found product: ${product.name}`, 'success');
    } catch (err) {
      setSearchError(err.message || 'Product lookup failed.');
      showToast('Product not found in Open Food Facts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSearch = async (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setLoading(true);
    setSearchError('');
    setSelectedProduct(null);

    try {
      const results = await searchFoodByName(queryInput);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(`No foods found matching "${queryInput}". Try another term or add manually.`);
      }
    } catch (err) {
      setSearchError(err.message || 'Failed to search foods.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearchResult = (prod) => {
    setSelectedProduct(prod);
    setServingGrams(100);
    setSearchResults([]);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleAddToDiary = () => {
    if (!selectedProduct) return;

    const multiplier = servingGrams / 100;
    const finalCalories = Math.round(selectedProduct.calories * multiplier);
    const finalProtein = parseFloat((selectedProduct.protein * multiplier).toFixed(1));
    const finalCarbs = parseFloat((selectedProduct.carbs * multiplier).toFixed(1));
    const finalFat = parseFloat((selectedProduct.fat * multiplier).toFixed(1));
    const finalFiber = parseFloat(((selectedProduct.fiber || 0) * multiplier).toFixed(1));
    const finalSugar = parseFloat(((selectedProduct.sugar || 0) * multiplier).toFixed(1));

    saveMeal(user.id, {
      name: selectedProduct.name,
      brand: selectedProduct.brand || 'Generic',
      barcode: selectedProduct.barcode || '',
      category: mealCategory,
      serving: `${servingGrams}g (${selectedProduct.servingSize || 'serving'})`,
      calories: finalCalories,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat,
      fiber: finalFiber,
      sugar: finalSugar,
      date: getLocalDateString(new Date())
    });

    showToast(`Added ${selectedProduct.name} (${finalCalories} kcal) to ${mealCategory}!`, 'success');
    setSelectedProduct(null);
    setBarcodeInput('');
    setQueryInput('');
  };

  const handleManualFoodSubmit = (e) => {
    e.preventDefault();
    if (!manualFood.name || !manualFood.calories) {
      showToast('Please provide food name and calories.', 'error');
      return;
    }

    saveMeal(user.id, {
      name: manualFood.name.trim(),
      brand: manualFood.brand.trim() || 'Manual Entry',
      barcode: '',
      category: manualFood.category,
      serving: manualFood.serving || '1 portion',
      calories: parseInt(manualFood.calories, 10) || 0,
      protein: parseFloat(manualFood.protein) || 0,
      carbs: parseFloat(manualFood.carbs) || 0,
      fat: parseFloat(manualFood.fat) || 0,
      date: getLocalDateString(new Date())
    });

    setManualModalOpen(false);
    setManualFood({
      name: '',
      brand: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      serving: '1 serving (100g)',
      category: 'Lunch'
    });
    showToast('Custom food saved to nutrition diary!', 'success');
  };

  const currentMultiplier = servingGrams / 100;
  const scaledCalories = selectedProduct ? Math.round(selectedProduct.calories * currentMultiplier) : 0;
  const scaledProtein = selectedProduct ? parseFloat((selectedProduct.protein * currentMultiplier).toFixed(1)) : 0;
  const scaledCarbs = selectedProduct ? parseFloat((selectedProduct.carbs * currentMultiplier).toFixed(1)) : 0;
  const scaledFat = selectedProduct ? parseFloat((selectedProduct.fat * currentMultiplier).toFixed(1)) : 0;
  const aiTotals = calculateMealTotals(aiItems);

  return (
    <div className="food-scanner-page">
      {/* Scanner Header Banner */}
      <div className="scanner-hero-card">
        <div className="scanner-hero-content">
          <div className="scanner-tag">
            <ScanBarcode size={16} className="text-cyan-400" />
            <span>AI VISION &amp; NUTRITION DATABASE</span>
          </div>
          <h2 className="scanner-title">Food &amp; Barcode Scanner</h2>
          <p className="scanner-desc">
            Snap a photo of your meal for instant Gemini AI nutrition estimates, scan product barcodes, or search Open Food Facts.
          </p>
        </div>

        <button
          onClick={() => setManualModalOpen(true)}
          className="btn btn-secondary btn-sm"
        >
          <Plus size={16} />
          <span>Manual Food Entry</span>
        </button>
      </div>

      {/* NEW: AI Food Photo Scanner */}
      <section className="ai-scanner-card">
        <div className="ai-scanner-header">
          <div>
            <div className="ai-scanner-badge">
              <Sparkles size={13} />
              <span>Gemini Vision AI</span>
            </div>
            <h3 className="ai-scanner-title">Scan Meal from Photo</h3>
            <p className="ai-scanner-subtitle">
              Take a picture or upload a meal photo to identify food items, portion sizes, calories, macros, fibre, and sugar.
            </p>
          </div>
        </div>

        {!geminiReady && (
          <div className="ai-key-warning">
            <ShieldAlert size={18} />
            <div>
              <strong>Gemini API Key Not Configured:</strong> Set <code>VITE_GEMINI_API_KEY</code> in your{' '}
              <code>.env</code> file to enable AI food recognition.
            </div>
          </div>
        )}

        {/* Primary Photo Capture & Gallery Buttons */}
        <div className="ai-scanner-actions">
          {!aiCameraOpen ? (
            <button
              type="button"
              onClick={handleOpenAiCamera}
              className="btn btn-primary"
              disabled={aiAnalyzing}
            >
              <Camera size={17} />
              <span>Take Food Picture</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopAiCamera}
              className="btn btn-danger"
            >
              <CameraOff size={17} />
              <span>Close Camera</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="btn btn-secondary"
            disabled={aiAnalyzing}
          >
            <ImageIcon size={17} />
            <span>Choose from Gallery</span>
          </button>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelect}
            style={{ display: 'none' }}
          />

          {capturedPhotoUrl && (
            <button
              type="button"
              onClick={handleRetakeOrClear}
              className="btn btn-outline"
              disabled={aiAnalyzing}
            >
              <RotateCcw size={16} />
              <span>Clear Photo</span>
            </button>
          )}
        </div>

        {aiCameraError && (
          <div className="camera-error-msg">
            <AlertCircle size={15} />
            <span>{aiCameraError}</span>
          </div>
        )}

        {/* Live Camera Viewfinder */}
        {aiCameraOpen && (
          <div className="ai-camera-box">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="ai-camera-video"
            />
            <div className="ai-camera-controls">
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="btn btn-primary btn-lg"
              >
                <Camera size={18} />
                <span>Capture Food Photo</span>
              </button>
              <button
                type="button"
                onClick={stopAiCamera}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Captured Photo + Analysis Results */}
        {capturedPhotoUrl && (
          <div className="ai-preview-grid">
            <div className="ai-photo-panel">
              <div className="ai-photo-frame">
                <img src={capturedPhotoUrl} alt="Captured meal" className="ai-photo-img" />
              </div>
              <div className="ai-photo-btns">
                <button
                  type="button"
                  onClick={handleOpenAiCamera}
                  className="btn btn-secondary btn-sm"
                  disabled={aiAnalyzing}
                >
                  <Camera size={14} />
                  <span>Retake</span>
                </button>
                {photoPayload && (
                  <button
                    type="button"
                    onClick={() => runAiFoodAnalysis(photoPayload)}
                    className="btn btn-outline btn-sm"
                    disabled={aiAnalyzing}
                  >
                    <Sparkles size={14} />
                    <span>Re-analyze</span>
                  </button>
                )}
              </div>
            </div>

            <div className="ai-results-panel">
              {aiAnalyzing && (
                <div className="scanner-loading-box">
                  <Loader2 size={24} className="text-emerald-400" />
                  <p>Analyzing food items and estimating nutrition with Gemini Vision...</p>
                </div>
              )}

              {aiError && !aiAnalyzing && (
                <div className="scanner-error-banner">
                  <AlertCircle size={18} />
                  <span>{aiError}</span>
                </div>
              )}

              {!aiAnalyzing && aiItems.length > 0 && (
                <>
                  <div className="ai-meal-title-row">
                    <div>
                      <h4 className="method-title">{aiMealName || 'Detected Meal'}</h4>
                      <span className="text-xs text-slate-400">
                        Edit food names or gram portions below — nutrients update automatically.
                      </span>
                    </div>
                  </div>

                  {aiNotes && <div className="ai-notes-banner">{aiNotes}</div>}

                  {/* Editable Food Items */}
                  <div className="ai-items-list">
                    {aiItems.map((item) => (
                      <div key={item.id} className="ai-food-item-card">
                        <div className="ai-item-edit-row">
                          <div>
                            <label className="ai-item-field-label">Food Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={item.name}
                              onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="ai-item-field-label">Portion Description</label>
                            <input
                              type="text"
                              className="form-input"
                              value={item.portion}
                              onChange={(e) => handleItemPortionTextChange(item.id, e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="ai-item-field-label">Weight (g)</label>
                            <input
                              type="number"
                              min="1"
                              max="5000"
                              className="form-input"
                              value={item.portionGrams}
                              onChange={(e) => handleItemGramsChange(item.id, e.target.value)}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAiItem(item.id)}
                            className="btn-icon-danger"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="ai-item-macros-row">
                          <span className="ai-macro-chip cals">{item.calories} kcal</span>
                          <span className="ai-macro-chip protein">Protein: {item.protein}g</span>
                          <span className="ai-macro-chip carbs">Carbs: {item.carbs}g</span>
                          <span className="ai-macro-chip fat">Fat: {item.fat}g</span>
                          <span className="ai-macro-chip fiber">Fibre: {item.fiber}g</span>
                          <span className="ai-macro-chip sugar">Sugar: {item.sugar}g</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Meal Totals */}
                  <div className="ai-totals-grid">
                    <div className="ai-total-cell">
                      <span className="ai-total-val text-emerald-400">{aiTotals.calories}</span>
                      <span className="ai-total-label">Calories (kcal)</span>
                    </div>
                    <div className="ai-total-cell">
                      <span className="ai-total-val text-cyan-400">{aiTotals.protein}g</span>
                      <span className="ai-total-label">Protein</span>
                    </div>
                    <div className="ai-total-cell">
                      <span className="ai-total-val text-amber-400">{aiTotals.carbs}g</span>
                      <span className="ai-total-label">Carbs</span>
                    </div>
                    <div className="ai-total-cell">
                      <span className="ai-total-val text-purple-400">{aiTotals.fat}g</span>
                      <span className="ai-total-label">Fat</span>
                    </div>
                    <div className="ai-total-cell">
                      <span className="ai-total-val">{aiTotals.fiber}g</span>
                      <span className="ai-total-label">Fibre</span>
                    </div>
                    <div className="ai-total-cell">
                      <span className="ai-total-val">{aiTotals.sugar}g</span>
                      <span className="ai-total-label">Sugar</span>
                    </div>
                  </div>

                  {/* Confirm and Add to Diary */}
                  <div className="ai-confirm-bar">
                    <div className="form-group mb-0">
                      <label className="form-label">Meal Category</label>
                      <select
                        className="form-input form-select"
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snacks">Snacks</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {aiSavedSuccess && (
                        <Link to="/nutrition" className="btn btn-outline">
                          View in Diary <ChevronRight size={15} />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleConfirmAiMeal}
                        className="btn btn-primary btn-lg"
                      >
                        <CheckCircle2 size={18} />
                        <span>Confirm and Add to Diary</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Search & Scan Inputs Grid */}
      <div className="scanner-input-grid">
        {/* Method 1: Barcode Scan / Input */}
        <div className="scan-method-card">
          <div className="method-header">
            <ScanBarcode size={20} className="text-cyan-400" />
            <h3 className="method-title">Barcode Lookup</h3>
          </div>
          <p className="method-subtitle">Enter barcode numbers or activate camera scanner</p>

          <div className="barcode-input-row">
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 5449000000996"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
            />
            <button
              onClick={() => handleBarcodeSearch()}
              className="btn btn-primary"
              disabled={loading}
            >
              <Search size={16} />
              <span>Lookup</span>
            </button>
          </div>

          <div className="camera-toggle-wrap">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCameraScanner}
                className="btn btn-outline btn-block"
              >
                <Camera size={16} />
                <span>Start Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCameraScanner}
                className="btn btn-danger btn-block"
              >
                <CameraOff size={16} />
                <span>Stop Camera</span>
              </button>
            )}
          </div>

          {cameraError && (
            <div className="camera-error-msg">
              <AlertCircle size={15} />
              <span>{cameraError}</span>
            </div>
          )}

          {isCameraActive && (
            <div className="camera-viewport-card">
              <div id="barcode-reader" className="camera-reader-box"></div>
              <p className="camera-instruction">Align barcode inside the viewfinder box</p>
            </div>
          )}
        </div>

        {/* Method 2: Keyword Food Search */}
        <div className="scan-method-card">
          <div className="method-header">
            <Search size={20} className="text-emerald-400" />
            <h3 className="method-title">Search by Food Name</h3>
          </div>
          <p className="method-subtitle">Find items like oatmeal, chicken breast, Greek yogurt, or bananas</p>

          <form onSubmit={handleNameSearch} className="food-search-form">
            <div className="input-with-button">
              <input
                type="text"
                className="form-input"
                placeholder="Search food (e.g. Rolled Oats, Whey Protein)..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </form>

          <div className="quick-suggestions-row">
            <span className="text-xs text-slate-400">Quick tests:</span>
            {['Oatmeal', 'Chicken Breast', 'Greek Yogurt', 'Avocado', 'Egg'].map((item) => (
              <button
                key={item}
                type="button"
                className="suggestion-chip"
                onClick={() => {
                  setQueryInput(item);
                  searchFoodByName(item).then(setSearchResults);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="scanner-loading-box">
          <div className="spinner"></div>
          <p>Querying Open Food Facts database...</p>
        </div>
      )}

      {searchError && (
        <div className="scanner-error-banner">
          <AlertCircle size={18} />
          <span>{searchError}</span>
        </div>
      )}

      {searchResults.length > 0 && !selectedProduct && (
        <div className="search-results-section">
          <h3 className="section-title">Search Results ({searchResults.length})</h3>
          <div className="search-results-grid">
            {searchResults.map((prod, idx) => (
              <div
                key={`${prod.barcode || idx}`}
                className="food-result-card"
                onClick={() => handleSelectSearchResult(prod)}
              >
                {prod.image ? (
                  <img src={prod.image} alt={prod.name} className="result-img" />
                ) : (
                  <div className="result-img-placeholder">
                    <Apple size={28} className="text-slate-500" />
                  </div>
                )}
                <div className="result-info">
                  <h4 className="result-name">{prod.name}</h4>
                  <span className="result-brand">{prod.brand}</span>
                  <div className="result-macros">
                    <span className="macro-badge badge-cals">{prod.calories} kcal/100g</span>
                    <span className="macro-badge">P: {prod.protein}g</span>
                    <span className="macro-badge">C: {prod.carbs}g</span>
                    <span className="macro-badge">F: {prod.fat}g</span>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm result-select-btn">
                  Select <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="product-detail-card">
          <div className="product-detail-header">
            <div className="product-title-group">
              <span className="product-verified-badge">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Open Food Facts Verified</span>
              </span>
              <h3 className="product-name">{selectedProduct.name}</h3>
              <p className="product-brand">{selectedProduct.brand}</p>
              {selectedProduct.barcode && (
                <span className="product-barcode-pill">Barcode: {selectedProduct.barcode}</span>
              )}
            </div>

            {selectedProduct.nutriscore && (
              <div className={`nutri-score-pill score-${selectedProduct.nutriscore.toLowerCase()}`}>
                Nutri-Score: {selectedProduct.nutriscore}
              </div>
            )}
          </div>

          <div className="product-detail-body">
            {selectedProduct.image && (
              <div className="product-photo-wrap">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="product-photo" />
              </div>
            )}

            <div className="product-calc-col">
              <div className="serving-adjuster-card">
                <label className="form-label">Adjust Serving Portion (grams):</label>
                <div className="portion-controls">
                  {[50, 100, 150, 200, 250].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`portion-btn ${servingGrams === g ? 'portion-btn-active' : ''}`}
                      onClick={() => setServingGrams(g)}
                    >
                      {g}g
                    </button>
                  ))}
                  <div className="custom-grams-input">
                    <input
                      type="number"
                      min="1"
                      max="2000"
                      className="form-input"
                      value={servingGrams}
                      onChange={(e) => setServingGrams(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                    <span>g</span>
                  </div>
                </div>
              </div>

              <div className="calculated-macros-grid">
                <div className="macro-stat-box box-cals">
                  <span className="macro-num">{scaledCalories}</span>
                  <span className="macro-label">CALORIES (kcal)</span>
                </div>
                <div className="macro-stat-box box-protein">
                  <span className="macro-num">{scaledProtein}g</span>
                  <span className="macro-label">PROTEIN</span>
                </div>
                <div className="macro-stat-box box-carbs">
                  <span className="macro-num">{scaledCarbs}g</span>
                  <span className="macro-label">CARBS</span>
                </div>
                <div className="macro-stat-box box-fat">
                  <span className="macro-num">{scaledFat}g</span>
                  <span className="macro-label">FAT</span>
                </div>
              </div>

              <div className="add-diary-controls">
                <div className="form-group mb-0">
                  <label className="form-label">Meal Category:</label>
                  <select
                    className="form-input form-select"
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value)}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <button onClick={handleAddToDiary} className="btn btn-primary btn-lg">
                  <Plus size={18} />
                  <span>Add to Daily Nutrition Diary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Food Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Add Custom Food Item"
      >
        <form onSubmit={handleManualFoodSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Food / Dish Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Homemade Protein Smoothie"
              value={manualFood.name}
              onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Brand / Source</label>
              <input
                type="text"
                className="form-input"
                placeholder="Homemade or Brand"
                value={manualFood.brand}
                onChange={(e) => setManualFood({ ...manualFood, brand: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Meal Category</label>
              <select
                className="form-input form-select"
                value={manualFood.category}
                onChange={(e) => setManualFood({ ...manualFood, category: e.target.value })}
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Serving Size</label>
              <input
                type="text"
                className="form-input"
                placeholder="1 bowl, 200g, etc."
                value={manualFood.serving}
                onChange={(e) => setManualFood({ ...manualFood, serving: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Calories (kcal) *</label>
              <input
                type="number"
                min="0"
                max="5000"
                className="form-input"
                placeholder="350"
                value={manualFood.calories}
                onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-three">
            <div className="form-group">
              <label className="form-label">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="25"
                value={manualFood.protein}
                onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="40"
                value={manualFood.carbs}
                onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="10"
                value={manualFood.fat}
                onChange={(e) => setManualFood({ ...manualFood, fat: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Add to Diary</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
