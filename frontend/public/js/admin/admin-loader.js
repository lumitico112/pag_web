// Admin Dashboard Loader - Professional loading screen for admin access

class AdminDashboardLoader {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.progressBar = document.getElementById('progressBar');
    this.loadingText = document.querySelector('.loading-text');
    this.init();
  }

  init() {
    this.checkAuthAndLoad();
  }

  checkAuthAndLoad() {
    // Check if auth system is loaded
    if (typeof auth === 'undefined' || !auth.isAuthenticated) {
      console.error('Auth system not loaded');
      this.showError('Error del sistema. Redirigiendo...', () => {
        window.location.href = 'login.html';
      });
      return;
    }

    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      // Not logged in, redirect to login after showing message
      this.showError('Acceso denegado. Redirigiendo al login...', () => {
        window.location.href = 'login.html';
      });
      return;
    }
    
    const userRole = auth.getUserRole();
    if (userRole !== 'admin' && userRole !== 'trabajador') {
      // Not admin or worker, redirect to main site
      this.showError('Acceso restringido. Solo personal autorizado.', () => {
        window.location.href = 'index.html';
      });
      return;
    }
    
    // Authorized user, proceed with loading animation
    this.startLoadingAnimation();
  }

  startLoadingAnimation() {
    // Loading stages with timings
    const stages = [
      { time: 800, text: 'Verificando permisos...' },
      { time: 1600, text: 'Cargando módulos del sistema...' },
      { time: 2400, text: 'Inicializando dashboard...' },
      { time: 3000, text: 'Preparando interfaz...' },
      { time: 3500, text: 'Completado. Accediendo al panel...', final: true }
    ];

    // Execute each stage
    stages.forEach(stage => {
      setTimeout(() => {
        this.loadingText.textContent = stage.text;
        
        if (stage.final) {
          this.redirectToAdminDashboard();
        }
      }, stage.time);
    });
  }

  redirectToAdminDashboard() {
    // Add fade out effect to loading screen
    this.loadingScreen.classList.add('fade-out');
    
    // Redirect after fade out animation
    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 500);
  }

  showError(message, callback) {
    // Update loading content to show error
    const loadingContent = document.querySelector('.loading-content');
    
    loadingContent.innerHTML = `
      <div class="logo-container">
        <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
        <h4 class="text-warning mb-3">${message}</h4>
      </div>
      <div class="spinner-border text-warning mb-3"></div>
      <p class="text-muted">Redirigiendo...</p>
    `;
    
    setTimeout(callback, 2000);
  }

  // Utility method for debugging
  static debugInfo() {
    console.log('AdminDashboardLoader initialized');
    console.log('Auth status:', auth.isAuthenticated());
    console.log('User role:', auth.getUserRole());
    console.log('User data:', auth.getUserData());
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit more to ensure auth.js is fully loaded and initialized
  setTimeout(() => {
    new AdminDashboardLoader();
  }, 200);
});

// Export for debugging
window.AdminDashboardLoader = AdminDashboardLoader;
