// Admin Main - Control principal del dashboard administrativo

class AdminDashboard {
  constructor() {
    this.currentSection = 'dashboard';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthentication();
    this.loadDashboardData();
  }

  setupEventListeners() {
    // Navigation events
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.closest('[data-section]').dataset.section;
        this.showSection(section);
      });
    });

    // Close sidebar on mobile when clicking a link
    if (window.innerWidth < 992) {
      document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', () => {
          const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('adminSidebar'));
          if (sidebar) sidebar.hide();
        });
      });
    }

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  checkAuthentication() {
    const user = getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'trabajador')) {
      window.location.href = 'login.html';
      return;
    }
    // Update admin name in navbar only if element exists
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
      adminNameElement.textContent = user.nombre || 'Administrador';
    }
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentSection = sectionName;
      
      // Update navigation
      this.updateNavigation(sectionName);
      
      // Load section-specific data
      this.loadSectionData(sectionName);
    }
  }

  updateNavigation(sectionName) {
    // Update sidebar navigation
    document.querySelectorAll('.admin-nav .nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  loadSectionData(sectionName) {
    switch (sectionName) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'rutas':
        if (window.AdminRutas) {
          window.AdminRutas.cargarRutas();
        }
        break;
      case 'usuarios':
        if (window.AdminUsuarios) {
          window.AdminUsuarios.cargarUsuarios();
        }
        break;
      case 'historial':
        if (window.AdminHistorial) {
          window.AdminHistorial.cargarHistorial();
        }
        break;
      case 'estadisticas':
        if (window.AdminEstadisticas) {
          window.AdminEstadisticas.cargarEstadisticas();
        }
        break;
    }
  }

  async loadDashboardData() {
    try {
      // Load stats cards
      await this.loadDashboardStats();
      
      // Load recent activity
      await this.loadRecentActivity();
      
      // Load system alerts
      this.loadSystemAlerts();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showAlert('Error al cargar los datos del dashboard', 'danger');
    }
  }

  async loadDashboardStats() {
    try {
      // Get active routes
      const rutasResponse = await fetch(`${API_BASE_URL}/rutas.php`);
      if (!rutasResponse.ok) {
        document.getElementById('total-rutas-activas').textContent = '--';
        throw new Error(`HTTP ${rutasResponse.status}: ${rutasResponse.statusText}`);
      }
      const rutasText = await rutasResponse.text();
      let rutasData;
      try {
        rutasData = JSON.parse(rutasText);
      } catch (e) {
        document.getElementById('total-rutas-activas').textContent = '--';
        console.error('Error parseando respuesta de rutas:', rutasText.substring(0, 200));
        throw new Error('Respuesta no válida del servidor de rutas');
      }
      let rutasActivas = 0;
      if (rutasData && rutasData.success && Array.isArray(rutasData.rutas)) {
        rutasActivas = rutasData.rutas.filter(r => r.estado === 'activo').length;
      } else {
        document.getElementById('total-rutas-activas').textContent = '--';
        console.warn('El formato de rutas no es el esperado:', rutasData);
      }
      document.getElementById('total-rutas-activas').textContent = rutasActivas;

      // Get total users
      const usuariosResponse = await fetch(`${API_BASE_URL}/users.php`);
      if (!usuariosResponse.ok) {
        throw new Error(`HTTP ${usuariosResponse.status}: ${usuariosResponse.statusText}`);
      }
      
      const usuariosText = await usuariosResponse.text();
      let usuariosData;
      try {
        usuariosData = JSON.parse(usuariosText);
      } catch (e) {
        console.error('Error parseando respuesta de usuarios:', usuariosText.substring(0, 200));
        throw new Error('Respuesta no válida del servidor de usuarios');
      }
      
      const totalUsuarios = usuariosData.success ? usuariosData.usuarios.length : 0;
      document.getElementById('total-usuarios-dash').textContent = totalUsuarios;

      // Get today's reservations
      const fechaHoy = new Date().toISOString().split('T')[0];
      const reservasResponse = await fetch(`${API_BASE_URL}/reservas.php?fecha=${fechaHoy}`);
      
      let reservasHoy = 0;
      let ingresos = 0;
      
      if (reservasResponse.ok) {
        const reservasText = await reservasResponse.text();
        try {
          const reservasData = JSON.parse(reservasText);
          if (reservasData.success && reservasData.reservas) {
            reservasHoy = reservasData.reservas.length;
            ingresos = reservasData.reservas.reduce((total, reserva) => total + parseFloat(reserva.precio || 0), 0);
          }
        } catch (e) {
          console.warn('Error parseando reservas, usando valores por defecto:', e.message);
        }
      } else {
        console.warn('No se pudieron cargar las reservas:', reservasResponse.status);
      }
      
      document.getElementById('total-reservas').textContent = reservasHoy;
      document.getElementById('ingresos-hoy').textContent = `S/ ${ingresos.toFixed(2)}`;

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Mostrar valores por defecto en caso de error
      document.getElementById('total-rutas-activas').textContent = '--';
      document.getElementById('total-usuarios-dash').textContent = '--';
      document.getElementById('total-reservas').textContent = '--';
      document.getElementById('ingresos-hoy').textContent = 'S/ --';
    }
  }

  async loadRecentActivity() {
    const activityContainer = document.getElementById('actividad-reciente');
    try {
      // Get recent reservations
      const response = await fetch(`${API_BASE_URL}/reservas.php?limit=10`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parseando actividad reciente:', responseText.substring(0, 200));
        throw new Error('Respuesta no válida del servidor');
      }
      if (data.success && data.reservas && data.reservas.length > 0) {
        const activitiesHtml = data.reservas.map(reserva => `
          <div class="activity-item d-flex align-items-center py-2 border-bottom">
            <div class="activity-icon me-3">
              <i class="fas fa-ticket-alt text-primary"></i>
            </div>
            <div class="activity-content flex-grow-1">
              <div class="activity-title">${reserva.usuario_nombre || 'Usuario'}</div>
              <div class="activity-desc text-muted small">
                Reservó viaje ${reserva.origen || 'N/A'} → ${reserva.destino || 'N/A'}
              </div>
            </div>
            <div class="activity-time text-muted small">
              ${this.formatTime(reserva.fecha_reserva)}
            </div>
          </div>
        `).join('');
        activityContainer.innerHTML = activitiesHtml;
      } else {
        activityContainer.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-info-circle fa-2x mb-2"></i>
            <p>No hay actividad reciente</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
      activityContainer.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-exclamation-triangle fa-2x mb-2 text-warning"></i>
          <p>No se pudo cargar la actividad reciente.</p>
          <small class="text-muted">Puede que el servidor de reservas esté en mantenimiento.</small>
        </div>
      `;
    }
  }

  loadSystemAlerts() {
    const alertsContainer = document.getElementById('alertas-sistema');
    
    // Check for system status and generate alerts
    const alerts = [];
    
    // Example alerts (you can implement real checks)
    alerts.push({
      type: 'info',
      icon: 'fas fa-info-circle',
      message: 'Sistema funcionando correctamente'
    });
    
    // Check if there are routes needing attention
    // This would be implemented based on your business logic
    
    if (alerts.length > 0) {
      const alertsHtml = alerts.map(alert => `
        <div class="alert alert-${alert.type} d-flex align-items-center">
          <i class="${alert.icon} me-2"></i>
          ${alert.message}
        </div>
      `).join('');
      
      alertsContainer.innerHTML = alertsHtml;
    } else {
      alertsContainer.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          No hay alertas del sistema
        </div>
      `;
    }
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins}min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString();
  }

  showAlert(message, type = 'info') {
    // Create and show a toast notification
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
           style="top: 80px; right: 20px; z-index: 9999; min-width: 300px;">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      const alert = document.querySelector('.alert.position-fixed');
      if (alert) {
        alert.remove();
      }
    }, 5000);
  }

  handleResize() {
    // Handle responsive behavior
    const sidebar = document.getElementById('adminSidebar');
    if (window.innerWidth >= 992) {
      // Desktop - show sidebar permanently
      const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebar);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
  }

  // Función de logout específica para admin
  logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Limpiar datos de sesión
      localStorage.removeItem('utptravel_session');
      localStorage.removeItem('utptoken');
      
      // Redirigir al login
      window.location.href = 'login.html';
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.AdminDashboard = new AdminDashboard();
});

// Función global de logout
function logout() {
  if (window.AdminDashboard) {
    window.AdminDashboard.logout();
  } else {
    // Fallback si AdminDashboard no está disponible
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      localStorage.removeItem('utptravel_session');
      localStorage.removeItem('utptoken');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminDashboard;
}

// Función global para procesar rutas vencidas
async function procesarRutasVencidasAutomatico() {
  try {
    const response = await fetch(`${API_BASE_URL}/rutas-concluidas.php`, {
      method: 'GET' // Este endpoint tiene funcionalidad para procesar rutas vencidas en GET
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Procesamiento completado: ${result.rutas_movidas || 0} rutas movidas al historial`);
      
      // Recargar datos del dashboard
      if (window.AdminDashboard) {
        window.AdminDashboard.loadDashboardData();
      }
    } else {
      alert('Error al procesar rutas vencidas: ' + (result.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error processing expired routes:', error);
    alert('Error de conexión al procesar rutas vencidas');
  }
}
