// sidebar-ui.js - Handles sidebar open/close UI logic

/**
 * Show the sidebar and overlay.
 */
function showSidebar() {
  const sidebar = document.getElementById('profile-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) { sidebar.classList.add('active'); }
  if (overlay) { overlay.classList.add('active'); }
  document.body.classList.add('sidebar-open');
}

/**
 * Hide the sidebar and overlay.
 */
function hideSidebar() {
  const sidebar = document.getElementById('profile-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) { sidebar.classList.remove('active'); }
  if (overlay) { overlay.classList.remove('active'); }
  document.body.classList.remove('sidebar-open');
}

document.addEventListener('DOMContentLoaded', function() {
  // Open sidebar on button click
  const btn = document.getElementById('profile-slider-btn');
  if (btn) btn.addEventListener('click', showSidebar);
  // Hide sidebar when clicking overlay or close button
  document.body.addEventListener('click', function(e) {
    if (e.target.id === 'sidebar-overlay' || e.target.id === 'sidebar-close-btn') {
      hideSidebar();
    }
  });
  // Hide sidebar on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideSidebar();
  });
});

        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        golden: {
                            light: '#e0c97f',
                            DEFAULT: '#a67c2e',
                            dark: '#7c5c1e'
                        },
                        cream: '#fffbe6',
                        darkbg: '#23201a'
                    },
                    fontFamily: {
                        'tajawal': ['Tajawal', 'sans-serif'],
                        'amiri': ['Amiri', 'serif']
                    }
                }
            }
        }

