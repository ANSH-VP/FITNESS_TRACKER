/**
 * Centralized Storage Service for FitTrack
 * Uses LocalStorage for persistence and SessionStorage for session lifecycle.
 * Strictly maintains user-specific data isolation per user ID.
 */

const USERS_KEY = 'fittrack_users';
const SESSION_KEY = 'fittrack_active_session';

// Safe JSON parser
function safeParse(jsonString, defaultValue = null) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('Error parsing JSON from storage:', err);
    return defaultValue;
  }
}

// Safe JSON serializer
function safeStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (err) {
    console.error('Error stringifying data for storage:', err);
    return null;
  }
}

/**
 * Initialize default demo user and admin accounts with realistic seed data if not present
 */
export function initStorage() {
  const users = safeParse(localStorage.getItem(USERS_KEY), []);
  let needsSave = false;

  // 1. Verify Demo Admin Account
  const adminExists = users.some((u) => u.email.toLowerCase() === 'admin@fittrack.app');
  if (!adminExists) {
    users.push({
      id: 'admin-system-id',
      name: 'FitTrack Administrator',
      email: 'admin@fittrack.app',
      password: 'Admin12345',
      role: 'admin',
      registeredAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      age: 28,
      gender: 'Other',
      height: 175,
      weight: 70,
      fitnessLevel: 'Highly Active',
      fitnessGoal: 'Maintain Fitness'
    });
    needsSave = true;
  }

  // 2. Verify Demo Regular User Account
  const demoUserExists = users.some((u) => u.email.toLowerCase() === 'demo@fittrack.app');
  if (!demoUserExists) {
    const demoUserId = 'demo-user-1';
    users.push({
      id: demoUserId,
      name: 'Alex Johnson',
      email: 'demo@fittrack.app',
      password: 'Fittrack123',
      role: 'user',
      registeredAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      age: 22,
      gender: 'Male',
      height: 178,
      weight: 72,
      fitnessLevel: 'Moderate',
      fitnessGoal: 'Improve Running',
      dailyCalorieTarget: 2200
    });
    needsSave = true;

    // Seed realistic activity data for demo user
    seedDemoUserData(demoUserId);
  }

  if (needsSave) {
    localStorage.setItem(USERS_KEY, safeStringify(users));
  }
}

/**
 * Seeds rich, realistic demonstration data for the demo user
 */
