/**
 * ====================================
 * BRACKET GENERATOR SERVICE
 * Core bracket generation algorithm
 * ====================================
 */

const BracketService = {
    /**
     * Match Statuses
     */
    STATUSES: {
        pending: { label: 'Pending', color: '#64748b' },
        upcoming: { label: 'Upcoming', color: '#3b82f6' },
        live: { label: 'Live', color: '#ef4444' },
        completed: { label: 'Selesai', color: '#10b981' }
    },

    /**
     * Round Names
     */
    getRoundName(round, totalRounds) {
        const roundsFromEnd = totalRounds - round;

        switch (roundsFromEnd) {
            case 0: return 'Final';
            case 1: return 'Semi Final';
            case 2: return 'Quarter Final';
            case 3: return 'Round of 16';
            case 4: return 'Round of 32';
            case 5: return 'Round of 64';
            default: return `Round ${round}`;
        }
    },

    /**
     * Check if number is power of 2
     * @param {number} n - Number to check
     * @returns {boolean} Is power of 2
     */
    isPowerOfTwo(n) {
        return n > 0 && (n & (n - 1)) === 0;
    },

    /**
     * Generate bracket structure for tournament
     * @param {string} tournamentId - Tournament ID
     * @returns {Array} Generated matches
     */
    generate(tournamentId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) {
            throw new Error('Tournament tidak ditemukan');
        }

        if (tournament.status !== 'draft') {
            throw new Error('Bracket sudah di-generate');
        }

        const participantCount = tournament.participantCount;

        if (!this.isPowerOfTwo(participantCount)) {
            throw new Error('Jumlah peserta harus kelipatan 2 (4, 8, 16, 32, 64)');
        }

        const totalRounds = Math.log2(participantCount);
        const matches = [];
        let matchNumber = 1;

        // Generate matches for each round
        for (let round = 1; round <= totalRounds; round++) {
            const matchesInRound = participantCount / Math.pow(2, round);

            for (let i = 0; i < matchesInRound; i++) {
                const match = DB.insert(DB.KEYS.MATCHES, {
                    tournamentId,
                    round,
                    matchNumber: matchNumber++,
                    participant1Id: null,
                    participant2Id: null,
                    winnerId: null,
                    score1: null,
                    score2: null,
                    status: 'pending',
                    schedule: null,
                    venue: null,
                    notes: null
                });
                matches.push(match);
            }
        }

        // Update tournament status
        DB.update(DB.KEYS.TOURNAMENTS, tournamentId, {
            status: 'registration',
            totalRounds
        });

        console.log(`✅ Bracket generated: ${matches.length} matches in ${totalRounds} rounds`);
        return matches;
    },

    /**
     * Assign participants to first round matches
     * @param {string} tournamentId - Tournament ID
     * @returns {Array} Updated matches
     */
    assignParticipants(tournamentId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) {
            throw new Error('Tournament tidak ditemukan');
        }

        const participants = ParticipantService.getByTournament(tournamentId);
        if (participants.length !== tournament.participantCount) {
            throw new Error(`Jumlah peserta tidak sesuai (${participants.length}/${tournament.participantCount})`);
        }

        // Get first round matches
        const firstRoundMatches = DB.find(DB.KEYS.MATCHES, { tournamentId, round: 1 })
            .sort((a, b) => a.matchNumber - b.matchNumber);

        // Sort participants by seed (seeded participants first)
        const sortedParticipants = [...participants].sort((a, b) => {
            if (a.seed && b.seed) return a.seed - b.seed;
            if (a.seed) return -1;
            if (b.seed) return 1;
            return 0;
        });

        // Standard seeding pattern for single elimination
        // Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc.
        const pairedParticipants = this.createSeedPairings(sortedParticipants);

        // Assign to matches
        pairedParticipants.forEach((pair, index) => {
            if (firstRoundMatches[index]) {
                DB.update(DB.KEYS.MATCHES, firstRoundMatches[index].id, {
                    participant1Id: pair[0].id,
                    participant2Id: pair[1].id,
                    status: 'upcoming'
                });
            }
        });

        console.log('✅ Participants assigned to bracket');
        return DB.find(DB.KEYS.MATCHES, { tournamentId, round: 1 });
    },

    /**
     * Create seed pairings (1 vs N, 2 vs N-1, etc.)
     * @param {Array} participants - Sorted participants
     * @returns {Array} Paired participants
     */
    createSeedPairings(participants) {
        const n = participants.length;
        const pairs = [];

        for (let i = 0; i < n / 2; i++) {
            pairs.push([participants[i], participants[n - 1 - i]]);
        }

        return pairs;
    },

    /**
     * Get bracket data organized by rounds
     * @param {string} tournamentId - Tournament ID
     * @returns {Object} Bracket data
     */
    getBracket(tournamentId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) return null;

        const matches = DB.find(DB.KEYS.MATCHES, { tournamentId })
            .sort((a, b) => {
                if (a.round !== b.round) return a.round - b.round;
                return a.matchNumber - b.matchNumber;
            });

        // Group by round
        const rounds = {};
        matches.forEach(match => {
            if (!rounds[match.round]) {
                rounds[match.round] = {
                    round: match.round,
                    name: this.getRoundName(match.round, tournament.totalRounds),
                    matches: []
                };
            }

            // Add participant data to match
            const matchData = {
                ...match,
                participant1: match.participant1Id
                    ? ParticipantService.getById(match.participant1Id)
                    : null,
                participant2: match.participant2Id
                    ? ParticipantService.getById(match.participant2Id)
                    : null,
                winner: match.winnerId
                    ? ParticipantService.getById(match.winnerId)
                    : null
            };

            rounds[match.round].matches.push(matchData);
        });

        // Get champion if tournament completed
        let champion = null;
        if (tournament.status === 'completed') {
            const result = DB.find(DB.KEYS.RESULTS, { tournamentId })[0];
            if (result) {
                champion = ParticipantService.getById(result.championId);
            }
        }

        return {
            tournament,
            rounds: Object.values(rounds),
            totalRounds: tournament.totalRounds,
            champion
        };
    },

    /**
     * Get match by ID with full data
     * @param {string} matchId - Match ID
     * @returns {Object} Match with participant data
     */
    getMatch(matchId) {
        const match = DB.getById(DB.KEYS.MATCHES, matchId);
        if (!match) return null;

        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, match.tournamentId);

        return {
            ...match,
            roundName: this.getRoundName(match.round, tournament.totalRounds),
            participant1: match.participant1Id
                ? ParticipantService.getById(match.participant1Id)
                : null,
            participant2: match.participant2Id
                ? ParticipantService.getById(match.participant2Id)
                : null,
            winner: match.winnerId
                ? ParticipantService.getById(match.winnerId)
                : null,
            tournament
        };
    },

    /**
     * Update match schedule and details
     * @param {string} matchId - Match ID
     * @param {Object} data - Update data
     * @returns {Object} Updated match
     */
    updateMatch(matchId, data) {
        const match = DB.getById(DB.KEYS.MATCHES, matchId);
        if (!match) {
            throw new Error('Match tidak ditemukan');
        }

        const updates = {};
        if (data.schedule !== undefined) updates.schedule = data.schedule;
        if (data.venue !== undefined) updates.venue = data.venue;
        if (data.notes !== undefined) updates.notes = data.notes;
        if (data.status !== undefined) updates.status = data.status;

        return DB.update(DB.KEYS.MATCHES, matchId, updates);
    },

    /**
     * Update match score and determine winner
     * @param {string} matchId - Match ID
     * @param {number} score1 - Participant 1 score
     * @param {number} score2 - Participant 2 score
     * @returns {Object} Updated match
     */
    updateScore(matchId, score1, score2) {
        const match = DB.getById(DB.KEYS.MATCHES, matchId);
        if (!match) {
            throw new Error('Match tidak ditemukan');
        }

        if (match.status === 'pending') {
            throw new Error('Match belum siap dimainkan');
        }

        if (!match.participant1Id || !match.participant2Id) {
            throw new Error('Peserta belum lengkap');
        }

        // Validate scores
        if (score1 < 0 || score2 < 0) {
            throw new Error('Skor tidak boleh negatif');
        }

        if (score1 === score2) {
            throw new Error('Skor tidak boleh sama (seri). Tentukan pemenang.');
        }

        // Determine winner
        const winnerId = score1 > score2 ? match.participant1Id : match.participant2Id;
        const loserId = score1 > score2 ? match.participant2Id : match.participant1Id;

        // Update match
        DB.update(DB.KEYS.MATCHES, matchId, {
            score1,
            score2,
            winnerId,
            status: 'completed'
        });

        // Eliminate loser
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, match.tournamentId);
        ParticipantService.eliminate(loserId, match.round);

        // Advance winner to next round
        this.advanceWinner(match, winnerId);

        // Check if tournament is complete
        if (match.round === tournament.totalRounds) {
            this.finalizeTournament(match.tournamentId, winnerId, loserId);
        } else {
            // Update current round if all matches in this round are complete
            this.updateCurrentRound(match.tournamentId);
        }

        console.log('✅ Score updated, winner advanced');
        return this.getMatch(matchId);
    },

    /**
     * Advance winner to next round
     * @param {Object} match - Current match
     * @param {string} winnerId - Winner participant ID
     */
    advanceWinner(match, winnerId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, match.tournamentId);
        const nextRound = match.round + 1;

        // No next round for final
        if (nextRound > tournament.totalRounds) {
            return;
        }

        // Calculate position in next round
        // Matches 1-2 go to Match 1 of next round
        // Matches 3-4 go to Match 2 of next round, etc.
        const firstMatchOfRound = DB.find(DB.KEYS.MATCHES, { tournamentId: match.tournamentId, round: 1 })
            .sort((a, b) => a.matchNumber - b.matchNumber)[0];

        const matchIndexInRound = match.matchNumber - this.getFirstMatchNumberOfRound(match.tournamentId, match.round);
        const nextMatchIndex = Math.floor(matchIndexInRound / 2);
        const nextMatchNumber = this.getFirstMatchNumberOfRound(match.tournamentId, nextRound) + nextMatchIndex;

        // Find next round match
        const nextMatches = DB.find(DB.KEYS.MATCHES, {
            tournamentId: match.tournamentId,
            round: nextRound
        }).sort((a, b) => a.matchNumber - b.matchNumber);

        const nextMatch = nextMatches[nextMatchIndex];

        if (!nextMatch) {
            console.error('Next match not found');
            return;
        }

        // Assign to correct slot
        const updates = {};
        if (matchIndexInRound % 2 === 0) {
            updates.participant1Id = winnerId;
        } else {
            updates.participant2Id = winnerId;
        }

        // Update status if both participants are set
        const currentData = DB.getById(DB.KEYS.MATCHES, nextMatch.id);
        const updatedData = { ...currentData, ...updates };

        if (updatedData.participant1Id && updatedData.participant2Id) {
            updates.status = 'upcoming';
        }

        DB.update(DB.KEYS.MATCHES, nextMatch.id, updates);
    },

    /**
     * Get first match number of a round
     * @param {string} tournamentId - Tournament ID
     * @param {number} round - Round number
     * @returns {number} First match number
     */
    getFirstMatchNumberOfRound(tournamentId, round) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        const participantCount = tournament.participantCount;

        let matchNumber = 1;
        for (let r = 1; r < round; r++) {
            matchNumber += participantCount / Math.pow(2, r);
        }
        return matchNumber;
    },

    /**
     * Update tournament's current round
     * @param {string} tournamentId - Tournament ID
     */
    updateCurrentRound(tournamentId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        const matches = DB.find(DB.KEYS.MATCHES, { tournamentId });

        // Find the first round with incomplete matches
        for (let round = 1; round <= tournament.totalRounds; round++) {
            const roundMatches = matches.filter(m => m.round === round);
            const allCompleted = roundMatches.every(m => m.status === 'completed');

            if (!allCompleted) {
                if (tournament.currentRound !== round) {
                    DB.update(DB.KEYS.TOURNAMENTS, tournamentId, { currentRound: round });
                }
                return;
            }
        }
    },

    /**
     * Finalize tournament when champion is determined
     * @param {string} tournamentId - Tournament ID
     * @param {string} championId - Champion participant ID
     * @param {string} runnerUpId - Runner-up participant ID
     */
    finalizeTournament(tournamentId, championId, runnerUpId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        const matches = DB.find(DB.KEYS.MATCHES, { tournamentId });

        // Find third place (semi-final losers)
        const semiFinalMatches = matches.filter(m => m.round === tournament.totalRounds - 1);
        const thirdPlaceIds = semiFinalMatches
            .filter(m => m.winnerId)
            .map(m => m.participant1Id === m.winnerId ? m.participant2Id : m.participant1Id)
            .filter(id => id);

        // Create tournament result
        DB.insert(DB.KEYS.RESULTS, {
            tournamentId,
            championId,
            runnerUpId,
            thirdPlaceIds,
            totalMatches: matches.length,
            totalParticipants: tournament.participantCount
        });

        // Update tournament status
        DB.update(DB.KEYS.TOURNAMENTS, tournamentId, {
            status: 'completed',
            currentRound: tournament.totalRounds,
            endDate: new Date().toISOString().split('T')[0]
        });

        console.log('🏆 Tournament completed! Champion:', championId);
    },

    /**
     * Reset bracket (delete all matches and reset status)
     * @param {string} tournamentId - Tournament ID
     */
    reset(tournamentId) {
        const tournament = DB.getById(DB.KEYS.TOURNAMENTS, tournamentId);
        if (!tournament) {
            throw new Error('Tournament tidak ditemukan');
        }

        if (tournament.status === 'completed') {
            throw new Error('Tidak dapat reset tournament yang sudah selesai');
        }

        // Delete all matches
        DB.deleteWhere(DB.KEYS.MATCHES, { tournamentId });

        // Delete results if any
        DB.deleteWhere(DB.KEYS.RESULTS, { tournamentId });

        // Reset participant statuses
        const participants = ParticipantService.getByTournament(tournamentId);
        participants.forEach(p => {
            DB.update(DB.KEYS.PARTICIPANTS, p.id, {
                status: 'active',
                eliminatedAtRound: null
            });
        });

        // Reset tournament status
        DB.update(DB.KEYS.TOURNAMENTS, tournamentId, {
            status: 'draft',
            currentRound: 1
        });

        console.log('🔄 Bracket reset');
    }
};
