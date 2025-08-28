import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

interface Props {
    children: React.ReactNode;
}

const PersistentRouter = ({ children }: Props) => {
    const { loading, isAuthenticated } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            // Don't redirect during password reset or email confirmation flows
            const params = new URLSearchParams(location.search);
            const isPasswordResetFlow = location.pathname === '/auth/reset-password';
            const isEmailConfirmFlow = location.pathname === '/auth/confirm';
            const isRecoveryConfirm = location.pathname === '/auth/confirm' && params.get('type') === 'recovery';
            const hasRecoveryTokens = params.get('access_token') && params.get('refresh_token') && params.get('type') === 'recovery';
            
            if (isPasswordResetFlow || isEmailConfirmFlow || isRecoveryConfirm || hasRecoveryTokens) {
                return; // Skip automatic redirect for recovery flows
            }
            
            const lastRoute = localStorage.getItem('lastRoute');
            if (
                lastRoute &&
                lastRoute !== location.pathname &&
                lastRoute !== '/auth/login'
            ) {
                navigate(lastRoute, { replace: true });
            }
        }
    }, [loading, isAuthenticated, location.pathname, location.search]);

    if (loading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
};

export default PersistentRouter;