function seedDemoUserData(userId) {
  const now = new Date();
  const formatOffsetDate = (daysAgo) => {
    const d = new Date(now.getTime() - daysAgo * 86400000);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  };

  // 1. Running Activities
  const runsKey = `fittrack_runs_${userId}`;
  if (!localStorage.getItem(runsKey)) {
    const sampleRuns = [
      {
        id: 'run-seed-1',
        userId,
        date: formatOffsetDate(0),
        time: '07:15 AM',
        title: 'Morning University Park Loop',
        distance: 5.2, // km
        duration: 1680, // 28 mins
        pace: '5:23 /km',
        calories: 385,
        type: 'Outdoor GPS Run',
        notes: 'Felt energetic and steady cadence throughout.',
        route: [
          [37.7749, -122.4194],
          [37.7762, -122.4182],
          [37.7781, -122.4165],
          [37.7798, -122.4149],
          [37.7812, -122.4132],
          [37.7801, -122.4115],
          [37.7783, -122.4131],
          [37.7761, -122.4158],
          [37.7749, -122.4194]
        ]
      },
      {
        id: 'run-seed-2',
        userId,
        date: formatOffsetDate(2),
        time: '06:45 PM',
        title: 'Sunset Campus Boulevard Run',
        distance: 6.4,
        duration: 2112,
        pace: '5:30 /km',
        calories: 475,
        type: 'Outdoor GPS Run',
        notes: 'Good pacing, slight headwind on the return stretch.',
        route: [
          [37.7749, -122.4194],
          [37.7731, -122.4215],
          [37.7712, -122.4241],
          [37.7695, -122.427],
          [37.7715, -122.425],
          [37.7735, -122.422],
          [37.7749, -122.4194]
        ]
      },
      {
        id: 'run-seed-3',
        userId,
        date: formatOffsetDate(4),
        time: '08:00 AM',
        title: 'Interval Sprint Session',
        distance: 4.1,
        duration: 1260,
        pace: '5:07 /km',
        calories: 310,
        type: 'Outdoor GPS Run',
        notes: '8x200m interval sprints with 1-min active recovery.',
        route: [
          [37.7749, -122.4194],
          [37.777, -122.418],
          [37.779, -122.417],
          [37.7749, -122.4194]
        ]
      },
      {
        id: 'run-seed-4',
        userId,
        date: formatOffsetDate(6),
        time: '07:30 AM',
        title: 'Weekend Endurance Long Run',
        distance: 8.5,
        duration: 2890,
        pace: '5:40 /km',
        calories: 630,
        type: 'Outdoor GPS Run',
        notes: 'Hydrated well; great cardiac efficiency.',
        route: [
          [37.7749, -122.4194],
          [37.778, -122.415],
          [37.782, -122.41],
          [37.785, -122.405],
          [37.78, -122.412],
          [37.7749, -122.4194]
        ]
      }
    ];
    localStorage.setItem(runsKey, safeStringify(sampleRuns));
  }

  // 2. Nutrition Diary
  const mealsKey = `fittrack_meals_${userId}`;
  if (!localStorage.getItem(mealsKey)) {
    const today = formatOffsetDate(0);
    const yesterday = formatOffsetDate(1);
    const sampleMeals = [
      {
        id: 'meal-seed-1',
        userId,
        date: today,
        category: 'Breakfast',
        name: 'Rolled Oats with Berries & Whey Protein',
        brand: 'Quaker / FitNutrition',
        serving: '1 bowl (80g oats, 1 scoop whey, 50g blueberries)',
        calories: 420,
        protein: 34,
        carbs: 58,
        fat: 7
      },
      {
        id: 'meal-seed-2',
        userId,
        date: today,
        category: 'Lunch',
        name: 'Grilled Chicken Breast with Brown Rice & Broccoli',
        brand: 'Homemade Healthy',
        serving: '1 plate (180g chicken, 150g rice, 100g steamed broccoli)',
        calories: 560,
        protein: 48,
        carbs: 62,
        fat: 9
      },
      {
        id: 'meal-seed-3',
        userId,
        date: today,
        category: 'Snacks',
        name: 'Greek Yogurt 0% with Honey & Almonds',
        brand: 'Fage Total',
        serving: '200g yogurt + 15g almonds',
        calories: 230,
        protein: 21,
        carbs: 16,
        fat: 9
      },
      {
        id: 'meal-seed-4',
        userId,
        date: yesterday,
        category: 'Breakfast',
        name: 'Whole Grain Avocado Toast & Poached Eggs',
        brand: 'Farm Fresh',
        serving: '2 slices whole grain, 2 eggs, 50g avocado',
        calories: 460,
        protein: 24,
        carbs: 38,
        fat: 22
      },
      {
        id: 'meal-seed-5',
        userId,
        date: yesterday,
        category: 'Dinner',
        name: 'Baked Salmon with Sweet Potato and Asparagus',
        brand: 'Atlantic Catch',
        serving: '200g salmon fillet, 150g baked sweet potato',
        calories: 610,
        protein: 44,
        carbs: 45,
        fat: 24
      }
    ];
    localStorage.setItem(mealsKey, safeStringify(sampleMeals));
  }

  // 3. Workouts
  const workoutsKey = `fittrack_workouts_${userId}`;
  if (!localStorage.getItem(workoutsKey)) {
    const sampleWorkouts = [
      {
        id: 'workout-seed-1',
        userId,
        date: formatOffsetDate(1),
        name: 'Upper Body Hypertrophy',
        category: 'Strength Training',
        duration: 55, // minutes
        calories: 320,
        notes: 'Focused on controlled eccentric phase for chest and back.',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: 10, weight: 65 },
          { name: 'Bent-Over Barbell Rows', sets: 4, reps: 12, weight: 60 },
          { name: 'Overhead Dumbbell Press', sets: 3, reps: 10, weight: 18 },
          { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 }
        ]
      },
      {
        id: 'workout-seed-2',
        userId,
        date: formatOffsetDate(3),
        name: 'Legs & Core Power',
        category: 'Strength Training',
        duration: 60,
        calories: 410,
        notes: 'Great squat depth and steady breathing.',
        exercises: [
          { name: 'Barbell Back Squats', sets: 4, reps: 8, weight: 85 },
          { name: 'Romanian Deadlifts', sets: 3, reps: 10, weight: 80 },
          { name: 'Walking Lunges', sets: 3, reps: 12, weight: 16 },
          { name: 'Plank Hold', sets: 3, reps: 60, weight: 0 }
        ]
      },
      {
        id: 'workout-seed-3',
        userId,
        date: formatOffsetDate(5),
        name: 'Full Body Functional HIIT',
        category: 'Cardio',
        duration: 35,
        calories: 340,
        notes: 'High heart rate maintenance, 45s work / 15s rest intervals.',
        exercises: [
          { name: 'Kettlebell Swings', sets: 4, reps: 20, weight: 16 },
          { name: 'Burpees', sets: 4, reps: 15, weight: 0 },
          { name: 'Box Jumps', sets: 4, reps: 12, weight: 0 },
          { name: 'Mountain Climbers', sets: 4, reps: 30, weight: 0 }
        ]
      }
    ];
    localStorage.setItem(workoutsKey, safeStringify(sampleWorkouts));
  }

  // 4. Weight History
  const weightsKey = `fittrack_weights_${userId}`;
  if (!localStorage.getItem(weightsKey)) {
    const sampleWeights = [
      { id: 'w-1', userId, date: formatOffsetDate(14), weight: 73.8 },
      { id: 'w-2', userId, date: formatOffsetDate(10), weight: 73.2 },
      { id: 'w-3', userId, date: formatOffsetDate(7), weight: 72.8 },
      { id: 'w-4', userId, date: formatOffsetDate(3), weight: 72.3 },
      { id: 'w-5', userId, date: formatOffsetDate(0), weight: 72.0 }
    ];
    localStorage.setItem(weightsKey, safeStringify(sampleWeights));
  }

  // 5. Fitness Goals
  const goalsKey = `fittrack_goals_${userId}`;
  if (!localStorage.getItem(goalsKey)) {
    const sampleGoals = [
      {
        id: 'goal-1',
        userId,
        title: 'Weekly Running Target',
        category: 'Running',
        targetValue: 25,
        currentValue: 15.7,
        unit: 'km / week',
        deadline: formatOffsetDate(-7),
        status: 'In Progress'
      },
      {
        id: 'goal-2',
        userId,
        title: 'Target Body Weight',
        category: 'Weight',
        targetValue: 70,
        currentValue: 72,
        unit: 'kg',
        deadline: formatOffsetDate(-30),
        status: 'In Progress'
      },
      {
        id: 'goal-3',
        userId,
        title: 'Complete 4 Workouts / Week',
        category: 'Workout',
        targetValue: 4,
        currentValue: 3,
        unit: 'sessions',
        deadline: formatOffsetDate(-3),
        status: 'In Progress'
      },
      {
        id: 'goal-4',
        userId,
        title: 'Pace Improvement (Sub 5:15 /km)',
        category: 'Running',
        targetValue: 5.15,
        currentValue: 5.23,
        unit: 'min/km',
        deadline: formatOffsetDate(-14),
        status: 'In Progress'
      }
    ];
    localStorage.setItem(goalsKey, safeStringify(sampleGoals));
  }
}

