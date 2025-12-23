/**
 * ====================================
 * UI HELPERS & UTILITIES
 * Common UI functions and components
 * ====================================
 */

const UI = {
    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms
     */
    toast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(t => t.remove());

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        // Add styles if not exist
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-weight: 500;
                    font-size: 14px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    z-index: 9999;
                    animation: toastSlideIn 0.3s ease;
                    max-width: 400px;
                }
                .toast-notification.toast-out {
                    animation: toastSlideOut 0.3s ease forwards;
                }
                .toast-success { background: #10b981; color: white; }
                .toast-error { background: #ef4444; color: white; }
                .toast-warning { background: #f59e0b; color: white; }
                .toast-info { background: #3b82f6; color: white; }
                .toast-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    font-size: 12px;
                }
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show loading overlay
     * @param {boolean} show - Show or hide
     * @param {string} message - Loading message
     */
    loading(show, message = 'Loading...') {
        let overlay = document.querySelector('.loading-overlay');

        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <p class="loading-message">${message}</p>
                    </div>
                `;

                // Add styles
                if (!document.querySelector('#loading-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'loading-styles';
                    styles.textContent = `
                        .loading-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0,0,0,0.6);
                            backdrop-filter: blur(4px);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                        }
                        .loading-content {
                            text-align: center;
                            color: white;
                        }
                        .loading-spinner {
                            width: 50px;
                            height: 50px;
                            border: 4px solid rgba(255,255,255,0.2);
                            border-top-color: #fbbf24;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 16px;
                        }
                        .loading-message {
                            font-size: 16px;
                            opacity: 0.9;
                        }
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(styles);
                }

                document.body.appendChild(overlay);
            }
        } else {
            if (overlay) {
                overlay.remove();
            }
        }
    },

    /**
     * Show confirmation dialog
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} User's choice
     */
    confirm(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Konfirmasi',
                message = 'Apakah Anda yakin?',
                confirmText = 'Ya',
                cancelText = 'Batal',
                type = 'warning'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.innerHTML = `
                <div class="modal" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p style="margin: 0; color: var(--gray-600);">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" data-action="cancel">${cancelText}</button>
                        <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const handleClick = (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    overlay.remove();
                } else if (action === 'cancel') {
                    resolve(false);
                    overlay.remove();
                }
            };

            overlay.addEventListener('click', handleClick);
        });
    },

    /**
     * Format date to locale string
     * @param {string} date - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * Format datetime to locale string
     * @param {string} datetime - ISO datetime string
     * @returns {string} Formatted datetime
     */
    formatDateTime(datetime) {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get initials from name
     * @param {string} name - Full name
     * @returns {string} Initials (max 2 chars)
     */
    getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    /**
     * Render tournament type badge
     * @param {string} type - Tournament type
     * @returns {string} HTML string
     */
    renderTypeBadge(type) {
        const typeData = TournamentService.TYPES[type] || TournamentService.TYPES.custom;
        return `<span class="badge badge-primary">${typeData.icon} ${typeData.label}</span>`;
    },

    /**
     * Render tournament status badge
     * @param {string} status - Tournament status
     * @returns {string} HTML string
     */
    renderStatusBadge(status) {
        return `<span class="status-badge status-${status}">${TournamentService.STATUSES[status]?.label || status}</span>`;
    },

    /**
     * Render participant avatar
     * @param {Object} participant - Participant object
     * @param {string} size - 'sm', 'md', 'lg'
     * @returns {string} HTML string
     */
    renderAvatar(participant, size = 'md') {
        if (!participant) {
            return `<div class="team-logo ${size}"><span class="text-muted">?</span></div>`;
        }

        if (participant.logo) {
            return `<div class="team-logo ${size}"><img src="${participant.logo}" alt="${participant.name}"></div>`;
        }

        return `<div class="team-logo ${size}">${this.getInitials(participant.name)}</div>`;
    },

    /**
     * Open modal by ID
     * @param {string} modalId - Modal element ID
     */
    openModal(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close modal by ID
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    /**
     * Navigate to page
     * @param {string} page - Page filename
     * @param {Object} params - URL parameters
     */
    navigate(page, params = {}) {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        const url = queryString ? `${page}?${queryString}` : page;
        window.location.href = url;
    },

    /**
     * Get URL parameter
     * @param {string} name - Parameter name
     * @returns {string|null} Parameter value
     */
    getParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Animate element
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation class name
     */
    animate(element, animation) {
        element.classList.add(`animate-${animation}`);
        element.addEventListener('animationend', () => {
            element.classList.remove(`animate-${animation}`);
        }, { once: true });
    },

    /**
     * Scroll to element
     * @param {string} selector - Element selector
     * @param {Object} options - Scroll options
     */
    scrollTo(selector, options = {}) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                ...options
            });
        }
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.toast('Berhasil disalin!', 'success');
            return true;
        } catch (err) {
            this.toast('Gagal menyalin', 'error');
            return false;
        }
    },

    /**
     * Generate random color
     * @returns {string} Hex color
     */
    randomColor() {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16',
            '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
            '#d946ef', '#ec4899', '#f43f5e'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// Initialize modal close on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (e.target.classList.contains('modal-close')) {
        const overlay = e.target.closest('.modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Initialize escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        UI.closeAllModals();
    }
});
