/**
 * Authentication service handling login, registration, and session state
 */
import {
  findUserByEmail,
  registerUser as storageRegisterUser,
  setCurrentSession,
  getCurrentSession,
  clearSession
} from './storageService';

export function login(email, password) {
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('No account found with this email address.');
  }

  if (user.password !== password) {
    throw new Error('Invalid password. Please check your credentials and try again.');
  }

  setCurrentSession(user);
  return user;
}

export function register(userData) {
  const newUser = storageRegisterUser(userData);
  setCurrentSession(newUser);
  return newUser;
}

export function logout() {
  clearSession();
}

export function getSessionUser() {
  return getCurrentSession();
}

export function isAdmin(user) {
  return Boolean(user && user.role === 'admin');
}