// ----------------- USER AUTHENTICATION & MANAGEMENT -----------------

export function getUsers() {
  return safeParse(localStorage.getItem(USERS_KEY), []);
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, safeStringify(users));
}

export function findUserByEmail(email) {
  if (!email) return null;
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function registerUser(userData) {
  const users = getUsers();
  const existing = findUserByEmail(userData.email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: userData.name.trim(),
    email: userData.email.trim().toLowerCase(),
    password: userData.password,
    role: 'user',
    registeredAt: new Date().toISOString(),
    age: Number(userData.age) || 20,
    gender: userData.gender || 'Not Specified',
    height: Number(userData.height) || 170,
    weight: Number(userData.weight) || 70,
    fitnessLevel: userData.fitnessLevel || 'Beginner',
    fitnessGoal: userData.fitnessGoal || 'Improve Fitness',
    dailyCalorieTarget: Number(userData.dailyCalorieTarget) || 2000
  };

  users.push(newUser);
  saveUsers(users);

  // Initialize initial weight record
  saveWeight(newUser.id, {
    date: new Date().toISOString().split('T')[0],
    weight: newUser.weight
  });

  // Initialize default fitness goals based on their chosen objective
  initializeDefaultGoals(newUser.id, newUser.fitnessGoal);

  return newUser;
}

function initializeDefaultGoals(userId, fitnessGoal) {
  const defaultGoals = [
    {
      id: `goal-${Date.now()}-1`,
      userId,
      title: 'Run 10 km Total',
      category: 'Running',
      targetValue: 10,
      currentValue: 0,
      unit: 'km',
      status: 'In Progress'
    },
    {
      id: `goal-${Date.now()}-2`,
      userId,
      title: 'Complete 3 Workouts Weekly',
      category: 'Workout',
      targetValue: 3,
      currentValue: 0,
      unit: 'sessions',
      status: 'In Progress'
    }
  ];
  localStorage.setItem(`fittrack_goals_${userId}`, safeStringify(defaultGoals));
}

export function getCurrentSession() {
  return safeParse(sessionStorage.getItem(SESSION_KEY), null);
}

export function setCurrentSession(user) {
  if (!user) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  // Store session without exposing password in session
  const safeSession = { ...user };
  delete safeSession.password;
  sessionStorage.setItem(SESSION_KEY, safeStringify(safeSession));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function updateUserProfile(userId, updatedFields) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    throw new Error('User not found.');
  }

  const updatedUser = {
    ...users[index],
    ...updatedFields,
    // prevent changing id or email to duplicate
    id: users[index].id,
    email: users[index].email
  };

  users[index] = updatedUser;
  saveUsers(users);

  // If current session is this user, update session too
  const currentSession = getCurrentSession();
  if (currentSession && currentSession.id === userId) {
    setCurrentSession(updatedUser);
  }

  // If weight changed, log a new weight history entry
  if (updatedFields.weight && updatedFields.weight !== users[index].weight) {
    saveWeight(userId, {
      date: new Date().toISOString().split('T')[0],
      weight: Number(updatedFields.weight)
    });
  }

  return updatedUser;
}

