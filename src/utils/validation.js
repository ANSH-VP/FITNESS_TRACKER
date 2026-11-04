/**
 * Input validation utilities
 */

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.trim().length >= 6;
}

export function validateRegistrationForm(formData) {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full name is required.';
  }

  if (!formData.email || !validateEmail(formData.email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!formData.password || !validatePassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!formData.age || Number(formData.age) < 10 || Number(formData.age) > 120) {
    errors.age = 'Please enter a valid age between 10 and 120.';
  }

  if (!formData.height || Number(formData.height) < 50 || Number(formData.height) > 260) {
    errors.height = 'Please enter a valid height (50 to 260 cm).';
  }

  if (!formData.weight || Number(formData.weight) < 20 || Number(formData.weight) > 300) {
    errors.weight = 'Please enter a valid weight (20 to 300 kg).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
