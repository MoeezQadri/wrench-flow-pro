import { generateId } from "./data-service";
import { User, Organization, UserRole } from "@/types";

// Mock users and organizations storage
let registeredUsers: User[] = [];
let registeredOrganizations: Organization[] = [];
let sessions: { token: string; userId: string }[] = [];

// Available currencies
export const availableCurrencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

// Available countries
export const availableCountries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 
  'Germany', 'France', 'Italy', 'Spain', 'Japan', 'China', 
  'India', 'Brazil', 'Mexico', 'South Africa', 'Nigeria'
];

// Register a new organization and its owner
export const registerOrganization = (
  organizationName: string,
  country: string,
  currency: string,
  ownerName: string,
  ownerEmail: string,
  ownerPassword: string
): { organization: Organization; user: User; token: string } => {
  // Check if email is already registered
  if (registeredUsers.some(user => user.email === ownerEmail)) {
    throw new Error('Email already registered');
  }

  // Create organization
  const organizationId = generateId('org');
  const newOrganization: Organization = {
    id: organizationId,
    name: organizationName,
    subscriptionLevel: 'trial',
    subscriptionStatus: 'trial',
    country,
    currency,
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
  };

  // Create owner user
  const userId = generateId('user');
  const newUser: User = {
    id: userId,
    name: ownerName,
    email: ownerEmail,
    role: 'owner',
    isActive: true,
    organizationId: organizationId,
    passwordHash: ownerPassword, // In a real app, this would be hashed
    lastLogin: new Date().toISOString()
  };

  // Store in our mock database
  registeredOrganizations.push(newOrganization);
  registeredUsers.push(newUser);

  // Create session token
  const token = generateId('token');
  sessions.push({ token, userId });

  return { organization: newOrganization, user: newUser, token };
};

// Check if credentials are for superadmin
export const isSuperAdmin = (token: string): boolean => {
  return token.startsWith('superadmin-');
};

// Add a new user to an organization
export const addUserToOrganization = (
  organizationId: string,
  name: string,
  email: string,
  role: UserRole,
  addedByUserId: string
): User => {
  // Check if the user adding has permission (must be owner or manager)
  const addingUser = registeredUsers.find(user => user.id === addedByUserId);
  if (!addingUser || (addingUser.role !== 'owner' && addingUser.role !== 'manager')) {
    throw new Error('No permission to add users');
  }

  // Check if email is already registered
  if (registeredUsers.some(user => user.email === email)) {
    throw new Error('Email already registered');
  }

  // Check if organization exists
  if (!registeredOrganizations.some(org => org.id === organizationId)) {
    throw new Error('Organization not found');
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);

  // Create user
  const userId = generateId('user');
  const newUser: User = {
    id: userId,
    name,
    email,
    role,
    isActive: true,
    organizationId,
    passwordHash: tempPassword, // In a real app, this would be hashed
    mustChangePassword: true
  };

  // Store in our mock database
  registeredUsers.push(newUser);

  // In a real app, send email with temp password
  console.log(`New user created with temp password: ${tempPassword}`);

  return newUser;
};

// Login with email and password
export const loginUser = (email: string, password: string): { user: User; token: string } => {
  // Find user by email
  const user = registeredUsers.find(user => user.email === email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check password (in real app, would compare hashes)
  if (user.passwordHash !== password) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Create session token
  const token = generateId('token');
  sessions.push({ token, userId: user.id });

  // Update last login
  user.lastLogin = new Date().toISOString();

  return { user, token };
};

// Request password reset (this would email a token in a real app)
export const requestPasswordReset = (email: string): string => {
  // Find user by email
  const user = registeredUsers.find(user => user.email === email);
  if (!user) {
    // For security, don't reveal if email exists
    return 'reset-token-123'; // Dummy token
  }

  const resetToken = generateId('reset');
  user.resetToken = resetToken;
  user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // In a real app, send email with reset link
  console.log(`Password reset requested for ${email}, token: ${resetToken}`);

  return resetToken;
};

// Reset password with token
export const resetPassword = (email: string, token: string, newPassword: string): boolean => {
  // Find user by email
  const user = registeredUsers.find(user => user.email === email);
  if (!user || user.resetToken !== token) {
    return false;
  }

  // Check if token has expired
  if (user.resetTokenExpires && new Date(user.resetTokenExpires) < new Date()) {
    return false;
  }

  // Update password
  user.passwordHash = newPassword; // In a real app, this would be hashed
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  user.mustChangePassword = false;

  return true;
};

// Change password (for logged in users)
export const changePassword = (userId: string, currentPassword: string, newPassword: string): boolean => {
  // Find user by ID
  const user = registeredUsers.find(user => user.id === userId);
  if (!user) {
    return false;
  }

  // Check current password (in real app, would compare hashes)
  if (user.passwordHash !== currentPassword) {
    return false;
  }

  // Update password
  user.passwordHash = newPassword; // In a real app, this would be hashed
  user.mustChangePassword = false;

  return true;
};

// Get current user from token
export const getUserFromToken = (token: string): User | null => {
  // Check if it's a superadmin token
  if (token.startsWith('superadmin-')) {
    return {
      id: 'superuser-1',
      name: 'System Administrator',
      email: 'admin@system.com',
      role: 'superuser',
      isActive: true,
      lastLogin: new Date().toISOString()
    };
  }

  const session = sessions.find(s => s.token === token);
  if (!session) {
    return null;
  }

  return registeredUsers.find(user => user.id === session.userId) || null;
};

// Logout (remove token)
export const logout = (token: string): boolean => {
  const sessionIndex = sessions.findIndex(s => s.token === token);
  if (sessionIndex === -1) {
    return false;
  }

  sessions.splice(sessionIndex, 1);
  return true;
};

// Get users for an organization
export const getOrganizationUsers = (organizationId: string): User[] => {
  return registeredUsers.filter(user => user.organizationId === organizationId);
};

// Get organization by ID
export const getOrganizationById = (organizationId: string): Organization | null => {
  return registeredOrganizations.find(org => org.id === organizationId) || null;
};

// Update organization settings
export const updateOrganization = (
  organizationId: string, 
  updatedData: Partial<Organization>
): Organization | null => {
  const orgIndex = registeredOrganizations.findIndex(org => org.id === organizationId);
  if (orgIndex === -1) {
    return null;
  }

  registeredOrganizations[orgIndex] = {
    ...registeredOrganizations[orgIndex],
    ...updatedData
  };

  return registeredOrganizations[orgIndex];
};

//get list of users
export const getRegisteredUsers = () => { return registeredUsers }