// ----------------- ISOLATED USER DATA: RUNS -----------------

export function getRuns(userId) {
  if (!userId) return [];
  return safeParse(localStorage.getItem(`fittrack_runs_${userId}`), []);
}

export function saveRun(userId, runData) {
  if (!userId) throw new Error('User ID is required to save a run.');
  const runs = getRuns(userId);
  const newRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    createdAt: new Date().toISOString(),
    ...runData
  };
  runs.unshift(newRun);
  localStorage.setItem(`fittrack_runs_${userId}`, safeStringify(runs));
  return newRun;
}

export function deleteRun(userId, runId) {
  if (!userId) return;
  const runs = getRuns(userId);
  const filtered = runs.filter((r) => r.id !== runId);
  localStorage.setItem(`fittrack_runs_${userId}`, safeStringify(filtered));
}

// ----------------- ISOLATED USER DATA: WORKOUTS -----------------

export function getWorkouts(userId) {
  if (!userId) return [];
  return safeParse(localStorage.getItem(`fittrack_workouts_${userId}`), []);
}

export function saveWorkout(userId, workoutData) {
  if (!userId) throw new Error('User ID is required to save a workout.');
  const workouts = getWorkouts(userId);
  const newWorkout = {
    id: `wo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    createdAt: new Date().toISOString(),
    ...workoutData
  };
  workouts.unshift(newWorkout);
  localStorage.setItem(`fittrack_workouts_${userId}`, safeStringify(workouts));
  return newWorkout;
}

export function deleteWorkout(userId, workoutId) {
  if (!userId) return;
  const workouts = getWorkouts(userId);
  const filtered = workouts.filter((w) => w.id !== workoutId);
  localStorage.setItem(`fittrack_workouts_${userId}`, safeStringify(filtered));
}

// ----------------- ISOLATED USER DATA: MEALS -----------------

export function getMeals(userId) {
  if (!userId) return [];
  return safeParse(localStorage.getItem(`fittrack_meals_${userId}`), []);
}

export function saveMeal(userId, mealData) {
  if (!userId) throw new Error('User ID is required to save a meal.');
  const meals = getMeals(userId);
  const newMeal = {
    id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    createdAt: new Date().toISOString(),
    ...mealData
  };
  meals.unshift(newMeal);
  localStorage.setItem(`fittrack_meals_${userId}`, safeStringify(meals));
  return newMeal;
}

export function updateMeal(userId, mealId, updatedData) {
  if (!userId) return;
  const meals = getMeals(userId);
  const index = meals.findIndex((m) => m.id === mealId);
  if (index !== -1) {
    meals[index] = { ...meals[index], ...updatedData };
    localStorage.setItem(`fittrack_meals_${userId}`, safeStringify(meals));
  }
}

export function deleteMeal(userId, mealId) {
  if (!userId) return;
  const meals = getMeals(userId);
  const filtered = meals.filter((m) => m.id !== mealId);
  localStorage.setItem(`fittrack_meals_${userId}`, safeStringify(filtered));
}

// ----------------- ISOLATED USER DATA: WEIGHT HISTORY -----------------

export function getWeights(userId) {
  if (!userId) return [];
  const list = safeParse(localStorage.getItem(`fittrack_weights_${userId}`), []);
  return list.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function saveWeight(userId, weightData) {
  if (!userId) throw new Error('User ID required.');
  const weights = getWeights(userId);
  const existingIndex = weights.findIndex((w) => w.date === weightData.date);
  
  if (existingIndex !== -1) {
    weights[existingIndex].weight = Number(weightData.weight);
  } else {
    weights.push({
      id: `w-${Date.now()}`,
      userId,
      date: weightData.date,
      weight: Number(weightData.weight)
    });
  }

  weights.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem(`fittrack_weights_${userId}`, safeStringify(weights));
  return weights;
}

export function deleteWeight(userId, weightId) {
  if (!userId) return;
  const weights = getWeights(userId);
  const filtered = weights.filter((w) => w.id !== weightId);
  localStorage.setItem(`fittrack_weights_${userId}`, safeStringify(filtered));
}

// ----------------- ISOLATED USER DATA: FITNESS GOALS -----------------

export function getGoals(userId) {
  if (!userId) return [];
  return safeParse(localStorage.getItem(`fittrack_goals_${userId}`), []);
}

export function saveGoal(userId, goalData) {
  if (!userId) throw new Error('User ID required.');
  const goals = getGoals(userId);
  const newGoal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    status: 'In Progress',
    currentValue: 0,
    ...goalData
  };
  goals.push(newGoal);
  localStorage.setItem(`fittrack_goals_${userId}`, safeStringify(goals));
  return newGoal;
}

export function updateGoal(userId, goalId, updatedData) {
  if (!userId) return;
  const goals = getGoals(userId);
  const index = goals.findIndex((g) => g.id === goalId);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updatedData };
    localStorage.setItem(`fittrack_goals_${userId}`, safeStringify(goals));
  }
}

export function deleteGoal(userId, goalId) {
  if (!userId) return;
  const goals = getGoals(userId);
  const filtered = goals.filter((g) => g.id !== goalId);
  localStorage.setItem(`fittrack_goals_${userId}`, safeStringify(filtered));
}

// ----------------- ADMIN AGGREGATIONS & USER REMOVAL -----------------

export function deleteUserAccount(userId) {
  const users = getUsers();
  const targetUser = users.find((u) => u.id === userId);
  if (!targetUser) throw new Error('User not found.');

  // Protect administrator account from deletion
  if (targetUser.role === 'admin' || targetUser.email.toLowerCase() === 'admin@fittrack.app') {
    throw new Error('The administrator account cannot be deleted.');
  }

  // Remove from users list
  const filteredUsers = users.filter((u) => u.id !== userId);
  saveUsers(filteredUsers);

  // Clean up all isolated user data keys
  localStorage.removeItem(`fittrack_runs_${userId}`);
  localStorage.removeItem(`fittrack_workouts_${userId}`);
  localStorage.removeItem(`fittrack_meals_${userId}`);
  localStorage.removeItem(`fittrack_weights_${userId}`);
  localStorage.removeItem(`fittrack_goals_${userId}`);

  return true;
}

export function getAdminStats() {
  const users = getUsers().filter((u) => u.role !== 'admin');
  let totalRuns = 0;
  let totalDistanceKm = 0;
  let totalWorkouts = 0;
  let totalMeals = 0;
  let allRecentActivities = [];

  users.forEach((user) => {
    const userRuns = getRuns(user.id);
    const userWorkouts = getWorkouts(user.id);
    const userMeals = getMeals(user.id);

    totalRuns += userRuns.length;
    totalDistanceKm += userRuns.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
    totalWorkouts += userWorkouts.length;
    totalMeals += userMeals.length;

    // Collect activities for live stream
    userRuns.forEach((r) => {
      allRecentActivities.push({
        id: r.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'run',
        title: `Run: ${r.distance} km (${r.title || 'Outdoor Run'})`,
        details: `${r.pace || '--:--'} • ${r.calories || 0} kcal`,
        date: r.date || r.createdAt
      });
    });

    userWorkouts.forEach((w) => {
      allRecentActivities.push({
        id: w.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'workout',
        title: `Workout: ${w.name} (${w.category})`,
        details: `${w.duration} mins • ${w.calories || 0} kcal`,
        date: w.date || w.createdAt
      });
    });

    userMeals.forEach((m) => {
      allRecentActivities.push({
        id: m.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'meal',
        title: `Nutrition: ${m.name} (${m.category})`,
        details: `${m.calories} kcal • P:${m.protein}g C:${m.carbs}g F:${m.fat}g`,
        date: m.date || m.createdAt
      });
    });
  });

  // Sort activities newest first
  allRecentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    totalUsers: users.length,
    totalRuns,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    totalWorkouts,
    totalMeals,
    recentActivities: allRecentActivities.slice(0, 25),
    users
  };
}
