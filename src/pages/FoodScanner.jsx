import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanBarcode,
  Search,
  Camera,
  CameraOff,
  Plus,
  Utensils,
  AlertCircle,
  CheckCircle2,
  Apple,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchProductByBarcode,
  searchFoodByName,
  COMMON_FOOD_SUGGESTIONS
} from '../services/foodService';
import { saveMeal } from '../services/storageService';
import { getLocalDateString } from '../utils/calculations';
import Modal from '../components/common/Modal';

export default function FoodScanner() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Search inputs
  const [barcodeInput, setBarcodeInput] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Selected product & Search results
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Portion / Serving calculator
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

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
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
      // Small timeout to allow DOM container to render
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
            // Found a barcode
            stopCameraScanner();
            setBarcodeInput(decodedText);
            handleBarcodeSearch(decodedText);
          },
          (error) => {
            // Scanning in progress, ignore frame-level misses
          }
        );
      }, 200);
    } catch (err) {
      console.error('Camera barcode scanner error:', err);
      setCameraError('Camera access failed or permission was denied. You can enter the barcode manually.');
      setIsCameraActive(false);
    }
  };

  // Perform barcode search via Open Food Facts API
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

  // Perform keyword search
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

  // Add selected product to user's daily diary
  const handleAddToDiary = () => {
    if (!selectedProduct) return;

    const multiplier = servingGrams / 100;
    const finalCalories = Math.round(selectedProduct.calories * multiplier);
    const finalProtein = parseFloat((selectedProduct.protein * multiplier).toFixed(1));
    const finalCarbs = parseFloat((selectedProduct.carbs * multiplier).toFixed(1));
    const finalFat = parseFloat((selectedProduct.fat * multiplier).toFixed(1));

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
      date: getLocalDateString(new Date())
    });

    showToast(`Added ${selectedProduct.name} (${finalCalories} kcal) to ${mealCategory}!`, 'success');
    // Optional redirect or stay
    setSelectedProduct(null);
    setBarcodeInput('');
    setQueryInput('');
  };

  // Manual food submit
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

  // Calculate scaled nutrients for selected product
  const currentMultiplier = servingGrams / 100;
  const scaledCalories = selectedProduct ? Math.round(selectedProduct.calories * currentMultiplier) : 0;
  const scaledProtein = selectedProduct ? parseFloat((selectedProduct.protein * currentMultiplier).toFixed(1)) : 0;
  const scaledCarbs = selectedProduct ? parseFloat((selectedProduct.carbs * currentMultiplier).toFixed(1)) : 0;
  const scaledFat = selectedProduct ? parseFloat((selectedProduct.fat * currentMultiplier).toFixed(1)) : 0;

  return (
    <div className="food-scanner-page">
      {/* Scanner Header Banner */}
      <div className="scanner-hero-card">
        <div className="scanner-hero-content">
          <div className="scanner-tag">
            <ScanBarcode size={16} className="text-cyan-400" />
            <span>GLOBAL NUTRITION DATABASE</span>
          </div>
          <h2 className="scanner-title">Food & Barcode Scanner</h2>
          <p className="scanner-desc">
            Instantly query calories and macronutrients from the official Open Food Facts database or scan barcodes using your camera.
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

          {/* Camera Viewport */}
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

          {/* Quick suggestions */}
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

      {/* Loading state */}
      {loading && (
        <div className="scanner-loading-box">
          <div className="spinner"></div>
          <p>Querying Open Food Facts database...</p>
        </div>
      )}

      {/* Search Error Alert */}
      {searchError && (
        <div className="scanner-error-banner">
          <AlertCircle size={18} />
          <span>{searchError}</span>
        </div>
      )}

      {/* Keyword Search Results List */}
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

      {/* Selected Product Nutritional Inspector Card */}
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
              {/* Serving size adjuster */}
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

              {/* Calculated Macro Breakdown */}
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

              {/* Meal Category & Add to Diary Action */}
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
