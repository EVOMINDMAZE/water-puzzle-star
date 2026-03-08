// Level solver validation script
const LEVELS = [
    { target: 7, par: 1, bottles: [{ cap: 7, cur: 7 }, { cap: 10, cur: 0 }] },
    { target: 3, par: 1, bottles: [{ cap: 10, cur: 10 }, { cap: 7, cur: 0 }] },
    { target: 4, par: 1, bottles: [{ cap: 9, cur: 9 }, { cap: 5, cur: 0 }] },
    { target: 2, par: 1, bottles: [{ cap: 5, cur: 5 }, { cap: 3, cur: 0 }] },
    { target: 2, par: 2, bottles: [{ cap: 8, cur: 8 }, { cap: 5, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 4, par: 2, bottles: [{ cap: 7, cur: 7 }, { cap: 4, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 2, par: 2, bottles: [{ cap: 9, cur: 9 }, { cap: 4, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 4, par: 3, bottles: [{ cap: 11, cur: 11 }, { cap: 7, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 2, par: 4, bottles: [{ cap: 10, cur: 10 }, { cap: 3, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 3, par: 4, bottles: [{ cap: 12, cur: 12 }, { cap: 5, cur: 0 }, { cap: 4, cur: 0 }] },
    { target: 1, par: 4, bottles: [{ cap: 11, cur: 11 }, { cap: 7, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 5, par: 4, bottles: [{ cap: 15, cur: 15 }, { cap: 6, cur: 0 }, { cap: 4, cur: 0 }] },
    { target: 4, par: 5, bottles: [{ cap: 8, cur: 8 }, { cap: 5, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 2, par: 5, bottles: [{ cap: 12, cur: 12 }, { cap: 7, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 2, par: 5, bottles: [{ cap: 10, cur: 10 }, { cap: 6, cur: 0 }, { cap: 4, cur: 0 }] },
    { target: 1, par: 5, bottles: [{ cap: 14, cur: 14 }, { cap: 9, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 2, par: 5, bottles: [{ cap: 9, cur: 9 }, { cap: 4, cur: 0 }, { cap: 3, cur: 0 }, { cap: 6, cur: 0 }] },
    { target: 1, par: 6, bottles: [{ cap: 16, cur: 16 }, { cap: 9, cur: 0 }, { cap: 6, cur: 0 }] },
    { target: 1, par: 6, bottles: [{ cap: 17, cur: 17 }, { cap: 11, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 2, par: 6, bottles: [{ cap: 13, cur: 13 }, { cap: 8, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 3, par: 6, bottles: [{ cap: 8, cur: 6 }, { cap: 5, cur: 5 }, { cap: 7, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 1, par: 7, bottles: [{ cap: 10, cur: 10 }, { cap: 6, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 4, par: 7, bottles: [{ cap: 11, cur: 11 }, { cap: 7, cur: 0 }, { cap: 4, cur: 0 }, { cap: 2, cur: 0 }] },
    { target: 1, par: 7, bottles: [{ cap: 15, cur: 15 }, { cap: 7, cur: 0 }, { cap: 5, cur: 0 }, { cap: 2, cur: 0 }] },
    { target: 5, par: 8, bottles: [{ cap: 18, cur: 18 }, { cap: 11, cur: 0 }, { cap: 7, cur: 0 }, { cap: 4, cur: 0 }] },
    { target: 1, par: 8, bottles: [{ cap: 20, cur: 20 }, { cap: 13, cur: 0 }, { cap: 6, cur: 0 }] },
    { target: 3, par: 9, bottles: [{ cap: 16, cur: 16 }, { cap: 10, cur: 0 }, { cap: 7, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 2, par: 9, bottles: [{ cap: 17, cur: 17 }, { cap: 11, cur: 0 }, { cap: 7, cur: 0 }, { cap: 5, cur: 0 }] },
    { target: 4, par: 10, bottles: [{ cap: 20, cur: 20 }, { cap: 13, cur: 0 }, { cap: 8, cur: 0 }, { cap: 5, cur: 0 }, { cap: 3, cur: 0 }] },
    { target: 7, par: 12, bottles: [{ cap: 25, cur: 25 }, { cap: 16, cur: 0 }, { cap: 11, cur: 0 }, { cap: 7, cur: 0 }, { cap: 4, cur: 0 }] },
];

function getHash(state) { return state.map(b => b.cur).join(','); }

function solve(bottles, targetL) {
    const init = bottles.map(b => ({ ...b }));
    const queue = [{ state: init, path: [] }];
    const visited = new Set([getHash(init)]);
    let it = 0;
    while (queue.length > 0 && it < 200000) {
        it++;
        const { state, path } = queue.shift();
        if (state.some(b => Math.abs(b.cur - targetL) < 0.01)) return path[0] || 'already_solved';
        for (let i = 0; i < state.length; i++) {
            for (let j = 0; j < state.length; j++) {
                if (i === j || state[i].cur === 0 || state[j].cur === state[j].cap) continue;
                const ns = state.map(b => ({ ...b }));
                const amt = Math.min(ns[i].cur, ns[j].cap - ns[j].cur);
                ns[i].cur -= amt; ns[j].cur += amt;
                const h = getHash(ns);
                if (!visited.has(h)) { visited.add(h); queue.push({ state: ns, path: [...path, { from: i, to: j }] }); }
            }
        }
    }
    return null;
}

let allGood = true;
LEVELS.forEach((lvl, idx) => {
    const alreadySolved = lvl.bottles.some(b => Math.abs(b.cur - lvl.target) < 0.01);
    const result = alreadySolved ? 'already_solved' : solve(lvl.bottles, lvl.target);
    const ok = !!result;
    if (!ok) allGood = false;
    console.log(`L${String(idx + 1).padStart(2, '0')}: ${ok ? '✅' : '❌'} target=${lvl.target} bottles=${lvl.bottles.length} par=${lvl.par}`);
});
console.log('\n' + (allGood ? '🎉 All 30 levels SOLVABLE!' : '⚠️  Issues found!'));
