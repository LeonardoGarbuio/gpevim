/**
 * GPEVIM - Script JavaScript para funcionalidades da página
 * Autor: Sistema de melhorias
 * Data: 2025
 */

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
  
  // === MENU RESPONSIVO ===
  const menuToggle = document.querySelector('.menu-toggle');
  const menuList = document.getElementById('menu-list');

  // Verifica se os elementos existem antes de adicionar eventos
  if (menuToggle && menuList) {
    
    // Toggle do menu mobile
    menuToggle.addEventListener('click', function() {
      const isExpanded = menuList.classList.contains('active');
      
      menuList.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      menuToggle.setAttribute('aria-label', isExpanded ? 'Abrir menu' : 'Fechar menu');
    });

    // Fechar menu ao clicar em qualquer link do menu (mobile)
    document.querySelectorAll('.navbar a').forEach(link => {
      link.addEventListener('click', () => {
        menuList.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
      });
    });

    // Fechar menu ao redimensionar janela para desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        menuList.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
      }
    });

    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && menuList.classList.contains('active')) {
        menuList.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        menuToggle.focus(); // Retorna foco para o botão
      }
    });
  }

  // === MELHORIAS DE ACESSIBILIDADE ===
  
  // Adiciona indicadores visuais para navegação por teclado
  document.querySelectorAll('a, button').forEach(element => {
    element.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        this.click();
      }
    });
  });

  // === SMOOTH SCROLL PARA LINKS INTERNOS ===
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // === FEEDBACK VISUAL PARA LINKS EXTERNOS ===
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', function() {
      // Pequena animação de feedback
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 100);
    });
  });

  // === PERFORMANCE E OTIMIZAÇÕES ===
  
  // Debounce para evento de resize
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Aplica debounce no resize
  const debouncedResize = debounce(() => {
    if (window.innerWidth > 768 && menuList && menuList.classList.contains('active')) {
      menuList.classList.remove('active');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
      }
    }
  }, 250);

  window.addEventListener('resize', debouncedResize);

  // === INICIALIZAÇÃO ===
  console.log('GPEVIM - Script carregado com sucesso!');
  
 
});




