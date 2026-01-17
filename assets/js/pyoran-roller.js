// Pyoran Character Roller - Roll on multiple tables at once with 3D dice in a dice tray
// Uses the same 5etools JSON and dice library as rolltable.js

const PYORAN_ROLLER = (function() {
    const HOMEBREW_URL = 'https://5e.dungeon.church/homebrew/Dungeon%20Church;%20Pyora.json';
    // for local testing, avoid CORS issues
    //const HOMEBREW_URL = '/assets/Dungeon%20Church;%20Pyora.json';
    const BACKGROUNDS_URL = 'https://5e.dungeon.church/data/backgrounds.json';
    //const BACKGROUNDS_URL = '/assets/backgrounds.json';
    // Tables to roll on for character generation
    // source: 'homebrew' uses the Pyora JSON tables, 'backgrounds' uses 5etools backgrounds
    // dieType is determined dynamically based on table length
    const CHARACTER_TABLES = [
        { name: 'Pyoran Species', label: 'Species', source: 'homebrew' },
        { name: 'Pyoran Gods', label: 'Patron', source: 'homebrew' },
        { name: 'Pyoran Hometowns', label: 'Hometown', source: 'homebrew' },
        { name: 'Background', label: 'Background', source: 'backgrounds' }
    ];

    // Get the smallest die that can cover the table length
    function getDieForTableLength(tableLength) {
        const diceTypes = [4, 6, 8, 10, 12, 20, 100];
        for (const sides of diceTypes) {
            if (tableLength <= sides) {
                return { sides, notation: 'd' + sides };
            }
        }
        // For tables larger than 100, use d100 and wrap
        return { sides: 100, notation: 'd100' };
    }

    let cachedJsonData = null;
    let cachedBackgrounds = null;
    let diceBox = null;
    let isRolling = false;
    let pendingRolls = [];

    // Find lore.dungeon.church link in an object's entries/fluff
    // Prioritizes the "Dungeon Church Lore" inset which contains the canonical wiki link
    function findLoreLink(obj) {
        if (!obj) return null;

        // Collect all entry arrays to search (both top-level entries and fluff.entries)
        const allEntries = [];
        if (obj.entries) allEntries.push(...obj.entries);
        if (obj.fluff && obj.fluff.entries) allEntries.push(...obj.fluff.entries);

        // First, look for the "Dungeon Church Lore" inset - this has the canonical wiki link
        for (const entry of allEntries) {
            if (entry && typeof entry === 'object' &&
                entry.type === 'inset' &&
                entry.name === 'Dungeon Church Lore') {
                const insetText = JSON.stringify(entry.entries || []);
                const match = insetText.match(/https:\/\/lore\.dungeon\.church\/doc\/[^}"|\s]+/);
                if (match) return match[0];
            }
        }

        // Fallback: search all entries for any lore link (less preferred)
        const textToSearch = JSON.stringify(allEntries);
        const match = textToSearch.match(/https:\/\/lore\.dungeon\.church\/doc\/[^}"|\s]+/);
        return match ? match[0] : null;
    }

    // Look up lore link for a race/subrace name from the homebrew data
    function findRaceLoreLink(data, raceName) {
        if (!data) return null;

        // Clean up the race name - remove parenthetical parts for matching
        // e.g., "Dragonborn (Pyoran)" -> cleanName="Dragonborn", parenName="Pyoran"
        const cleanName = raceName.replace(/\s*\([^)]+\)\s*/g, '').trim();
        const parenMatch = raceName.match(/\(([^)]+)\)/);
        const parenName = parenMatch ? parenMatch[1] : null;

        // Check subraces first (more specific)
        // Subraces have 'name' (e.g., "Pyoran") and 'raceName' (e.g., "Human")
        // We need to match BOTH to get the right subrace
        if (data.subrace && parenName) {
            for (const subrace of data.subrace) {
                // Match subrace name to paren part AND raceName to clean part
                // e.g., "Human (Pyoran)" -> subrace.name="Pyoran" AND subrace.raceName="Human"
                if (subrace.name === parenName &&
                    subrace.raceName &&
                    subrace.raceName.toLowerCase() === cleanName.toLowerCase()) {
                    const link = findLoreLink(subrace);
                    if (link) return link;
                }
            }
        }

        // Also check subraces where the subrace name matches cleanName (no paren)
        if (data.subrace && !parenName) {
            for (const subrace of data.subrace) {
                if (subrace.name.toLowerCase() === cleanName.toLowerCase()) {
                    const link = findLoreLink(subrace);
                    if (link) return link;
                }
            }
        }

        // Check races
        if (data.race) {
            for (const race of data.race) {
                if (race.name.toLowerCase() === cleanName.toLowerCase() ||
                    race.name.toLowerCase() === raceName.toLowerCase()) {
                    const link = findLoreLink(race);
                    if (link) return link;
                }
            }
        }

        return null;
    }

    // Look up lore link for a deity name from the homebrew data
    function findDeityLoreLink(data, deityName) {
        if (!data || !data.deity) return null;

        for (const deity of data.deity) {
            if (deity.name.toLowerCase() === deityName.toLowerCase()) {
                // Use findLoreLink to prioritize "Dungeon Church Lore" inset
                // Deity entries are at the top level, so wrap in object for findLoreLink
                return findLoreLink({ entries: deity.entries });
            }
        }

        return null;
    }

    // Parse 5etools text formatting and enrich with lore links
    function parse5eToolsText(text, homebrewData) {
        if (!text || typeof text !== 'string') return text;
        let result = text;

        // Check if text already has a lore.dungeon.church link
        const hasLoreLink = result.includes('lore.dungeon.church');

        // Process @link tags (these already have URLs)
        result = result.replace(/\{@link ([^|{}]+)\|([^}]+)\}/g, '<a href="$2" target="_blank">$1</a>');

        // Process @race tags - look up lore link if not already present
        result = result.replace(/\{@race ([^|{}]+)\|([^|{}]+)\|([^}]+)\}/g, function(match, name, source, display) {
            if (!hasLoreLink && homebrewData) {
                const loreLink = findRaceLoreLink(homebrewData, name);
                if (loreLink) {
                    return '<a href="' + loreLink + '" target="_blank">' + display + '</a>';
                }
            }
            return display;
        });

        result = result.replace(/\{@race ([^|{}]+)\|([^}]+)\}/g, function(match, name, source) {
            if (!hasLoreLink && homebrewData) {
                const loreLink = findRaceLoreLink(homebrewData, name);
                if (loreLink) {
                    return '<a href="' + loreLink + '" target="_blank">' + name + '</a>';
                }
            }
            return name;
        });

        // Process @deity tags - look up lore link if not already present
        result = result.replace(/\{@deity ([^|{}]+)\|([^|{}]+)\|([^}]+)\}/g, function(match, name, pantheon, source) {
            if (!hasLoreLink && homebrewData) {
                const loreLink = findDeityLoreLink(homebrewData, name);
                if (loreLink) {
                    return '<a href="' + loreLink + '" target="_blank">' + name + '</a>';
                }
            }
            return name;
        });

        result = result.replace(/\{@deity ([^|{}]+)\|([^}]+)\}/g, function(match, name, source) {
            if (!hasLoreLink && homebrewData) {
                const loreLink = findDeityLoreLink(homebrewData, name);
                if (loreLink) {
                    return '<a href="' + loreLink + '" target="_blank">' + name + '</a>';
                }
            }
            return name;
        });

        // Process remaining formatting tags
        result = result.replace(/\{@i ([^}]+)\}/g, '<em>$1</em>');
        result = result.replace(/\{@b ([^}]+)\}/g, '<strong>$1</strong>');
        result = result.replace(/\{@\w+ ([^}]+)\}/g, '$1');

        return result;
    }

    // Fetch homebrew data
    async function fetchHomebrewData() {
        if (cachedJsonData) return cachedJsonData;

        try {
            const response = await fetch(HOMEBREW_URL);
            if (!response.ok) throw new Error('Failed to fetch homebrew data');
            cachedJsonData = await response.json();
            return cachedJsonData;
        } catch (error) {
            console.error('[PyoranRoller] Error fetching data:', error);
            return null;
        }
    }

    // Fetch backgrounds data
    async function fetchBackgroundsData() {
        if (cachedBackgrounds) return cachedBackgrounds;

        try {
            const response = await fetch(BACKGROUNDS_URL);
            if (!response.ok) throw new Error('Failed to fetch backgrounds data');
            cachedBackgrounds = await response.json();
            return cachedBackgrounds;
        } catch (error) {
            console.error('[PyoranRoller] Error fetching backgrounds:', error);
            return null;
        }
    }

    // Get table data by name from homebrew
    async function getHomebrewTableData(tableName) {
        const data = await fetchHomebrewData();
        if (!data || !data.table) return null;

        const table = data.table.find(t =>
            t.name.toLowerCase() === tableName.toLowerCase()
        );

        if (!table) return null;

        // Pass the full homebrew data so we can look up lore links
        return table.rows.map(row => ({
            result: parse5eToolsText(String(row[1] || row[0]), data)
        }));
    }

    // Get backgrounds as table data
    async function getBackgroundsData() {
        const data = await fetchBackgroundsData();
        if (!data || !data.background) return null;

        // Include all backgrounds except Baldur's Gate variants and Custom Background
        const validBackgrounds = data.background.filter(bg =>
            !bg.name.includes("Baldur's Gate") &&
            bg.name !== "Custom Background"
        );

        return validBackgrounds.map(bg => {
            // Clean up variant names: "Variant Sailor (Pirate)" -> "Pirate"
            let displayName = bg.name;
            const variantMatch = bg.name.match(/^Variant [^(]+\(([^)]+)\)$/);
            if (variantMatch) {
                displayName = variantMatch[1];
            }
            return { result: displayName };
        });
    }

    // Get table data based on source type
    async function getTableData(tableConfig) {
        if (tableConfig.source === 'backgrounds') {
            return await getBackgroundsData();
        }
        return await getHomebrewTableData(tableConfig.name);
    }

    // Initialize the dice box for the tray
    function initDiceBox(container) {
        if (diceBox) return diceBox;
        if (typeof DICE === 'undefined') {
            console.warn('[PyoranRoller] DICE library not loaded');
            return null;
        }

        diceBox = new DICE.dice_box(container);
        return diceBox;
    }

    // Roll all character tables
    async function rollCharacter(container, resultsContainer) {
        if (isRolling) return;
        isRolling = true;

        // Show loading state
        const resultSlots = resultsContainer.querySelectorAll('.pyoran-result-value');
        resultSlots.forEach(slot => {
            slot.textContent = '...';
            slot.classList.remove('result-ready');
        });

        // Load all table data
        const tablePromises = CHARACTER_TABLES.map(async (tableConfig) => {
            const data = await getTableData(tableConfig);
            return { ...tableConfig, data };
        });

        const tables = await Promise.all(tablePromises);

        // Check if all tables loaded
        const validTables = tables.filter(t => t.data && t.data.length > 0);
        if (validTables.length === 0) {
            resultSlots.forEach(slot => slot.textContent = 'Error loading tables');
            isRolling = false;
            return;
        }

        // Determine dice and roll for each table
        const rollData = validTables.map(table => {
            const tableLength = table.data.length;
            const die = getDieForTableLength(tableLength);
            // Roll the die (1 to sides)
            const dieResult = Math.floor(Math.random() * die.sides) + 1;
            // Map die result to table index (wrap around if die > table length)
            // Die results are 1-indexed, array is 0-indexed
            const tableIndex = (dieResult - 1) % tableLength;

            return {
                label: table.label,
                result: table.data[tableIndex].result,
                die: die,
                dieResult: dieResult
            };
        });

        // Build dice notation from determined dice
        const diceNotation = rollData.map(r => '1' + r.die.notation).join('+');

        // Initialize dice box
        const box = initDiceBox(container);

        if (box) {
            // Extract die results for the 3D animation
            const diceResults = rollData.map(r => r.dieResult);

            box.setDice(diceNotation);
            box.start_throw(
                // before_roll: return forced values
                function(notation) {
                    return diceResults;
                },
                // after_roll: show results
                function(notation) {
                    displayResults(rollData, resultsContainer);
                    isRolling = false;
                }
            );
        } else {
            // Fallback without 3D dice
            setTimeout(() => {
                displayResults(rollData, resultsContainer);
                isRolling = false;
            }, 500);
        }
    }

    // Display results in the UI
    function displayResults(results, container) {
        results.forEach(result => {
            const slot = container.querySelector(`[data-result="${result.label}"]`);
            if (slot) {
                const valueEl = slot.querySelector('.pyoran-result-value');
                if (valueEl) {
                    valueEl.innerHTML = result.result;
                    valueEl.classList.add('result-ready');
                }
            }
        });
    }

    // Initialize the roller UI
    function init(containerSelector) {
        const wrapper = document.querySelector(containerSelector);
        if (!wrapper) return;

        const diceTray = wrapper.querySelector('.pyoran-dice-tray');
        const rollButton = wrapper.querySelector('.pyoran-roll-button');
        const resultsContainer = wrapper.querySelector('.pyoran-results');

        if (!diceTray || !rollButton || !resultsContainer) {
            console.warn('[PyoranRoller] Missing required elements');
            return;
        }

        // Click handler for roll button
        rollButton.addEventListener('click', () => {
            rollCharacter(diceTray, resultsContainer);
        });

        // Auto-roll on load
        setTimeout(() => {
            rollCharacter(diceTray, resultsContainer);
        }, 500);
    }

    return {
        init,
        rollCharacter,
        CHARACTER_TABLES
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    PYORAN_ROLLER.init('.pyoran-roller-container');
});
