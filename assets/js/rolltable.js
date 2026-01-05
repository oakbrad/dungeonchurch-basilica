// Table roller functionality with 3D dice
// Supports both markdown tables in post content and 5etools JSON tables

//const HOMEBREW_URL = 'https://5e.dungeon.church/homebrew/Dungeon%20Church;%20Pyora.json';
const HOMEBREW_URL = '/assets/Dungeon%20Church;%20Pyora.json';
let cachedJsonData = null;

// Parse 5etools inline formatting to HTML
// Handles nested tags by processing inner tags first, then outer formatting
function parse5eToolsText(text) {
    if (!text || typeof text !== 'string') return text;

    let result = text;

    // Process inner tags first (links, items, creatures, etc.) before italic/bold wrappers

    // {@link text|url} -> <a href="url">text</a>
    result = result.replace(/\{@link ([^|{}]+)\|([^}]+)\}/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // {@item Name|source} -> link to 5e.dungeon.church/items.html
    result = result.replace(/\{@item ([^|{}]+)\|([^}]+)\}/g, function(match, name, source) {
        const encodedName = encodeURIComponent(name.toLowerCase().replace(/ /g, '_'));
        const encodedSource = source.toLowerCase();
        return '<a href="https://5e.dungeon.church/items.html#' + encodedName + '_' + encodedSource + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
    });

    // {@item Name} (without source) -> just the name as link
    result = result.replace(/\{@item ([^|}{}]+)\}/g, function(match, name) {
        const encodedName = encodeURIComponent(name.toLowerCase().replace(/ /g, '_'));
        return '<a href="https://5e.dungeon.church/items.html#' + encodedName + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
    });

    // {@creature Name|source} -> link to bestiary
    result = result.replace(/\{@creature ([^|{}]+)\|([^}]+)\}/g, function(match, name, source) {
        const encodedName = encodeURIComponent(name.toLowerCase().replace(/ /g, '_'));
        const encodedSource = source.toLowerCase();
        return '<a href="https://5e.dungeon.church/bestiary.html#' + encodedName + '_' + encodedSource + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
    });

    // {@creature Name} (without source)
    result = result.replace(/\{@creature ([^|}{}]+)\}/g, function(match, name) {
        const encodedName = encodeURIComponent(name.toLowerCase().replace(/ /g, '_'));
        return '<a href="https://5e.dungeon.church/bestiary.html#' + encodedName + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
    });

    // {@table Name|source|display} -> link with display text
    result = result.replace(/\{@table ([^|{}]+)\|([^|{}]+)\|([^}]+)\}/g, function(match, name, source, display) {
        const encodedName = encodeURIComponent(name.toLowerCase().replace(/ /g, '_'));
        const encodedSource = source.toLowerCase();
        return '<a href="https://5e.dungeon.church/tables.html#' + encodedName + '_' + encodedSource + '" target="_blank" rel="noopener noreferrer">' + display + '</a>';
    });

    // {@table Name|source} -> link with name as display
    result = result.replace(/\{@table ([^|{}]+)\|([^}]+)\}/g, function(match, name, source) {
        const encodedName = encodeURIComponent(name.toLowerCase().replace(/ /g, '_'));
        const encodedSource = source.toLowerCase();
        return '<a href="https://5e.dungeon.church/tables.html#' + encodedName + '_' + encodedSource + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
    });

    // {@race Name|source|display} -> display text only (or could be linked)
    result = result.replace(/\{@race ([^|{}]+)\|([^|{}]+)\|([^}]+)\}/g, '$3');

    // {@race Name|source} -> name only
    result = result.replace(/\{@race ([^|{}]+)\|([^}]+)\}/g, '$1');

    // {@dice XdY} -> plain text
    result = result.replace(/\{@dice ([^}]+)\}/g, '$1');

    // {@atk mw} etc. -> plain text descriptors
    result = result.replace(/\{@atk ([^}]+)\}/g, '');

    // {@hit X} -> +X
    result = result.replace(/\{@hit ([^}]+)\}/g, '+$1');

    // {@filter ...} -> remove filter links
    result = result.replace(/\{@filter ([^|{}]+)\|[^}]*\}/g, '$1');

    // Now process italic/bold AFTER inner tags have been converted
    // These can contain the HTML we just generated
    // {@i content} -> <em>content</em> (content may now contain HTML)
    result = result.replace(/\{@i ([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, '<em>$1</em>');
    // Simpler fallback for {@i ...} that doesn't have nested braces
    result = result.replace(/\{@i ([^}]+)\}/g, '<em>$1</em>');

    // {@b content} -> <strong>content</strong>
    result = result.replace(/\{@b ([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, '<strong>$1</strong>');
    result = result.replace(/\{@b ([^}]+)\}/g, '<strong>$1</strong>');

    // Catch-all for any remaining {@tag content} patterns - just show content
    result = result.replace(/\{@\w+ ([^}]+)\}/g, '$1');

    return result;
}

// Fetch table data from 5etools JSON by table name
// Returns { tableData: [...], rawTable: {...} } or null on error
async function fetchTableFromJson(tableName) {
    try {
        // Use cached data if available
        if (!cachedJsonData) {
            const response = await fetch(HOMEBREW_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch homebrew data');
            }
            cachedJsonData = await response.json();
        }

        // Find the table by name (case-insensitive)
        const tables = cachedJsonData.table || [];
        const rawTable = tables.find(t =>
            t.name.toLowerCase() === tableName.toLowerCase()
        );

        if (!rawTable) {
            console.error('Table not found:', tableName);
            return null;
        }

        // Convert 5etools table format to our tableData format
        // 5etools rows: [[roll, result, ...extra], ...]
        // Our format: [{mainResult: string, description: string}, ...]
        const tableData = rawTable.rows.map(row => {
            const resultObj = {
                mainResult: '',
                description: ''
            };

            // Column 0 is typically the roll number, column 1 is the result
            if (row.length > 1) {
                resultObj.mainResult = parse5eToolsText(String(row[1]));
                // If there are more columns, join them as description
                if (row.length > 2) {
                    resultObj.description = parse5eToolsText(String(row[2]));
                }
            } else if (row.length > 0) {
                resultObj.mainResult = parse5eToolsText(String(row[0]));
            }

            return resultObj;
        });

        return { tableData, rawTable };
    } catch (error) {
        console.error('Error fetching table from JSON:', error);
        return null;
    }
}

// Render a 5etools table as an HTML table element
function renderJsonTable(rawTable, targetElement) {
    const table = document.createElement('table');

    // Create thead with column labels
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    if (rawTable.colLabels && rawTable.colLabels.length > 0) {
        rawTable.colLabels.forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            headerRow.appendChild(th);
        });
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody with rows
    const tbody = document.createElement('tbody');

    rawTable.rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.innerHTML = parse5eToolsText(String(cell));
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    // Insert the table after the target element (the data-5e-table div)
    targetElement.parentNode.insertBefore(table, targetElement.nextSibling);

    return table;
}

document.addEventListener('DOMContentLoaded', function() {
    // Create the dice overlay container
    const diceOverlay = document.createElement('div');
    diceOverlay.className = 'dice-overlay';
    document.body.appendChild(diceOverlay);

    // Initialize the 3D dice box
    let diceBox = null;
    let isRolling = false;

    // Store table data and pending result callback
    let pendingTableData = null;
    let pendingRandomIndex = null;
    let pendingResultElement = null;

    // Initialize dice box when needed
    function initDiceBox() {
        if (diceBox) return diceBox;
        if (typeof DICE === 'undefined') {
            console.warn('DICE library not loaded');
            return null;
        }
        diceBox = new DICE.dice_box(diceOverlay);
        return diceBox;
    }

    // Get the optimal dice combination to cover the table length
    // Returns an object with dice notation and expected max value
    function getDiceCombination(tableLength) {
        const diceTypes = [20, 12, 10, 8, 6, 4]; // largest first for greedy algorithm

        // For small tables, use a single die
        for (const sides of [4, 6, 8, 10, 12, 20]) {
            if (tableLength <= sides) {
                return {
                    notation: '1d' + sides,
                    dice: [sides],
                    maxValue: sides
                };
            }
        }

        // For exactly 100, use d100 (percentile dice)
        if (tableLength === 100) {
            return {
                notation: '1d100+1d9',
                dice: [100, 9],
                maxValue: 100,
                isPercentile: true
            };
        }

        // For larger tables, find combination of dice
        // Greedy: add largest die that fits, repeat until we reach or exceed table length
        let remaining = tableLength;
        const dice = [];

        while (remaining > 0) {
            // Find the largest die that doesn't overshoot too much
            // or the smallest die if we're close
            let bestDie = 4; // default to smallest
            for (const sides of diceTypes) {
                if (sides <= remaining) {
                    bestDie = sides;
                    break; // take the largest that fits
                }
            }
            dice.push(bestDie);
            remaining -= bestDie;
        }

        // Build notation string (e.g., "2d20+1d10")
        const diceCounts = {};
        dice.forEach(d => {
            diceCounts[d] = (diceCounts[d] || 0) + 1;
        });

        const notationParts = [];
        // Sort by die size descending for nice notation
        Object.keys(diceCounts)
            .map(Number)
            .sort((a, b) => b - a)
            .forEach(sides => {
                notationParts.push(diceCounts[sides] + 'd' + sides);
            });

        const maxValue = dice.reduce((sum, d) => sum + d, 0);

        return {
            notation: notationParts.join('+'),
            dice: dice,
            maxValue: maxValue
        };
    }

    // Function to extract table data from markdown table
    function extractTableData(contentSection) {
        const tableData = [];

        if (contentSection) {
            const tables = contentSection.querySelectorAll('table');

            if (tables.length > 0) {
                const table = tables[0];
                const rows = table.querySelectorAll('tbody tr');

                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const resultObj = {
                        mainResult: '',
                        description: ''
                    };

                    if (cells.length > 1) {
                        resultObj.mainResult = cells[1].innerHTML.trim();
                        if (cells.length > 2) {
                            resultObj.description = cells[2].innerHTML.trim();
                        }
                    } else if (cells.length > 0) {
                        resultObj.mainResult = cells[0].innerHTML.trim();
                    }

                    tableData.push(resultObj);
                });
            }
        }

        return tableData;
    }

    // Display result in the result element
    function displayResult(result, resultElement) {
        resultElement.innerHTML = result.mainResult;

        if (result.description) {
            resultElement.innerHTML += '<div class="table-roller-description"><em>' + result.description + '</em></div>';
        }

        // Add target="_blank" to all links
        const links = resultElement.querySelectorAll('a');
        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });

        resultElement.classList.add('result-fade-in');
    }

    // Roll the 3D dice and show result
    function rollDice(tableData, resultElement, iconElement) {
        if (isRolling) return;
        if (tableData.length === 0) {
            resultElement.textContent = 'No table data found. Please add a markdown table to your post.';
            return;
        }

        const box = initDiceBox();
        if (!box) {
            // Fallback to simple random if dice library not available
            fallbackRoll(tableData, resultElement, iconElement);
            return;
        }

        isRolling = true;

        // Clear previous result
        resultElement.textContent = 'Rolling...';
        resultElement.classList.remove('result-fade-in');

        // Animate the 2D icon as well
        if (iconElement) {
            iconElement.classList.add('rolling');
            setTimeout(() => iconElement.classList.remove('rolling'), 800);
        }

        // Determine dice combination and roll
        const combo = getDiceCombination(tableData.length);

        // Generate random result for each die and calculate total
        let diceResults;
        let totalResult;

        if (combo.isPercentile) {
            // Percentile dice: d100 (tens: 0,10,20...90) + d9 (units: 0-9)
            // Result of 00+0 = 100, otherwise tens+units
            const tens = Math.floor(Math.random() * 10) * 10; // 0, 10, 20, ... 90
            const units = Math.floor(Math.random() * 10);      // 0-9
            totalResult = (tens + units === 0) ? 100 : tens + units;
            // The library expects: d100 result (0-9 representing 00-90) and d9 result (0-9)
            diceResults = [tens / 10, units];
        } else {
            diceResults = combo.dice.map(sides => Math.floor(Math.random() * sides) + 1);
            totalResult = diceResults.reduce((sum, val) => sum + val, 0);
        }

        // Map roll to table index (1-indexed roll to 0-indexed array)
        // Use modulo to wrap if roll exceeds table length
        const tableIndex = (totalResult - 1) % tableData.length;

        // Store for after_roll callback
        pendingTableData = tableData;
        pendingRandomIndex = tableIndex;
        pendingResultElement = resultElement;

        // Show overlay
        diceOverlay.classList.add('active');

        // Set dice and roll
        box.setDice(combo.notation);
        box.start_throw(
            // before_roll: return forced values for each die
            function(notation) {
                return diceResults;
            },
            // after_roll: show result and hide overlay
            function(notation) {
                // Hide overlay with fade
                setTimeout(() => {
                    diceOverlay.classList.remove('active');

                    // Display the result
                    if (pendingTableData && pendingResultElement) {
                        const result = pendingTableData[pendingRandomIndex];
                        displayResult(result, pendingResultElement);
                    }

                    isRolling = false;
                }, 500);
            }
        );
    }

    // Fallback roll without 3D dice
    function fallbackRoll(tableData, resultElement, iconElement) {
        resultElement.textContent = 'Rolling...';
        resultElement.classList.remove('result-fade-in');

        if (iconElement) {
            iconElement.classList.add('rolling');
            setTimeout(() => iconElement.classList.remove('rolling'), 800);
        }

        const randomIndex = Math.floor(Math.random() * tableData.length);
        const result = tableData[randomIndex];

        setTimeout(() => {
            displayResult(result, resultElement);
        }, 800);
    }

    // Find all table roller containers on the page
    const tableRollerContainers = document.querySelectorAll('.table-roller-container');

    // Initialize each table roller
    tableRollerContainers.forEach(async function(container, index) {
        const tableRollerButton = container.querySelector('.table-roller-button');
        const tableRollerResult = container.querySelector('.table-roller-result');
        const tableRollerIcon = container.querySelector('.d20-icon');

        const contentSelector = container.getAttribute('data-content-selector') || '.gh-content';
        const contentSection = document.querySelector(contentSelector);

        if (!tableRollerButton || !tableRollerResult || !contentSection) {
            return;
        }

        // Check for 5etools JSON table reference first
        const jsonTableElement = contentSection.querySelector('[data-5e-table]');
        let tableData = null;

        if (jsonTableElement) {
            const tableName = jsonTableElement.getAttribute('data-5e-table');

            // Show loading state
            tableRollerResult.textContent = 'Loading table...';
            tableRollerButton.disabled = true;

            // Fetch table data from JSON
            const result = await fetchTableFromJson(tableName);

            if (!result || !result.tableData || result.tableData.length === 0) {
                tableRollerResult.textContent = 'Failed to load table "' + tableName + '"';
                tableRollerButton.disabled = false;
                return;
            }

            tableData = result.tableData;

            // Render the table as HTML in the content area
            renderJsonTable(result.rawTable, jsonTableElement);

            tableRollerButton.disabled = false;
        } else {
            // Fall back to extracting from markdown table in content
            tableData = extractTableData(contentSection);
        }

        // Store table data for click handler
        container._tableData = tableData;

        // Button click handler
        tableRollerButton.addEventListener('click', function() {
            const data = container._tableData;
            if (data && data.length > 0) {
                rollDice(data, tableRollerResult, tableRollerIcon);
            } else {
                tableRollerResult.textContent = 'No table data found.';
            }
        });

        // Auto-roll on page load if we have data
        if (tableData && tableData.length > 0) {
            rollDice(tableData, tableRollerResult, tableRollerIcon);
        }
    });
});
