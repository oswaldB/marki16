// Marki Sidebar — Web Component sans Shadow DOM
// Utilise AlpineJS via x-data sur le WC lui-même

class MarkiSidebar extends HTMLElement {
  connectedCallback() {
    const user = Parse.User.current();
    const userName = user ? (user.get('nom') || user.get('username') || 'Utilisateur') : 'Invité';
    const userEmail = user ? (user.get('email') || '') : '';
    const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const pathname = window.location.pathname;
    const pathnameParts = pathname.split('/');
    const isActive = (screen) => pathnameParts.includes(screen);

    const navItems = [
      { key: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', href: '../dashboard/index.html' },
      { key: 'impayes', label: 'Impayés', icon: 'fa-file-invoice-dollar', href: '../impayes/index.html' },
      { key: 'impayes-suspendus', label: 'Suspendus', icon: 'fa-pause', href: '../impayes-suspendus/index.html' },
      { key: 'recalcitrants', label: 'Récalcitrants', icon: 'fa-triangle-exclamation', href: '../recalcitrants/index.html' },
      { key: 'relances', label: 'Relances', icon: 'fa-envelope', href: '../relances/index.html' },
      { key: 'relances-manuelles', label: 'Rel. manuelles', icon: 'fa-pen-to-square', href: '../relances-manuelles/index.html' },
      { key: 'sequences', label: 'Séquences', icon: 'fa-layer-group', href: '../sequences/index.html' },
      { key: 'contacts', label: 'Contacts', icon: 'fa-address-book', href: '../contacts/index.html' },
      { key: 'contacts-sans-email', label: 'Sans email', icon: 'fa-envelope-open', href: '../contacts-sans-email/index.html' },
      { key: 'blacklist', label: 'Blacklist', icon: 'fa-ban', href: '../blacklist/index.html' },
      { key: 'activites', label: 'Activités', icon: 'fa-clock-rotate-left', href: '../activites/index.html' },
      { key: 'audit', label: 'Audit', icon: 'fa-magnifying-glass-chart', href: '../audit/index.html' },
      { key: 'a-corriger', label: 'À corriger', icon: 'fa-wrench', href: '../a-corriger/index.html' },
    ];

    const settingsItems = [
      { key: 'settings-smtp', label: 'SMTP', icon: 'fa-server', href: '../settings-smtp/index.html' },
      { key: 'settings-utilisateurs', label: 'Utilisateurs', icon: 'fa-users', href: '../settings-utilisateurs/index.html' },
    ];

    const baseLinkClass = 'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors';
    const inactiveClass = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
    const activeClass = 'bg-sky-50 text-sky-700';

    const buildLink = (item) => {
      const active = isActive(item.key) ? activeClass : inactiveClass;
      return `<a href="${item.href}" class="${baseLinkClass} ${active}">
        <i class="fa-solid ${item.icon} w-4 text-center text-xs"></i>
        <span>${item.label}</span>
      </a>`;
    };

    const desktopNav = navItems.map(buildLink).join('');
    const settingsNav = settingsItems.map(buildLink).join('');

    // Mobile dock: primary + scrollable
    const mobileDockItems = [
      navItems[0], // dashboard
      navItems[1], // impayes
      navItems[4], // relances
      navItems[6], // sequences
      navItems[7], // contacts
      { key: 'settings-smtp', label: 'Paramètres', icon: 'fa-gear', href: '../settings-smtp/index.html' },
    ];

    const mobileDock = mobileDockItems.map(item => {
      const active = isActive(item.key) ? 'text-sky-600' : 'text-gray-400';
      return `<a href="${item.href}" class="flex flex-col items-center justify-center gap-1 px-2 py-1 ${active}">
        <i class="fa-solid ${item.icon} text-sm"></i>
        <span class="text-[10px] leading-tight">${item.label}</span>
      </a>`;
    }).join('');

    this.setAttribute('x-data', `{
      logout() {
        Parse.User.logOut().then(() => {
          window.location.href = '../login/index.html';
        }).catch(() => {
          window.location.href = '../login/index.html';
        });
      }
    }`);

    this.innerHTML = `
      <!-- Desktop Sidebar -->
      <aside class="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
        <!-- Logo -->
        <div class="p-4 border-b border-gray-100">
          <a href="../dashboard/index.html" class="flex items-center gap-2">
            <img src="/2/assets/img/marki-logo.png" alt="Marki" class="h-8 w-auto">
          </a>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto p-2 space-y-0.5">
          ${desktopNav}

          <div class="pt-4 pb-1 px-3">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paramètres</p>
          </div>
          ${settingsNav}
        </nav>

        <!-- User Footer -->
        <div class="p-3 border-t border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              ${initials}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">${userName}</p>
              <p class="text-xs text-gray-500 truncate">${userEmail}</p>
            </div>
            <button @click="logout" title="Déconnexion" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Mobile Bottom Dock -->
      <nav class="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 items-center justify-around overflow-x-auto">
        ${mobileDock}
      </nav>
    `;
  }
}

customElements.define('marki-sidebar', MarkiSidebar);
