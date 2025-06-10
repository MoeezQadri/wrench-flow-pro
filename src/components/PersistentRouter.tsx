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
            const lastRoute = localStorage.getItem('lastRoute');
            if (
                lastRoute &&
                lastRoute !== location.pathname &&
                lastRoute !== '/auth/login'
            ) {
                navigate(lastRoute, { replace: true });
            }
        }
    }, [loading, isAuthenticated]);

    if (loading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
};

export default PersistentRouter;
