// NPC Grid functionality
document.addEventListener('DOMContentLoaded', function() {
    // Find the NPC grid container
    const npcGridContainer = document.querySelector('.npc-grid-container');
    const tableContainer = document.querySelector('.npc-table-container');
    
    if (npcGridContainer && tableContainer) {
        // Extract NPC data from the markdown table
        const npcData = extractNPCData(tableContainer);
        
        if (npcData.length === 0) {
            npcGridContainer.innerHTML = '<p class="no-data-message">No NPC data found. Please add a markdown table to your post with columns for Name, Description, Artwork, Token, File, and optionally Wiki.</p>';
            return;
        }
        
        // Create NPC cards
        npcData.forEach((npc, index) => {
            const npcCard = createNPCCard(npc, index);
            npcGridContainer.appendChild(npcCard);
        });
        
        // Force a reflow to ensure animations work
        void npcGridContainer.offsetWidth;
        
        // Add animation class to each card after a small delay
        setTimeout(() => {
            const cards = npcGridContainer.querySelectorAll('.npc-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, index * 100);
            });
        }, 100);
    }
    
    // Function to extract NPC data from markdown table
    function extractNPCData(contentSection) {
        const npcData = [];
        
        if (contentSection) {
            // Find all tables in the content section
            const tables = contentSection.querySelectorAll('table');
            
            if (tables.length > 0) {
                // Use the first table found
                const table = tables[0];
                
                // Get the header row to identify column indices
                const headerRow = table.querySelector('thead tr');
                if (!headerRow) return npcData;
                
                const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
                
                // Find the index of each column
                const nameIndex = headers.indexOf('name');
                const descriptionIndex = headers.indexOf('description');
                const artworkIndex = headers.indexOf('artwork');
                const tokenIndex = headers.indexOf('token');
                const fileIndex = headers.indexOf('file');
                const wikiIndex = headers.indexOf('wiki');
                
                // Make sure we have the required columns
                if (nameIndex === -1 || descriptionIndex === -1 || artworkIndex === -1 || fileIndex === -1) {
                    console.error('Required columns missing from NPC table. Need Name, Description, Artwork, Token, and File columns.');
                    return npcData;
                }
                
                // Get all rows except the header row
                const rows = table.querySelectorAll('tbody tr');
                
                // Extract data from each row
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > Math.max(nameIndex, descriptionIndex, artworkIndex, fileIndex)) {
                        const npc = {
                            name: cells[nameIndex].textContent.trim(),
                            description: cells[descriptionIndex].textContent.trim(),
                            artwork: extractUrl(cells[artworkIndex]),
                            token: tokenIndex !== -1 ? extractUrl(cells[tokenIndex]) : null,
                            file: extractUrl(cells[fileIndex]),
                            wiki: wikiIndex !== -1 ? extractUrl(cells[wikiIndex]) : null
                        };
                        npcData.push(npc);
                    }
                });
            }
        }
        
        return npcData;
    }
    
    // Function to extract URL from a cell (handles both text URLs and <a> tags)
    function extractUrl(cell) {
        // Check if the cell contains an <a> tag
        const link = cell.querySelector('a');
        if (link) {
            return {
                url: link.getAttribute('href'),
                text: link.textContent.trim()
            };
        }
        
        // Otherwise, use the text content as the URL
        const url = cell.textContent.trim();
        return {
            url: url,
            text: url
        };
    }
    
    // Function to create an NPC card
    function createNPCCard(npc, index) {
        const card = document.createElement('div');
        card.className = 'npc-card';
        card.setAttribute('data-npc-index', index); // Add index as a data attribute
        
        // Create image container and image
        const imageContainer = document.createElement('div');
        imageContainer.className = 'npc-image-container';
        
        const image = document.createElement('img');
        image.className = 'npc-image';
        image.src = npc.artwork.url;
        image.alt = `${npc.name} artwork`;
        image.loading = 'lazy';
        
        imageContainer.appendChild(image);
        
        // Add token image and toggle if token is available
        if (npc.token && npc.token.url && npc.token.url.trim() !== '') {
            const tokenImage = document.createElement('img');
            tokenImage.className = 'npc-token-image';
            tokenImage.src = npc.token.url;
            tokenImage.alt = `${npc.name} token`;
            tokenImage.loading = 'lazy';
            tokenImage.style.display = 'block'; // Initially visible (token is default)
            
            // Hide the artwork image initially
            image.style.display = 'none';
            
            // Create toggle button with Font Awesome icon
            const toggleButton = document.createElement('button');
            toggleButton.className = 'npc-image-toggle';
            toggleButton.innerHTML = '<i class="fa-solid fa-image"></i>';
            toggleButton.title = 'Toggle between token and artwork';
            
            // Add toggle functionality
            toggleButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (tokenImage.style.display !== 'none') {
                    // Switch to artwork view
                    tokenImage.style.display = 'none';
                    image.style.display = 'block';
                    toggleButton.innerHTML = '<i class="fa-solid fa-circle-user"></i>';
                    toggleButton.classList.add('artwork-active');
                } else {
                    // Switch to token view
                    tokenImage.style.display = 'block';
                    image.style.display = 'none';
                    toggleButton.innerHTML = '<i class="fa-solid fa-image"></i>';
                    toggleButton.classList.remove('artwork-active');
                }
            });
            
            imageContainer.appendChild(tokenImage);
            imageContainer.appendChild(toggleButton);
        }
        
        card.appendChild(imageContainer);
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'npc-content-container';
        
        // Create name element
        const nameElement = document.createElement('h2');
        nameElement.className = 'npc-name';
        
        // If wiki URL is provided, make the name a link
        if (npc.wiki && npc.wiki.url) {
            const nameLink = document.createElement('a');
            nameLink.href = npc.wiki.url;
            nameLink.textContent = npc.name;
            nameLink.target = '_blank';
            nameLink.rel = 'noopener noreferrer';
            nameElement.appendChild(nameLink);
        } else {
            nameElement.textContent = npc.name;
        }
        
        contentContainer.appendChild(nameElement);
        
        // Create description element
        const descriptionElement = document.createElement('p');
        descriptionElement.className = 'npc-description';
        descriptionElement.textContent = npc.description;
        contentContainer.appendChild(descriptionElement);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.className = 'npc-download';
        downloadLink.href = npc.file.url;
        downloadLink.textContent = 'Download';
        downloadLink.target = '_blank';
        downloadLink.rel = 'noopener noreferrer';
        contentContainer.appendChild(downloadLink);
        
        card.appendChild(contentContainer);
        
        return card;
    }
});
