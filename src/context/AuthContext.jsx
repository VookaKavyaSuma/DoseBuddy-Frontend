import { createContext, useContext, useState, useEffect } from 'react';
import {
    getStoredToken,
    getStoredUser,
    setAuthData,
    clearAuthData,
    loginApi,
    registerApi,
    demoLoginApi,
    fetchProfileApi
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getStoredUser());
    const [token, setToken] = useState(() => getStoredToken());
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Validate stored token on startup
    useEffect(() => {
        const verifyToken = async () => {
            const savedToken = getStoredToken();
            if (!savedToken) {
                setIsLoading(false);
                return;
            }

            try {
                const profile = await fetchProfileApi(savedToken);
                setUser(profile);
                setToken(savedToken);
                setAuthData(savedToken, profile);
            } catch (err) {
                console.warn('Backend offline or invalid token, preserving offline session if available:', err);
                const cachedUser = getStoredUser();
                if (cachedUser) {
                    setUser(cachedUser);
                    setToken(savedToken);
                } else {
                    clearAuth();
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const handleAuthSuccess = (authData) => {
        const { token: newToken, user: newUser } = authData;
        setToken(newToken);
        setUser(newUser);
        setAuthData(newToken, newUser);
        setAuthError(null);
    };

    const clearAuth = () => {
        setToken(null);
        setUser(null);
        clearAuthData();
    };

    const login = async (usernameOrEmail, password) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const response = await loginApi(usernameOrEmail, password);
            handleAuthSuccess(response);
            return response;
        } catch (err) {
            setAuthError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (formData) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const response = await registerApi(formData);
            handleAuthSuccess(response);
            return response;
        } catch (err) {
            setAuthError(err.message || 'Registration failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const demoLogin = async (role = 'CAREGIVER') => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const response = await demoLoginApi(role);
            handleAuthSuccess(response);
            return response;
        } catch (err) {
            // Fallback for demo mode if backend server is still launching
            console.warn('Backend demo API unavailable, using local demo profile:', err);
            const mockUser = role === 'PATIENT' 
                ? { id: 'usr_patient_1', email: 'patient@dosebuddy.com', username: 'patient_robert', fullName: 'Robert Jenkins (Senior)', role: 'PATIENT' }
                : { id: 'usr_caregiver_1', email: 'caregiver@dosebuddy.com', username: 'caregiver_sarah', fullName: 'Sarah Jenkins (Caregiver)', role: 'CAREGIVER' };
            
            const mockToken = 'mock_jwt_token_demo_mode_' + Date.now();
            handleAuthSuccess({ token: mockToken, user: mockUser });
            return { token: mockToken, user: mockUser, message: 'Logged in (Demo Mode)' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearAuth();
    };

    const clearError = () => {
        setAuthError(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user && !!token,
            isLoading,
            authError,
            login,
            register,
            demoLogin,
            logout,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
