import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ScanBarcode,
  Target,
  Flame,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getMeals,
  saveMeal,
  updateMeal,
  deleteMeal,
  updateUserProfile
} from '../services/storageService';
import { getLocalDateString, formatFriendlyDate } from '../utils/calculations';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function NutritionDiary() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [meals, setMeals] = useState([]);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [mealForm, setMealForm] = useState({
    name: '',
    brand: '',
    category: 'Breakfast',
    serving: '1 serving (100g)',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  // Calorie Goal Edit Modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [calorieTargetInput, setCalorieTargetInput] = useState(user?.dailyCalorieTarget || 2200);

  // Load user meals
  const loadMeals = () => {
    if (user?.id) {
      setMeals(getMeals(user.id));
    }
  };

  useEffect(() => {
    loadMeals();
  }, [user]);

  // Date Navigation
  const changeDateByDays = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateString(current));
  };

  // Filter meals for the selected date
  const dateMeals = meals.filter((m) => m.date === selectedDate);

  // Daily Totals
  const totalCalories = dateMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalProtein = dateMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
  const totalCarbs = dateMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
  const totalFat = dateMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

  const calorieTarget = user?.dailyCalorieTarget || 2200;
  const remainingCalories = calorieTarget - totalCalories;
  const progressPercent = Math.min(100, Math.round((totalCalories / calorieTarget) * 100));

  // Open modal for new entry
  const handleOpenAdd = (category = 'Breakfast') => {
    setEditingMealId(null);
    setMealForm({
      name: '',
      brand: '',
      category,
      serving: '1 serving (100g)',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    });
    setModalOpen(true);
  };

  // Open modal for editing existing entry
  const handleOpenEdit = (meal) => {
    setEditingMealId(meal.id);
    setMealForm({
      name: meal.name,
      brand: meal.brand || '',
      category: meal.category || 'Breakfast',
      serving: meal.serving || '',
      calories: meal.calories || '',
      protein: meal.protein || '',
      carbs: meal.carbs || '',
      fat: meal.fat || ''
    });
    setModalOpen(true);
  };

  // Save or Update Meal
  const handleSaveMeal = (e) => {
    e.preventDefault();
    if (!mealForm.name.trim() || !mealForm.calories) {
      showToast('Please enter both the food item name and calories.', 'error');
      return;
    }

    const payload = {
      name: mealForm.name.trim(),
      brand: mealForm.brand.trim() || 'Manual Entry',
      category: mealForm.category,
      serving: mealForm.serving || '1 portion',
      calories: parseInt(mealForm.calories, 10) || 0,
      protein: parseFloat(mealForm.protein) || 0,
      carbs: parseFloat(mealForm.carbs) || 0,
      fat: parseFloat(mealForm.fat) || 0,
      date: selectedDate
    };

    if (editingMealId) {
      updateMeal(user.id, editingMealId, payload);
      showToast('Food entry updated successfully!', 'success');
    } else {
      saveMeal(user.id, payload);
      showToast(`Added ${payload.name} to ${payload.category}!`, 'success');
    }

    loadMeals();
    setModalOpen(false);
  };

  // Delete Meal
  const handleDeleteMeal = (id) => {
    if (window.confirm('Delete this food entry from your diary?')) {
      deleteMeal(user.id, id);
      loadMeals();
      showToast('Food entry removed.', 'info');
    }
  };

  // Update Daily Calorie Target
  const handleSaveCalorieTarget = (e) => {
    e.preventDefault();
    const newTarget = parseInt(calorieTargetInput, 10);
    if (!newTarget || newTarget < 500 || newTarget > 10000) {
      showToast('Please enter a sensible daily target between 500 and 10,000 kcal.', 'error');
      return;
    }

    updateProfile({ dailyCalorieTarget: newTarget });
    setGoalModalOpen(false);
    showToast(`Daily calorie target updated to ${newTarget} kcal!`, 'success');
  };

  return (
    <div className="nutrition-diary-page">
      {/* Date Navigation & Actions Header */}
      <div className="diary-header-card">
        <div className="date-nav-controls">
          <button
            onClick={() => changeDateByDays(-1)}
            className="btn btn-secondary btn-icon"
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="date-display-badge">
            <Calendar size={18} className="text-emerald-400" />
            <span className="date-main-text">{formatFriendlyDate(selectedDate)}</span>
            <input
              type="date"
              className="hidden-date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Pick specific date"
            />
          </div>

          <button
            onClick={() => changeDateByDays(1)}
            className="btn btn-secondary btn-icon"
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          {selectedDate !== getLocalDateString(new Date()) && (
            <button
              onClick={() => setSelectedDate(getLocalDateString(new Date()))}
              className="btn btn-outline btn-sm"
            >
              Jump to Today
            </button>
          )}
        </div>

        <div className="diary-header-actions">
          <Link to="/scanner" className="btn btn-outline">
            <ScanBarcode size={16} />
            <span>Open Barcode Scanner</span>
          </Link>
          <button
            onClick={() => handleOpenAdd('Breakfast')}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Quick Food Entry</span>
          </button>
        </div>
      </div>

      {/* Daily Caloric & Macro Overview Card */}
      <div className="daily-macro-overview-card">
        <div className="overview-top-row">
          <div className="overview-title-wrap">
            <h3 className="overview-title">Daily Nutrition & Macronutrient Budget</h3>
            <span className="overview-date">{selectedDate}</span>
          </div>

          <button
            onClick={() => {
              setCalorieTargetInput(calorieTarget);
              setGoalModalOpen(true);
            }}
            className="btn btn-secondary btn-sm"
            title="Configure Daily Calorie Goal"
          >
            <Target size={15} />
            <span>Edit Target ({calorieTarget} kcal)</span>
          </button>
        </div>

        {/* Big Numbers Grid */}
        <div className="calorie-budget-grid">
          <div className="budget-box">
            <span className="budget-label">CONSUMED</span>
            <span className="budget-val text-emerald-400">{totalCalories}</span>
            <span className="budget-unit">kcal</span>
          </div>

          <div className="budget-box">
            <span className="budget-label">DAILY TARGET</span>
            <span className="budget-val">{calorieTarget}</span>
            <span className="budget-unit">kcal</span>
          </div>

          <div className="budget-box">
            <span className="budget-label">
              {remainingCalories >= 0 ? 'REMAINING' : 'OVER BUDGET'}
            </span>
            <span
              className={`budget-val ${
                remainingCalories >= 0 ? 'text-slate-200' : 'text-amber-400'
              }`}
            >
              {Math.abs(remainingCalories)}
            </span>
            <span className="budget-unit">kcal</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="macro-progress-bar-wrap">
          <div className="progress-track">
            <div
              className={`progress-fill ${
                remainingCalories < 0 ? 'fill-amber' : 'fill-emerald'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Macronutrient Pills */}
        <div className="macro-breakdown-row">
          <div className="macro-pill pill-protein">
            <span className="macro-pill-title">Protein</span>
            <span className="macro-pill-amount">{totalProtein.toFixed(1)}g</span>
            <span className="macro-pill-cals">
              {Math.round(totalProtein * 4)} kcal ({totalCalories > 0 ? Math.round(((totalProtein * 4) / totalCalories) * 100) : 0}%)
            </span>
          </div>

          <div className="macro-pill pill-carbs">
            <span className="macro-pill-title">Carbohydrates</span>
            <span className="macro-pill-amount">{totalCarbs.toFixed(1)}g</span>
            <span className="macro-pill-cals">
              {Math.round(totalCarbs * 4)} kcal ({totalCalories > 0 ? Math.round(((totalCarbs * 4) / totalCalories) * 100) : 0}%)
            </span>
          </div>

          <div className="macro-pill pill-fat">
            <span className="macro-pill-title">Healthy Fats</span>
            <span className="macro-pill-amount">{totalFat.toFixed(1)}g</span>
            <span className="macro-pill-cals">
              {Math.round(totalFat * 9)} kcal ({totalCalories > 0 ? Math.round(((totalFat * 9) / totalCalories) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Meals Grouped by Category */}
      <div className="meal-categories-stack">
        {CATEGORIES.map((category) => {
          const categoryMeals = dateMeals.filter((m) => m.category === category);
          const categoryCals = categoryMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);

          return (
            <div key={category} className="meal-category-block">
              <div className="category-block-header">
                <div className="category-title-wrap">
                  <h4 className="category-name">{category}</h4>
                  <span className="category-calories-badge">{categoryCals} kcal</span>
                </div>
                <button
                  onClick={() => handleOpenAdd(category)}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add {category}</span>
                </button>
              </div>

              {categoryMeals.length === 0 ? (
                <div className="category-empty-row">
                  <span>No food logged for {category}.</span>
                  <button
                    onClick={() => handleOpenAdd(category)}
                    className="category-empty-add-btn"
                  >
                    + Log food item
                  </button>
                </div>
              ) : (
                <div className="category-meals-list">
                  {categoryMeals.map((meal) => (
                    <div key={meal.id} className="meal-entry-item">
                      <div className="meal-entry-main">
                        <span className="meal-food-name">{meal.name}</span>
                        <span className="meal-food-meta">
                          {meal.brand && `${meal.brand} • `}{meal.serving}
                        </span>
                        <div className="meal-entry-macros">
                          <span>P: {meal.protein || 0}g</span>
                          <span>•</span>
                          <span>C: {meal.carbs || 0}g</span>
                          <span>•</span>
                          <span>F: {meal.fat || 0}g</span>
                        </div>
                      </div>

                      <div className="meal-entry-right">
                        <span className="meal-entry-calories">{meal.calories} kcal</span>
                        <div className="meal-action-buttons">
                          <button
                            onClick={() => handleOpenEdit(meal)}
                            className="btn-icon-subtle"
                            title="Edit entry"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="btn-icon-danger"
                            title="Delete entry"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Meal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMealId ? 'Edit Food Entry' : `Add Food to ${mealForm.category}`}
      >
        <form onSubmit={handleSaveMeal} className="modal-form">
          <div className="form-group">
            <label className="form-label">Food / Meal Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Scrambled Eggs with Avocado"
              value={mealForm.name}
              onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Meal Category</label>
              <select
                className="form-input form-select"
                value={mealForm.category}
                onChange={(e) => setMealForm({ ...mealForm, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brand / Provider</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Quaker, Homemade"
                value={mealForm.brand}
                onChange={(e) => setMealForm({ ...mealForm, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Serving Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1 bowl (150g)"
                value={mealForm.serving}
                onChange={(e) => setMealForm({ ...mealForm, serving: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Calories (kcal) *</label>
              <input
                type="number"
                min="0"
                max="5000"
                className="form-input"
                placeholder="e.g. 380"
                value={mealForm.calories}
                onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
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
                placeholder="20"
                value={mealForm.protein}
                onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="35"
                value={mealForm.carbs}
                onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder="8"
                value={mealForm.fat}
                onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} />
              <span>{editingMealId ? 'Update Entry' : 'Save Food Entry'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Calorie Goal Modal */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Set Daily Calorie Target"
      >
        <form onSubmit={handleSaveCalorieTarget} className="modal-form">
          <p className="text-sm text-slate-300 mb-3">
            FitTrack uses your daily calorie budget to calculate intake remaining and progress bars on your dashboard.
          </p>

          <div className="form-group">
            <label className="form-label">Daily Target (kcal) *</label>
            <input
              type="number"
              min="800"
              max="6000"
              step="50"
              className="form-input"
              value={calorieTargetInput}
              onChange={(e) => setCalorieTargetInput(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setGoalModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <span>Save Calorie Target</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
