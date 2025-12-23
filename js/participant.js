/**
 * ====================================
 * PARTICIPANT SERVICE
 * Handles participant management
 * ====================================
 */

const ParticipantService = {
    /**
     * Participant Statuses
     */
    STATUSES: {
        active: { label: 'Aktif', color: '#10b981' },
        eliminated: { label: 'Tereliminasi', color: '#ef4444' },
        withdrawn: { label: 'Mengundurkan Diri', color: '#64748b' }
    },

    /**
     * Get all participants for a tournament
     * @param {string} tournamentId - Tournament ID
     * @returns {Array} Participants
     */
    getByTournament(tournamentId) {
        return DB.find(DB.KEYS.PARTICIPANTS, { tournamentId })
            .sort((a, b) => (a.seed || 999) - (b.seed || 999));
    },

    /**
     * Get participant by ID
     * @param {string} id - Participant ID
     * @returns {Object|null} Participant
     */
    getById(id) {
        return DB.getById(DB.KEYS.PARTICIPANTS, id);
    },

    /**
     * Add participant to tournament
     * @param {string} tournamentId - Tournament ID
     * @param {Object} data - Participant data
     * @returns {Object} Created participant
     */
    add(tournamentId, data) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) {
            throw new Error('Tournament tidak ditemukan');
        }

        // Check if tournament accepts new participants
        if (tournament.status === 'ongoing' || tournament.status === 'completed') {
            throw new Error('Tournament sudah berjalan, tidak dapat menambah peserta');
        }

        // Check participant limit
        const currentCount = this.getByTournament(tournamentId).length;
        if (currentCount >= tournament.maxParticipants) {
            throw new Error(`Jumlah peserta sudah mencapai batas maksimal (${tournament.maxParticipants})`);
        }

        // Validate
        this.validate(data);

        // Check duplicate name
        const existing = this.getByTournament(tournamentId);
        if (existing.some(p => p.name.toLowerCase() === data.name.trim().toLowerCase())) {
            throw new Error('Nama peserta sudah digunakan');
        }

        const participant = DB.insert(DB.KEYS.PARTICIPANTS, {
            tournamentId,
            name: data.name.trim(),
            logo: data.logo || null,
            seed: data.seed || null,
            contactPerson: data.contactPerson?.trim() || null,
            email: data.email?.trim() || null,
            phone: data.phone?.trim() || null,
            status: 'active',
            eliminatedAtRound: null
        });

        console.log('✅ Participant added:', participant.name);
        return participant;
    },

    /**
     * Add multiple participants at once
     * @param {string} tournamentId - Tournament ID
     * @param {Array} participantsData - Array of participant data
     * @returns {Array} Created participants
     */
    addBulk(tournamentId, participantsData) {
        const results = [];
        const errors = [];

        participantsData.forEach((data, index) => {
            try {
                const participant = this.add(tournamentId, data);
                results.push(participant);
            } catch (e) {
                errors.push({ index, name: data.name, error: e.message });
            }
        });

        return { added: results, errors };
    },

    /**
     * Update participant
     * @param {string} id - Participant ID
     * @param {Object} data - Update data
     * @returns {Object} Updated participant
     */
    update(id, data) {
        const participant = this.getById(id);
        if (!participant) {
            throw new Error('Peserta tidak ditemukan');
        }

        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, participant.tournamentId);
        if (tournament.status === 'ongoing' || tournament.status === 'completed') {
            // Only allow limited updates during tournament
            const updates = {};
            if (data.logo !== undefined) updates.logo = data.logo;
            if (data.contactPerson !== undefined) updates.contactPerson = data.contactPerson;
            if (data.email !== undefined) updates.email = data.email;
            if (data.phone !== undefined) updates.phone = data.phone;
            return DB.update(DB.KEYS.PARTICIPANTS, id, updates);
        }

        // Check duplicate name
        if (data.name) {
            const existing = this.getByTournament(participant.tournamentId);
            if (existing.some(p => p.id !== id && p.name.toLowerCase() === data.name.trim().toLowerCase())) {
                throw new Error('Nama peserta sudah digunakan');
            }
        }

        const updates = {};
        if (data.name) updates.name = data.name.trim();
        if (data.logo !== undefined) updates.logo = data.logo;
        if (data.seed !== undefined) updates.seed = data.seed;
        if (data.contactPerson !== undefined) updates.contactPerson = data.contactPerson?.trim();
        if (data.email !== undefined) updates.email = data.email?.trim();
        if (data.phone !== undefined) updates.phone = data.phone?.trim();

        return DB.update(DB.KEYS.PARTICIPANTS, id, updates);
    },

    /**
     * Delete participant
     * @param {string} id - Participant ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const participant = this.getById(id);
        if (!participant) {
            throw new Error('Peserta tidak ditemukan');
        }

        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, participant.tournamentId);
        if (tournament.status === 'ongoing' || tournament.status === 'completed') {
            throw new Error('Tidak dapat menghapus peserta saat turnamen berlangsung');
        }

        // Remove from matches if already assigned
        const matches = DB.find(DB.KEYS.MATCHES, { tournamentId: participant.tournamentId });
        matches.forEach(match => {
            const updates = {};
            if (match.participant1Id === id) updates.participant1Id = null;
            if (match.participant2Id === id) updates.participant2Id = null;
            if (Object.keys(updates).length > 0) {
                DB.update(DB.KEYS.MATCHES, match.id, updates);
            }
        });

        const deleted = DB.delete(DB.KEYS.PARTICIPANTS, id);
        if (deleted) {
            console.log('🗑️ Participant deleted:', participant.name);
        }
        return deleted;
    },

    /**
     * Eliminate participant
     * @param {string} id - Participant ID
     * @param {number} round - Round eliminated at
     * @returns {Object} Updated participant
     */
    eliminate(id, round) {
        return DB.update(DB.KEYS.PARTICIPANTS, id, {
            status: 'eliminated',
            eliminatedAtRound: round
        });
    },

    /**
     * Withdraw participant from tournament
     * @param {string} id - Participant ID
     * @returns {Object} Updated participant
     */
    withdraw(id) {
        return DB.update(DB.KEYS.PARTICIPANTS, id, {
            status: 'withdrawn'
        });
    },

    /**
     * Validate participant data
     * @param {Object} data - Participant data
     * @throws {Error} If validation fails
     */
    validate(data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Nama peserta wajib diisi');
        }

        if (data.name.trim().length > 50) {
            throw new Error('Nama peserta maksimal 50 karakter');
        }

        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error('Format email tidak valid');
        }

        if (data.seed !== undefined && data.seed !== null) {
            if (!Number.isInteger(data.seed) || data.seed < 1) {
                throw new Error('Seed harus berupa angka positif');
            }
        }
    },

    /**
     * Check if email is valid
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Auto-assign seeds to participants
     * @param {string} tournamentId - Tournament ID
     * @param {string} method - 'random' or 'order'
     * @returns {Array} Updated participants
     */
    autoSeed(tournamentId, method = 'random') {
        const participants = this.getByTournament(tournamentId);

        let orderedParticipants;
        if (method === 'random') {
            orderedParticipants = this.shuffleArray([...participants]);
        } else {
            orderedParticipants = [...participants].sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        }

        orderedParticipants.forEach((p, index) => {
            DB.update(DB.KEYS.PARTICIPANTS, p.id, { seed: index + 1 });
        });

        return this.getByTournament(tournamentId);
    },

    /**
     * Shuffle array randomly
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * Parse CSV data to participants
     * @param {string} csvContent - CSV content
     * @returns {Array} Parsed participant data
     */
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV harus memiliki header dan minimal 1 data');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('nama');

        if (nameIndex === -1) {
            throw new Error('CSV harus memiliki kolom "name" atau "nama"');
        }

        const participants = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values[nameIndex]) {
                const participant = { name: values[nameIndex] };

                const emailIndex = headers.indexOf('email');
                if (emailIndex !== -1 && values[emailIndex]) {
                    participant.email = values[emailIndex];
                }

                const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'telepon');
                if (phoneIndex !== -1 && values[phoneIndex]) {
                    participant.phone = values[phoneIndex];
                }

                const contactIndex = headers.findIndex(h => h.includes('contact') || h.includes('kontak'));
                if (contactIndex !== -1 && values[contactIndex]) {
                    participant.contactPerson = values[contactIndex];
                }

                participants.push(participant);
            }
        }

        return participants;
    },

    /**
     * Get participant match history
     * @param {string} id - Participant ID
     * @returns {Array} Match history
     */
    getMatchHistory(id) {
        const participant = this.getById(id);
        if (!participant) return [];

        const matches = DB.find(DB.KEYS.MATCHES, { tournamentId: participant.tournamentId });

        return matches.filter(m =>
            m.participant1Id === id || m.participant2Id === id
        ).map(match => {
            const isParticipant1 = match.participant1Id === id;
            const opponent = isParticipant1
                ? this.getById(match.participant2Id)
                : this.getById(match.participant1Id);

            return {
                ...match,
                opponent,
                myScore: isParticipant1 ? match.score1 : match.score2,
                opponentScore: isParticipant1 ? match.score2 : match.score1,
                won: match.winnerId === id
            };
        }).sort((a, b) => a.round - b.round);
    }
};
