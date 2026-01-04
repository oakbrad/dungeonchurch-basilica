// Bestiary functionality - fetches monster data from 5etools JSON and displays in sortable table
document.addEventListener('DOMContentLoaded', function() {
    const HOMEBREW_URL = 'https://5e.dungeon.church/homebrew/Dungeon%20Church;%20Pyora.json'; // Use for Production
    //const HOMEBREW_URL =  '/assets/Dungeon%20Church;%20Pyora.json'; // Use for testing (CORS)

    const loadingElement = document.querySelector('.bestiary-loading');
    const errorElement = document.querySelector('.bestiary-error');
    const tableContainer = document.querySelector('.bestiary-table-container');
    const tableBody = document.querySelector('.bestiary-table tbody');
    const sortableHeaders = document.querySelectorAll('.bestiary-table th.sortable');

    let monsters = [];
    let currentSort = { column: 'name', direction: 'asc' };

    // Fetch monster data
    fetchMonsterData();

    async function fetchMonsterData() {
        try {
            const response = await fetch(HOMEBREW_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch monster data');
            }

            const data = await response.json();
            monsters = data.monster || [];

            // Process and display monsters
            if (monsters.length > 0) {
                renderMonsters();
                setupSorting();
                showTable();
            } else {
                showError();
            }
        } catch (error) {
            console.error('Error fetching monster data:', error);
            showError();
        }
    }

    function showTable() {
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    }

    function showError() {
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
    }

    function getMonsterType(monster) {
        if (typeof monster.type === 'string') {
            return monster.type;
        } else if (monster.type && typeof monster.type === 'object') {
            return monster.type.type || 'Unknown';
        }
        return 'Unknown';
    }

    function getCR(monster) {
        if (monster.cr === undefined || monster.cr === null) {
            return 'Unknown';
        }
        // CR can be a string like "1/2" or a number
        if (typeof monster.cr === 'object') {
            // Some monsters have CR as an object with 'cr' property
            return monster.cr.cr || 'Unknown';
        }
        return String(monster.cr);
    }

    function getCRNumeric(crString) {
        // Convert CR string to numeric value for sorting
        if (crString === 'Unknown') return -1;
        if (crString === '0') return 0;
        if (crString === '1/8') return 0.125;
        if (crString === '1/4') return 0.25;
        if (crString === '1/2') return 0.5;
        return parseFloat(crString) || 0;
    }

    function getTokenUrl(monster) {
        // Check for tokenHref first (direct token URL)
        if (monster.tokenHref && monster.tokenHref.url) {
            return monster.tokenHref.url;
        }
        // Fall back to fluff images if available
        if (monster.fluff && monster.fluff.images && monster.fluff.images.length > 0) {
            const img = monster.fluff.images[0];
            if (img.href && img.href.url) {
                return img.href.url;
            }
        }
        return null;
    }

    function renderMonsters() {
        if (!tableBody) return;

        tableBody.innerHTML = '';

        monsters.forEach(monster => {
            const row = document.createElement('tr');

            // Token cell
            const tokenCell = document.createElement('td');
            tokenCell.classList.add('monster-token');
            const tokenUrl = getTokenUrl(monster);
            if (tokenUrl) {
                const tokenImg = document.createElement('img');
                tokenImg.src = tokenUrl;
                tokenImg.alt = `${monster.name} token`;
                tokenImg.loading = 'lazy';
                tokenCell.appendChild(tokenImg);
            }

            const nameCell = document.createElement('td');
            const nameLink = document.createElement('a');
            // Link to 5etools monster page
            nameLink.href = `https://5e.dungeon.church/bestiary.html#${encodeURIComponent(monster.name).toLowerCase()}_dungeonchurch`;
            nameLink.textContent = monster.name;
            nameLink.target = '_blank';
            nameLink.rel = 'noopener noreferrer';
            nameCell.appendChild(nameLink);

            const typeCell = document.createElement('td');
            typeCell.textContent = getMonsterType(monster);
            typeCell.classList.add('monster-type');

            const crCell = document.createElement('td');
            crCell.textContent = getCR(monster);
            crCell.classList.add('monster-cr');

            row.appendChild(tokenCell);
            row.appendChild(nameCell);
            row.appendChild(typeCell);
            row.appendChild(crCell);

            tableBody.appendChild(row);
        });
    }

    function setupSorting() {
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');

                // Toggle direction if same column, otherwise default to ascending
                if (currentSort.column === column) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = column;
                    currentSort.direction = 'asc';
                }

                sortMonsters();
                updateSortIndicators();
                renderMonsters();
            });
        });

        // Set initial sort indicator
        updateSortIndicators();
    }

    function sortMonsters() {
        monsters.sort((a, b) => {
            let valueA, valueB;

            switch (currentSort.column) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'type':
                    valueA = getMonsterType(a).toLowerCase();
                    valueB = getMonsterType(b).toLowerCase();
                    break;
                case 'cr':
                    valueA = getCRNumeric(getCR(a));
                    valueB = getCRNumeric(getCR(b));
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function updateSortIndicators() {
        sortableHeaders.forEach(header => {
            const column = header.getAttribute('data-sort');
            header.classList.remove('sort-asc', 'sort-desc');

            if (column === currentSort.column) {
                header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }
});
