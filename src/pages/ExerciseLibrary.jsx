import React, { useState, useMemo } from 'react';
import { Search, Filter, Dumbbell, Zap, Heart, Shield, ChevronDown, ChevronUp, Star } from 'lucide-react';

const EXERCISES = [
  // Chest
  { id: 'e1', name: 'Push-Up', muscle: 'Chest', level: 'Beginner', equipment: 'Bodyweight', category: 'Chest', sets: '3', reps: '12-15', rest: '60s', instructions: 'Start in a plank position with hands slightly wider than shoulder-width. Lower your chest to the floor by bending elbows, then push back up. Keep core tight throughout.' },
  { id: 'e2', name: 'Barbell Bench Press', muscle: 'Chest, Triceps', level: 'Intermediate', equipment: 'Barbell', category: 'Chest', sets: '4', reps: '8-10', rest: '90s', instructions: 'Lie flat on bench, grip bar slightly wider than shoulders. Lower bar to lower chest with control, then press up explosively. Keep feet flat on the floor.' },
  { id: 'e3', name: 'Dumbbell Flyes', muscle: 'Chest', level: 'Intermediate', equipment: 'Dumbbells', category: 'Chest', sets: '3', reps: '12', rest: '60s', instructions: 'Lie on bench with dumbbells above chest, arms slightly bent. Open arms wide in a wide arc until chest stretches, then squeeze back together.' },
  { id: 'e4', name: 'Cable Crossover', muscle: 'Chest', level: 'Advanced', equipment: 'Cable Machine', category: 'Chest', sets: '3', reps: '15', rest: '60s', instructions: 'Stand between two high cable pulleys. Grab handles, lean slightly forward, and bring hands together in front of chest in a hugging motion.' },
  // Back
  { id: 'e5', name: 'Pull-Up', muscle: 'Back, Biceps', level: 'Intermediate', equipment: 'Pull-Up Bar', category: 'Back', sets: '3', reps: '6-10', rest: '90s', instructions: 'Grip bar wider than shoulder-width, palms facing away. Pull body up until chin clears the bar, then lower slowly under control.' },
  { id: 'e6', name: 'Bent-Over Barbell Row', muscle: 'Back, Biceps', level: 'Intermediate', equipment: 'Barbell', category: 'Back', sets: '4', reps: '10', rest: '90s', instructions: 'Hinge at hips to roughly 45°, grip bar shoulder-width. Pull bar to lower ribcage, squeezing shoulder blades together, then lower with control.' },
  { id: 'e7', name: 'Lat Pulldown', muscle: 'Lats, Back', level: 'Beginner', equipment: 'Cable Machine', category: 'Back', sets: '3', reps: '12', rest: '60s', instructions: 'Sit at cable machine, grip bar wider than shoulders. Pull bar down to upper chest, squeezing lats. Slowly return to start.' },
  { id: 'e8', name: 'Deadlift', muscle: 'Back, Glutes, Hamstrings', level: 'Advanced', equipment: 'Barbell', category: 'Back', sets: '4', reps: '5', rest: '120s', instructions: 'Stand with bar over mid-foot, hinge at hips to grip bar. Drive through heels, keep back flat, and stand tall. Lower with control.' },
  // Legs
  { id: 'e9', name: 'Bodyweight Squat', muscle: 'Quads, Glutes', level: 'Beginner', equipment: 'Bodyweight', category: 'Legs', sets: '3', reps: '15-20', rest: '60s', instructions: 'Stand feet shoulder-width apart, toes slightly out. Sit back and down as if on a chair, keeping chest up. Push through heels to stand.' },
  { id: 'e10', name: 'Barbell Back Squat', muscle: 'Quads, Glutes, Hamstrings', level: 'Advanced', equipment: 'Barbell', category: 'Legs', sets: '4', reps: '8', rest: '120s', instructions: 'Place bar on upper traps, feet shoulder-width. Squat down until thighs are parallel to floor or below, maintaining an upright torso. Drive up through heels.' },
  { id: 'e11', name: 'Walking Lunges', muscle: 'Quads, Glutes', level: 'Beginner', equipment: 'Bodyweight/Dumbbells', category: 'Legs', sets: '3', reps: '12 each leg', rest: '60s', instructions: 'Step forward with one leg, lowering back knee toward the floor. Push through front heel to step forward with the other leg. Alternate continuously.' },
  { id: 'e12', name: 'Romanian Deadlift', muscle: 'Hamstrings, Glutes', level: 'Intermediate', equipment: 'Barbell/Dumbbells', category: 'Legs', sets: '3', reps: '10', rest: '90s', instructions: 'Hold weight at thighs, hinge at hips keeping back flat and slight knee bend. Lower until hamstrings stretch, then squeeze glutes to stand.' },
  // Arms
  { id: 'e13', name: 'Dumbbell Bicep Curl', muscle: 'Biceps', level: 'Beginner', equipment: 'Dumbbells', category: 'Arms', sets: '3', reps: '12', rest: '60s', instructions: 'Hold dumbbells at sides, palms forward. Curl both weights toward shoulders by bending elbows. Squeeze at top, then lower slowly.' },
  { id: 'e14', name: 'Tricep Dips', muscle: 'Triceps', level: 'Beginner', equipment: 'Parallel Bars / Chair', category: 'Arms', sets: '3', reps: '10-15', rest: '60s', instructions: 'Support yourself on bars or chair edge. Lower body by bending elbows to 90°, then push back up. Keep torso upright to target triceps.' },
  { id: 'e15', name: 'Hammer Curl', muscle: 'Biceps, Forearms', level: 'Beginner', equipment: 'Dumbbells', category: 'Arms', sets: '3', reps: '12', rest: '60s', instructions: 'Hold dumbbells with neutral grip (thumbs up). Curl toward shoulders without rotating wrists. Great for forearm and brachialis development.' },
  { id: 'e16', name: 'Skull Crushers', muscle: 'Triceps', level: 'Intermediate', equipment: 'Barbell/EZ Bar', category: 'Arms', sets: '3', reps: '10', rest: '75s', instructions: 'Lie on bench with bar above chest. Keeping upper arms vertical, lower bar toward forehead by bending elbows. Extend back to start.' },
  // Core
  { id: 'e17', name: 'Plank', muscle: 'Core, Shoulders', level: 'Beginner', equipment: 'Bodyweight', category: 'Core', sets: '3', reps: '30-60s', rest: '60s', instructions: 'Support on forearms and toes with body in a straight line. Keep hips level, engage abs, breathe steadily. Do not let hips sag.' },
  { id: 'e18', name: 'Crunch', muscle: 'Abs', level: 'Beginner', equipment: 'Bodyweight', category: 'Core', sets: '3', reps: '20', rest: '45s', instructions: 'Lie on back with knees bent. Place hands behind head (do not pull). Curl shoulders off floor using abs, hold briefly, then lower.' },
  { id: 'e19', name: 'Leg Raise', muscle: 'Lower Abs', level: 'Intermediate', equipment: 'Bodyweight', category: 'Core', sets: '3', reps: '12-15', rest: '60s', instructions: 'Lie flat, hands under lower back for support. Keeping legs straight, raise them to 90°, then lower slowly without touching the floor.' },
  { id: 'e20', name: 'Russian Twist', muscle: 'Obliques, Core', level: 'Intermediate', equipment: 'Bodyweight/Weight Plate', category: 'Core', sets: '3', reps: '20 total', rest: '60s', instructions: 'Sit at 45°, feet off ground. Rotate torso side to side touching hands (or weight) to the floor on each side. Keep lower back neutral.' },
  // Cardio
  { id: 'e21', name: 'Burpees', muscle: 'Full Body', level: 'Intermediate', equipment: 'Bodyweight', category: 'Cardio', sets: '4', reps: '10', rest: '45s', instructions: 'From standing, drop hands to floor and jump feet back to plank, do a push-up, jump feet to hands, then jump up with arms overhead.' },
  { id: 'e22', name: 'Mountain Climbers', muscle: 'Core, Cardio', level: 'Beginner', equipment: 'Bodyweight', category: 'Cardio', sets: '3', reps: '30s', rest: '30s', instructions: 'Start in high plank. Drive alternating knees toward chest as fast as possible while keeping hips level and core braced.' },
  { id: 'e23', name: 'Jump Rope', muscle: 'Calves, Cardio', level: 'Beginner', equipment: 'Jump Rope', category: 'Cardio', sets: '3', reps: '60s', rest: '30s', instructions: 'Jump both feet together as rope passes. Keep elbows close to body, turning rope with wrists. Land softly on balls of feet.' },
  { id: 'e24', name: 'Box Jumps', muscle: 'Legs, Cardio', level: 'Intermediate', equipment: 'Plyo Box', category: 'Cardio', sets: '4', reps: '8', rest: '60s', instructions: 'Stand in front of box, feet shoulder-width. Swing arms back and jump explosively, landing softly with both feet on the box. Step down carefully.' },
  // Shoulders
  { id: 'e25', name: 'Overhead Dumbbell Press', muscle: 'Shoulders, Triceps', level: 'Beginner', equipment: 'Dumbbells', category: 'Shoulders', sets: '3', reps: '12', rest: '75s', instructions: 'Sit or stand with dumbbells at shoulder height, palms forward. Press weights overhead until arms are fully extended. Lower with control.' },
  { id: 'e26', name: 'Lateral Raises', muscle: 'Side Deltoids', level: 'Beginner', equipment: 'Dumbbells', category: 'Shoulders', sets: '3', reps: '15', rest: '60s', instructions: 'Hold light dumbbells at sides. Raise arms out laterally to shoulder height with a slight bend in elbows. Lower slowly. Avoid shrugging.' },
  { id: 'e27', name: 'Face Pulls', muscle: 'Rear Deltoids, Rotator Cuff', level: 'Intermediate', equipment: 'Cable Machine', category: 'Shoulders', sets: '3', reps: '15', rest: '60s', instructions: 'Set cable at face height with rope attachment. Pull rope toward your face, spreading handles apart and squeezing rear delts. Control the return.' },
  { id: 'e28', name: 'Arnold Press', muscle: 'Shoulders', level: 'Intermediate', equipment: 'Dumbbells', category: 'Shoulders', sets: '3', reps: '10', rest: '75s', instructions: 'Start with dumbbells in front at chin height, palms facing you. As you press up, rotate palms to face forward. Reverse on the way down.' },
];

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio', 'Shoulders'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const LEVEL_COLORS = { Beginner: '#36C99A', Intermediate: '#F3A64A', Advanced: '#ef4444' };
const LEVEL_BADGE_BG = { Beginner: 'rgba(54,201,154,0.12)', Intermediate: 'rgba(243,166,74,0.12)', Advanced: 'rgba(239,68,68,0.12)' };

