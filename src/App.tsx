import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { Video, Users, Building2, TrendingUp, Star, Play, ArrowRight, Menu, X, User, LogOut, Calendar, Settings, Shield, UserCheck, Cog, Briefcase } from "lucide-react";
import { AuthModal } from "./components/AuthModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminSetup } from "./components/AdminSetup";
import { AdminLogin } from "./components/AdminLogin";
import { SupabaseSetupGuide } from "./components/SupabaseSetupGuide";
import { SupabaseConfigChecker } from "./components/SupabaseConfigChecker";
import { Footer } from "./components/Footer";
import { AboutPage } from "./components/pages/AboutPage";
import { TermsPage } from "./components/pages/TermsPage";
import { PrivacyPage } from "./components/pages/PrivacyPage";
import { HelpPage } from "./components/pages/HelpPage";
import { ContactPage } from "./components/pages/ContactPage";
import { InfluencersPage } from "./components/pages/InfluencersPage";
import { TasksPage } from "./components/pages/TasksPage";
import { useAuthContext } from "./hooks/useAuth";
import { InfluencerDataViewer } from "./components/InfluencerDataViewer";
import { CompanyProfilePage } from "./components/pages/CompanyProfilePage";
import { InfluencerProfilePage } from "./components/pages/InfluencerProfilePage";
import { AccountSettingsPage } from "./components/pages/AccountSettingsPage";
import { InfluencerTasksPage } from "./components/pages/InfluencerTasksPage";
import { CompanyTasksPage } from "./components/pages/CompanyTasksPage";
import { AdminLoginPage } from "./components/pages/AdminLoginPage";
import { AdminLoginPageNew } from "./components/pages/AdminLoginPageNew";
import { AdminAuthProvider } from "./lib/adminAuthProvider";
import { AdminAuthGuard } from "./components/AdminAuthGuard";
import InfluencerImageUploadTest from "./components/pages/InfluencerImageUploadTest";
import { CompanyDetailPage } from "./components/pages/CompanyDetailPage";
import { InfluencerDetailPage } from "./components/pages/InfluencerDetailPage";
import { TaskDetailPage } from "./components/pages/TaskDetailPage";
import { VideoPlayerPage } from "./components/pages/VideoPlayerPage";
import { VideosPage } from "./components/pages/VideosPage";
import { SmsVerificationTest } from "./components/pages/SmsVerificationTest";
import { RouteTestPage } from "./components/pages/RouteTestPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EmailVerificationTest } from "./components/pages/EmailVerificationTest";
import LoginTestPage from "./components/pages/LoginTestPage";
import { SignupPage } from "./components/pages/SignupPage";
import { MaterialsPage } from "./components/pages/MaterialsPage";
import { EnvironmentChecker } from "./components/EnvironmentChecker";
import { ProductionDebugger } from "./components/ProductionDebugger";
import { HomePage } from "./components/pages/HomePage";


