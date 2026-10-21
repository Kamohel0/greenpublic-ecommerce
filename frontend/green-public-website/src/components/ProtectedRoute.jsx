import { Navigate } from "react-router-dom";
import useAuthStore from "./store/useAuthStore";

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, loading, user } = useAuthStore();

  // Show nothing while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (requiredRoles?.length) {
    const role = user?.role;
    if (!role || !requiredRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
