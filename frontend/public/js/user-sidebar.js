// Lógica para el sidebar de usuario integrada con el sistema de autenticación

// Función para configurar eventos del sidebar
function setupSidebarEvents() {
  // Logout desde el sidebar
  const logoutBtn = document.getElementById('sidebarLogout');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Limpiar sesión y cerrar sesión usando auth
      if (window.auth && typeof auth.logout === 'function') {
        auth.logout();
        return;
      }
      
      // Ocultar sidebar
      const sidebar = document.getElementById('userSidebar');
      if (sidebar) {
        sidebar.classList.remove('show');
        sidebar.classList.add('hide');
      }
      
      // Restaurar contenido principal
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      if (header) header.style.marginLeft = '0';
      if (main) main.style.marginLeft = '0';
      if (footer) footer.style.marginLeft = '0';
      
      // Mostrar botón de login
      const loginLinks = document.querySelectorAll('a[href="login.html"]');
      loginLinks.forEach(link => {
        const listItem = link.closest('li');
        if (listItem) {
          listItem.style.display = 'block';
        }
      });
      
      // Redirigir a login
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 300);
    });
  } else {
    // Intentar nuevamente después de un momento
    setTimeout(setupSidebarEvents, 500);
  }
}

// Función para inicializar el sidebar (llamada desde el loader)
function initializeSidebar() {
  setupSidebarEvents();
}

// Configurar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupSidebarEvents, 100);
});

// Escuchar evento de sidebar cargado
document.addEventListener('sidebarLoaded', () => {
  setupSidebarEvents();
});
