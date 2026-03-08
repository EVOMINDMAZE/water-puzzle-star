const fs = require('fs');

// Helper to check if a state is solved
function isSolved(state, target) {
    return state.some(amount => amount === target);
}

// Check if a move is valid
function isValidMove(state, capacities, from, to) {
    if (from === to) return false;
    if (state[from] === 0) return false;
    if (state[to] === capacities[to]) return false;
    return true;
}

// Apply a move and return the new state
function applyMove(state, capacities, from, to) {
    const newState = [...state];
    const amountToMove = Math.min(state[from], capacities[to] - state[to]);
    newState[from] -= amountToMove;
    newState[to] += amountToMove;
    return newState;
}

// Generate state string for Sets
function stateToString(state) {
    return state.join(',');
}

// BFS Solver to find shortest path (minimum moves) to a target
function solveForward(capacities, initialState, target) {
    const queue = [{ state: initialState, moves: 0 }];
    const visited = new Set();
    visited.add(stateToString(initialState));

    while (queue.length > 0) {
        const { state, moves } = queue.shift();

        if (isSolved(state, target)) {
            return moves;
        }

        for (let from = 0; from < state.length; from++) {
            for (let to = 0; to < state.length; to++) {
                if (isValidMove(state, capacities, from, to)) {
                    const nextState = applyMove(state, capacities, from, to);
                    const stateStr = stateToString(nextState);
                    if (!visited.has(stateStr)) {
                        visited.add(stateStr);
                        queue.push({ state: nextState, moves: moves + 1 });
                    }
                }
            }
        }
    }
    return -1; // Unsolvable
}

// Reverse walk to generate a puzzle
function scramble(capacities, target, walkLength = 50) {
    let state = [capacities[0], ...Array(capacities.length - 1).fill(0)];

    // Quick check if target possible
    if (solveForward(capacities, state, target) === -1) return null;

    for (let i = 0; i < walkLength; i++) {
        const validMoves = [];
        for (let from = 0; from < state.length; from++) {
            for (let to = 0; to < state.length; to++) {
                if (isValidMove(state, capacities, from, to)) {
                    validMoves.push({ from, to });
                }
            }
        }

        if (validMoves.length === 0) break;

        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        state = applyMove(state, capacities, move.from, move.to);
    }

    const finalPar = solveForward(capacities, state, target);

    if (finalPar < 3) return null;

    return {
        initial: state,
        par: finalPar
    };
}

// Generates an array of capacities based on number of bottles
function generateCapacities(numBottles) {
    if (numBottles === 3) {
        // Typical math logic: A = B + C, wait no, they just need to be coprime or interesting.
        // Let's pick a random large capacity, and two smaller ones.
        const primes = [3, 5, 7, 11, 13, 17, 19, 23];
        const c1 = primes[Math.floor(Math.random() * 4) + 4]; // 13, 17, 19, 23
        const c2 = primes[Math.floor(Math.random() * 4)]; // 3, 5, 7, 11
        const c3 = primes[Math.floor(Math.random() * 4)]; // 3, 5, 7, 11
        // Make sure c1 is the largest
        let sorted = [c1, c2, c3].sort((a, b) => b - a);
        // Ensure strictly decreasing to avoid duplicates
        if (sorted[0] === sorted[1]) sorted[0]++;
        if (sorted[1] === sorted[2]) sorted[1]++;
        return sorted;
    } else {
        // 4 bottles
        const primes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
        let c1 = primes[Math.floor(Math.random() * 4) + 6]; // larger
        let c2 = primes[Math.floor(Math.random() * 4) + 3];
        let c3 = primes[Math.floor(Math.random() * 4)];
        let c4 = primes[Math.floor(Math.random() * 4)];
        let sorted = [c1, c2, c3, c4].sort((a, b) => b - a);
        if (sorted[0] === sorted[1]) sorted[0]++;
        if (sorted[1] === sorted[2]) sorted[1]++;
        if (sorted[2] === sorted[3]) sorted[2]++;
        return sorted;
    }
}

const numLevels = 1000;
const generatedLevels = [];
const seenConfigs = new Set();
let attempts = 0;

console.log(`Generating ${numLevels} levels...`);

while (generatedLevels.length < numLevels && attempts < 500000) {
    attempts++;

    // Gradually introduce 4-bottle levels
    // First 100 levels: mostly 3 bottles. Next: mixed. Last: mostly 4 bottles.
    const progress = generatedLevels.length / numLevels;
    const is3Bottles = Math.random() > progress * 0.8; // 100% chance at start, goes down to 20%

    const numBottles = is3Bottles ? 3 : 4;
    const capacities = generateCapacities(numBottles);

    // Target is between 1 and capacities[0]-1
    const target = Math.floor(Math.random() * (capacities[0] - 2)) + 1;
    if (target === 0) continue;

    // GCD Check: target must be divisible by gcd of smaller bottles (if total liquid == cap[0])
    // Actually our scramble function will natively filter out unsolvable ones.

    const puzzle = scramble(capacities, target, 50);

    if (puzzle) {
        // Create unique signature to avoid duplicates
        const sig = `${capacities.join('-')}_${puzzle.initial.join('-')}_${target}`;

        if (!seenConfigs.has(sig)) {
            // Just add them and sort by par finally
            seenConfigs.add(sig);
            generatedLevels.push({
                capacities: capacities,
                initial: puzzle.initial,
                target: target,
                par: puzzle.par
            });

            if (generatedLevels.length % 50 === 0) {
                console.log(`Generated ${generatedLevels.length}/${numLevels}`);
            }
        }
    }
}

// Sort strictly by par (moves required) so difficulty ramps up smoothly
generatedLevels.sort((a, b) => a.par - b.par);

console.log(`Successfully generated ${generatedLevels.length} levels.`);

// Write to levels.js
const fileContent = `// Auto-generated 1000 Levels
// Sorted by Minimum Optimal Moves (par)
const LEVELS = ${JSON.stringify(generatedLevels, null, 2)};
`;

fs.writeFileSync('levels.js', fileContent);
console.log('Saved to levels.js');