function ExerciseCard({ ex }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ex-card" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
      <div className="ex-card-top">
        <div className="ex-card-left">
          <div className="ex-icon" style={{ background: LEVEL_BADGE_BG[ex.level], color: LEVEL_COLORS[ex.level] }}>
            <Dumbbell size={18} />
          </div>
          <div>
            <h4 className="ex-name">{ex.name}</h4>
            <span className="ex-muscle">{ex.muscle}</span>
          </div>
        </div>
        <div className="ex-card-right">
          <span className="ex-level-badge" style={{ background: LEVEL_BADGE_BG[ex.level], color: LEVEL_COLORS[ex.level] }}>
            {ex.level}
          </span>
          <span className="ex-equip-badge">{ex.equipment}</span>
          {open ? <ChevronUp size={16} style={{ color: '#6B7F97' }} /> : <ChevronDown size={16} style={{ color: '#6B7F97' }} />}
        </div>
      </div>

      {open && (
        <div className="ex-card-detail" onClick={(e) => e.stopPropagation()}>
          <div className="ex-detail-stats">
            <div className="ex-stat"><span className="ex-stat-val">{ex.sets}</span><span className="ex-stat-lbl">Sets</span></div>
            <div className="ex-stat"><span className="ex-stat-val">{ex.reps}</span><span className="ex-stat-lbl">Reps</span></div>
            <div className="ex-stat"><span className="ex-stat-val">{ex.rest}</span><span className="ex-stat-lbl">Rest</span></div>
          </div>
          <p className="ex-instructions">{ex.instructions}</p>
        </div>
      )}
    </div>
  );
}

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchSearch = search === '' ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscle.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || ex.category === category;
      const matchLvl = level === 'All' || ex.level === level;
      return matchSearch && matchCat && matchLvl;
    });
  }, [search, category, level]);

  return (
    <div className="ex-page">
      <div className="ex-header">
        <div>
          <h1 className="ex-page-title">Exercise Library</h1>
          <p className="ex-page-sub">{EXERCISES.length} exercises across 7 muscle groups</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ex-filter-row">
        <div className="ex-search-wrap">
          <Search size={16} style={{ color: '#6B7F97' }} />
          <input
            className="ex-search-input"
            placeholder="Search exercises or muscle groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ex-filter-pills">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`ex-pill ${category === c ? 'ex-pill-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ex-filter-pills">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`ex-pill ${level === l ? 'ex-pill-active' : ''}`}
              onClick={() => setLevel(l)}
              style={level === l && l !== 'All' ? { background: LEVEL_BADGE_BG[l], color: LEVEL_COLORS[l], borderColor: LEVEL_COLORS[l] } : {}}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="ex-result-count">
        Showing <strong style={{ color: '#B7F34A' }}>{filtered.length}</strong> exercises
        {category !== 'All' ? ` in ${category}` : ''}
        {level !== 'All' ? ` · ${level}` : ''}
      </p>

      {/* Exercise Cards */}
      {filtered.length === 0 ? (
        <div className="ex-empty">
          <Dumbbell size={48} style={{ color: '#233150', marginBottom: 12 }} />
          <p style={{ color: '#6B7F97' }}>No exercises match your filters.</p>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory('All'); setLevel('All'); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="ex-grid">
          {filtered.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
        </div>
      )}
    </div>
  );
}
