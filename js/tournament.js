/**
 * ====================================
 * TOURNAMENT SERVICE
 * Handles tournament CRUD operations
 * ====================================
 */

const TournamentService = {
    /**
     * Tournament Types
     */
    TYPES: {
        futsal: { label: 'Futsal', icon: '⚽', color: '#10b981' },
        esport: { label: 'E-Sport', icon: '🎮', color: '#8b5cf6' },
        chess: { label: 'Catur', icon: '♟️', color: '#64748b' },
        custom: { label: 'Custom', icon: '🏆', color: '#3b82f6' }
    },

    /**
     * Tournament Statuses
     */
    STATUSES: {
        draft: { label: 'Draft', color: '#64748b' },
        registration: { label: 'Pendaftaran', color: '#3b82f6' },
        ongoing: { label: 'Berlangsung', color: '#10b981' },
        completed: { label: 'Selesai', color: '#fbbf24' }
    },

    /**
     * Valid participant counts (must be power of 2)
     */
    VALID_COUNTS: [4, 8, 16, 32, 64],

    /**
     * Get all tournaments
     * @returns {Array} All tournaments
     */
    getAll() {
        return DB.getAll(DB.KEYS.TOURNAMENTS);
    },

    /**
     * Get tournament by ID with related data
     * @param {string} id - Tournament ID
     * @returns {Object|null} Tournament with participants and matches
     */
    getById(id) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, id);
        if (!tournament) return null;

        // Load related data
        tournament.participants = DB.find(DB.KEYS.PARTICIPANTS, { tournamentId: id });
        tournament.matches = DB.find(DB.KEYS.MATCHES, { tournamentId: id })
            .sort((a, b) => {
                if (a.round !== b.round) return a.round - b.round;
                return a.matchNumber - b.matchNumber;
            });
        tournament.result = DB.find(DB.KEYS.RESULTS, { tournamentId: id })[0] || null;

        return tournament;
    },

    /**
     * Create new tournament
     * @param {Object} data - Tournament data
     * @returns {Object} Created tournament
     */
    create(data) {
        // Validate
        this.validate(data);

        // Calculate total rounds based on participant count
        const totalRounds = Math.log2(data.participantCount);

        // Generate admin token for authentication
        const adminToken = this.generateAdminToken();

        const tournament = DB.insert(DB.KEYS.TOURNAMENTS, {
            name: data.name.trim(),
            type: data.type,
            status: 'draft',
            participantCount: data.participantCount,
            maxParticipants: data.participantCount,
            currentRound: 1,
            totalRounds: totalRounds,
            description: data.description?.trim() || '',
            rules: data.rules?.trim() || '',
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            adminPassword: data.adminPassword || null,
            adminToken: adminToken
        });

        // Store admin token in session for this tournament
        this.setAdminSession(tournament.id, adminToken);

        console.log('✅ Tournament created:', tournament.name);
        return tournament;
    },

    /**
     * Generate random admin token
     * @returns {string} Admin token
     */
    generateAdminToken() {
        return 'admin_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 12);
    },

    /**
     * Set admin session for a tournament
     * @param {string} tournamentId - Tournament ID
     * @param {string} token - Admin token
     */
    setAdminSession(tournamentId, token) {
        const sessions = JSON.parse(sessionStorage.getItem('tb_admin_sessions') || '{}');
        sessions[tournamentId] = token;
        sessionStorage.setItem('tb_admin_sessions', JSON.stringify(sessions));
    },

    /**
     * Check if current user is admin for tournament
     * @param {string} tournamentId - Tournament ID
     * @returns {boolean} Is admin
     */
    isAdmin(tournamentId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) return false;

        // If no password set, allow all (for backward compatibility)
        if (!tournament.adminPassword) return true;

        const sessions = JSON.parse(sessionStorage.getItem('tb_admin_sessions') || '{}');
        return sessions[tournamentId] === tournament.adminToken;
    },

    /**
     * Authenticate as admin with password
     * @param {string} tournamentId - Tournament ID
     * @param {string} password - Admin password
     * @returns {boolean} Authentication success
     */
    authenticate(tournamentId, password) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) return false;

        if (tournament.adminPassword === password) {
            this.setAdminSession(tournamentId, tournament.adminToken);
            return true;
        }
        return false;
    },

    /**
     * Logout admin session for tournament
     * @param {string} tournamentId - Tournament ID
     */
    logoutAdmin(tournamentId) {
        const sessions = JSON.parse(sessionStorage.getItem('tb_admin_sessions') || '{}');
        delete sessions[tournamentId];
        sessionStorage.setItem('tb_admin_sessions', JSON.stringify(sessions));
    },

    /**
     * Set or update admin password
     * @param {string} tournamentId - Tournament ID
     * @param {string} newPassword - New password
     * @returns {Object} Updated tournament
     */
    setAdminPassword(tournamentId, newPassword) {
        if (!this.isAdmin(tournamentId)) {
            throw new Error('Unauthorized: Anda bukan admin turnamen ini');
        }

        const adminToken = this.generateAdminToken();
        const updated = DB.update(DB.KEYS.TOURNAMENTS, tournamentId, {
            adminPassword: newPassword,
            adminToken: adminToken
        });

        this.setAdminSession(tournamentId, adminToken);
        return updated;
    },

    /**
     * Update tournament
     * @param {string} id - Tournament ID
     * @param {Object} data - Update data
     * @returns {Object} Updated tournament
     */
    update(id, data) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, id);
        if (!tournament) {
            throw new Error('Tournament tidak ditemukan');
        }

        // Don't allow changing participant count if bracket already generated
        if (data.participantCount && tournament.status !== 'draft') {
            throw new Error('Tidak dapat mengubah jumlah peserta setelah bracket dibuat');
        }

        const updates = {};

        if (data.name) updates.name = data.name.trim();
        if (data.type) updates.type = data.type;
        if (data.description !== undefined) updates.description = data.description.trim();
        if (data.rules !== undefined) updates.rules = data.rules.trim();
        if (data.startDate !== undefined) updates.startDate = data.startDate;
        if (data.endDate !== undefined) updates.endDate = data.endDate;
        if (data.participantCount) {
            updates.participantCount = data.participantCount;
            updates.maxParticipants = data.participantCount;
            updates.totalRounds = Math.log2(data.participantCount);
        }

        return DB.update(DB.KEYS.TOURNAMENTS, id, updates);
    },

    /**
     * Delete tournament and all related data
     * @param {string} id - Tournament ID
     * @returns {boolean} Success status
     */
    delete(id) {
        // Delete related data first
        DB.deleteWhere(DB.KEYS.PARTICIPANTS, { tournamentId: id });
        DB.deleteWhere(DB.KEYS.MATCHES, { tournamentId: id });
        DB.deleteWhere(DB.KEYS.RESULTS, { tournamentId: id });

        // Delete tournament
        const deleted = DB.delete(DB.KEYS.TOURNAMENTS, id);
        if (deleted) {
            console.log('🗑️ Tournament deleted:', id);
        }
        return deleted;
    },

    /**
     * Update tournament status
     * @param {string} id - Tournament ID
     * @param {string} status - New status
     * @returns {Object} Updated tournament
     */
    updateStatus(id, status) {
        if (!this.STATUSES[status]) {
            throw new Error('Status tidak valid');
        }
        return DB.update(DB.KEYS.TOURNAMENTS, id, { status });
    },

    /**
     * Validate tournament data
     * @param {Object} data - Tournament data
     * @throws {Error} If validation fails
     */
    validate(data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Nama turnamen wajib diisi');
        }

        if (data.name.trim().length > 100) {
            throw new Error('Nama turnamen maksimal 100 karakter');
        }

        if (!data.type || !this.TYPES[data.type]) {
            throw new Error('Jenis turnamen tidak valid');
        }

        if (!data.participantCount || !this.VALID_COUNTS.includes(data.participantCount)) {
            throw new Error('Jumlah peserta harus 4, 8, 16, 32, atau 64');
        }

        if (data.startDate && data.endDate) {
            if (new Date(data.startDate) > new Date(data.endDate)) {
                throw new Error('Tanggal mulai tidak boleh setelah tanggal selesai');
            }
        }
    },

    /**
     * Check if tournament can start
     * @param {string} id - Tournament ID
     * @returns {Object} { canStart: boolean, reason?: string }
     */
    canStart(id) {
        const tournament = this.getById(id);
        if (!tournament) {
            return { canStart: false, reason: 'Tournament tidak ditemukan' };
        }

        if (tournament.status !== 'registration') {
            return { canStart: false, reason: 'Bracket belum di-generate' };
        }

        const participantCount = tournament.participants.length;
        if (participantCount < tournament.participantCount) {
            return {
                canStart: false,
                reason: `Peserta belum lengkap (${participantCount}/${tournament.participantCount})`
            };
        }

        return { canStart: true };
    },

    /**
     * Start tournament
     * @param {string} id - Tournament ID
     * @returns {Object} Updated tournament
     */
    start(id) {
        const check = this.canStart(id);
        if (!check.canStart) {
            throw new Error(check.reason);
        }

        // Assign participants to bracket
        BracketService.assignParticipants(id);

        return DB.update(DB.KEYS.TOURNAMENTS, id, {
            status: 'ongoing',
            startDate: new Date().toISOString().split('T')[0]
        });
    },

    /**
     * Get tournament statistics
     * @param {string} id - Tournament ID
     * @returns {Object} Statistics
     */
    getStats(id) {
        const tournament = this.getById(id);
        if (!tournament) return null;

        const matches = tournament.matches;
        const completedMatches = matches.filter(m => m.status === 'completed');

        let totalGoals = 0;
        let highestScore = { match: null, total: 0 };

        completedMatches.forEach(match => {
            const total = (match.score1 || 0) + (match.score2 || 0);
            totalGoals += total;
            if (total > highestScore.total) {
                highestScore = { match, total };
            }
        });

        return {
            totalParticipants: tournament.participants.length,
            totalMatches: matches.length,
            completedMatches: completedMatches.length,
            pendingMatches: matches.length - completedMatches.length,
            currentRound: tournament.currentRound,
            totalRounds: tournament.totalRounds,
            totalGoals,
            highestScoreMatch: highestScore.match,
            progress: Math.round((completedMatches.length / matches.length) * 100) || 0
        };
    },

    /**
     * Get recent tournaments
     * @param {number} limit - Max number to return
     * @returns {Array} Recent tournaments
     */
    getRecent(limit = 5) {
        return this.getAll()
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, limit);
    },

    /**
     * Get tournaments by status
     * @param {string} status - Status filter
     * @returns {Array} Filtered tournaments
     */
    getByStatus(status) {
        return DB.find(DB.KEYS.TOURNAMENTS, { status });
    },

    /**
     * Search tournaments
     * @param {string} query - Search query
     * @returns {Array} Matching tournaments
     */
    search(query) {
        const q = query.toLowerCase().trim();
        return this.getAll().filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
        );
    }
};