function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authUserType, setAuthUserType] = useState<"influencer" | "company">("influencer");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDataViewer, setShowDataViewer] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut, isAdmin } = useAuthContext();

  // Company detail page wrapper component
  function CompanyDetailWrapper() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    if (!id) {
      return <div>Company ID does not exist</div>;
    }
    
    return <CompanyDetailPage companyId={id} onBack={() => navigate(-1)} />;
  }

  // Influencer detail page wrapper component
  function InfluencerDetailWrapper() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    if (!id) {
      return <div>Influencer ID does not exist</div>;
    }
    
    return <InfluencerDetailPage influencerId={id} onBack={() => navigate(-1)} />;
  }

  // Task detail page wrapper component
  function TaskDetailWrapper() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    if (!id) {
      return <div>Task ID does not exist</div>;
    }
    
    return <TaskDetailPage taskId={id} onBack={() => navigate(-1)} />;
  }

  const handleSignOut = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      
      const { error } = await signOut();
      
      if (error) {
        console.error("Logout failed:", error);
      }
      
      navigate("/");
      setIsMobileMenuOpen(false);
      setIsAuthModalOpen(false);
      
    } catch (error) {
      console.error("Error occurred during logout:", error);
    } finally {
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  const handlePageChange = (page: string) => {
    let targetPath = "/";
    
    if (page === "home") {
      targetPath = "/";
    } else if (page === "profile") {
      if (profile?.user_type === "influencer") {
        targetPath = "/influencer-profile";
      } else if (profile?.user_type === "company") {
        targetPath = "/company-profile";
      } else {
        targetPath = "/profile";
      }
    } else {
      targetPath = `/${page}`;
    }
    
    navigate(targetPath);
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  };

    return (
      <div className="min-h-screen bg-white">
      {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
            <button 
                onClick={() => handlePageChange("home")}
              className="flex items-center space-x-2"
            >
              <img 
                src="/logo.png" 
                alt="Tkbubu Logo"
                className="w-8 h-8" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Tkbubu
              </span>
            </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handlePageChange("home")}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === "/" ? "text-pink-600 font-medium" : ""}`}
              >
                Home
              </button>
              <button 
                onClick={() => handlePageChange("influencers")}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === "/influencers" ? "text-pink-600 font-medium" : ""}`}
              >
                Creator List
              </button>
              <button 
                onClick={() => handlePageChange("tasks")}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === "/tasks" ? "text-pink-600 font-medium" : ""}`}
              >
                Task Center
              </button>
              <button 
                onClick={() => handlePageChange("videos")}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === "/videos" ? "text-pink-600 font-medium" : ""}`}
              >
                Video Showcase
              </button>
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors"
                    disabled={isLoggingOut}
                  >
                    <User className="w-5 h-5" />
                    <span>
                      {isLoggingOut ? "Exiting..." : (
                        profile?.user_type === "admin"
                          ? "Super Admin"
                          : profile?.user_type === "company"
                          ? "Company User"
                          : profile?.user_type === "influencer"
                          ? "Influencer User"
                          : "User Center"
                      )}
                    </span>
                  </button>
                  
                  {showUserMenu && !isLoggingOut && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      {/* 管理员功能 */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handlePageChange("admin")}
                            className="flex items-center w-full text-left py-2 px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            管理后台
                          </button>
                          <button
                            onClick={() => handlePageChange("admin-setup")}
                            className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            管理员设置
                          </button>
                        </>
                      )}
                      
                      {/* 普通用户功能 */}
                      {!isAdmin && (
                        <>
                          <button
                            onClick={() => handlePageChange("profile")}
                            className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <UserCheck className="w-4 h-4 mr-3" />
                            Profile
                          </button>
                          <button
                            onClick={() => handlePageChange("account-settings")}
                            className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <Cog className="w-4 h-4 mr-3" />
                            Account Settings
                          </button>
                          {profile?.user_type === "influencer" && (
                            <button
                              onClick={() => handlePageChange("influencer-tasks")}
                              className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            >
                              <Briefcase className="w-4 h-4 mr-3" />
                              My Tasks
                            </button>
                          )}
                          {profile?.user_type === "company" && (
                            <button
                              onClick={() => handlePageChange("company-tasks")}
                              className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            >
                              <Briefcase className="w-4 h-4 mr-3" />
                              My Tasks
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="flex items-center w-full text-left py-2 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLoggingOut ? "Exiting..." : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setAuthMode("signin");
                      setIsAuthModalOpen(true);
                    }}
                    className="text-gray-700 hover:text-pink-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-pink-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="space-y-2">
                <button 
                  onClick={() => handlePageChange("home")}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === "/" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => handlePageChange("influencers")}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === "/influencers" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Creator List
                </button>
                <button 
                  onClick={() => handlePageChange("tasks")}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === "/tasks" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Task Center
                </button>
                <button 
                  onClick={() => handlePageChange("videos")}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === "/videos" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Video Showcase
                </button>
                
                {/* 用户菜单 */}
                {user ? (
                  <div className="border-t border-gray-100 pt-2 space-y-2">
                    <div className="px-4 py-2 text-sm text-gray-600">
                      {user.email}
                    </div>
                    
                    {/* 管理员功能 */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handlePageChange("admin")}
                          className="block w-full text-left py-2 px-4 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          管理后台
                        </button>
                        <button
                          onClick={() => handlePageChange("admin-setup")}
                          className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                        >
                          管理员设置
                        </button>
                      </>
                    )}
                    
                    {/* 普通用户功能 */}
                    {!isAdmin && (
                      <>
                        <button
                          onClick={() => handlePageChange("profile")}
                          className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handlePageChange("account-settings")}
                          className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                        >
                          Account Settings
                        </button>
                        {profile?.user_type === "influencer" && (
                          <button
                            onClick={() => handlePageChange("influencer-tasks")}
                            className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                          >
                            My Tasks
                          </button>
                        )}
                        {profile?.user_type === "company" && (
                          <button
                            onClick={() => handlePageChange("company-tasks")}
                            className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                          >
                            My Tasks
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="block w-full text-left py-2 px-4 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? "Exiting..." : "Logout"}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-100 pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setAuthMode("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className="block w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold text-center hover:shadow-lg transition-all duration-200"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/influencers" element={<InfluencersPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/about" element={<AboutPage />} />
                        <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route 
              path="/admin-login" 
              element={
                <AdminAuthProvider>
                  <AdminLoginPageNew />
                </AdminAuthProvider>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminAuthProvider>
                  <AdminAuthGuard>
                    <AdminDashboard />
                  </AdminAuthGuard>
                </AdminAuthProvider>
              } 
            />
            <Route path="/influencer-profile" element={<InfluencerProfilePage />} />
            <Route path="/influencer-image-upload-test" element={<InfluencerImageUploadTest />} />        
            <Route path="/company-profile" element={<CompanyProfilePage />} />
            <Route path="/account-settings" element={<AccountSettingsPage />} />
            <Route path="/influencer-tasks" element={<InfluencerTasksPage />} />
            <Route path="/company-tasks" element={<CompanyTasksPage />} />
            <Route path="/company/:id" element={<CompanyDetailWrapper />} />
            <Route path="/influencer/:id" element={<InfluencerDetailWrapper />} />
            <Route path="/task/:id" element={<TaskDetailWrapper />} />
            <Route path="/video/:videoId" element={<VideoPlayerPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/route-test/:id" element={<RouteTestPage />} />
            <Route path="/sms-test" element={<SmsVerificationTest />} />
            <Route path="/email-test" element={<EmailVerificationTest />} />
            <Route path="/login-test" element={<LoginTestPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer - 不在管理后台页面显示 */}
      {!location.pathname.startsWith('/admin') && (
        <Footer onPageChange={handlePageChange} />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
        defaultUserType={authUserType}
      />
      )}

      {/* Data Viewer */}
      {showDataViewer && <InfluencerDataViewer />}
    </div>
  );
}

export default App;
