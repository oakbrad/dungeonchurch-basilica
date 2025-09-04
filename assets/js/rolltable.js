// Table roller functionality with 3D dice integration
document.addEventListener('DOMContentLoaded', function() {
    // Find all table roller containers on the page
    const tableRollerContainers = document.querySelectorAll('.table-roller-container');
    
    // Initialize each table roller
    tableRollerContainers.forEach(function(container, index) {
        const tableRollerButton = container.querySelector('.table-roller-button');
        const tableRollerResult = container.querySelector('.table-roller-result');
        const tableRollerIcon = container.querySelector('.d20-icon');
        const diceContainer = container.querySelector('.dice-container');
        
        // Find the associated content section for this roller
        // If there's a data-content-selector attribute, use that to find the content
        // Otherwise, use the default selector
        const contentSelector = container.getAttribute('data-content-selector') || '.gh-content';
        const contentSection = document.querySelector(contentSelector);
        
        // Initialize the 3D dice box
        let diceBox = null;
        
        // Check if the browser supports WebGL
        const supportsWebGL = (function() {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && 
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch(e) {
                return false;
            }
        })();
        
        // Only initialize the dice box if WebGL is supported
        if (supportsWebGL && diceContainer) {
            try {
                diceBox = new DICE.dice_box(diceContainer);
            } catch (e) {
                console.error('Failed to initialize 3D dice:', e);
                diceBox = null;
            }
        }
        
        if (tableRollerButton && tableRollerResult && contentSection) {
            tableRollerButton.addEventListener('click', function() {
                // Extract table data from the markdown table
                const tableData = extractTableData(contentSection);
                
                if (tableData.length === 0) {
                    tableRollerResult.textContent = 'No table data found. Please add a markdown table to your post.';
                    return;
                }
                
                // Clear previous result and show loading state
                tableRollerResult.textContent = 'Rolling...';
                tableRollerResult.classList.remove('result-fade-in');
                
                // If we have a working dice box, use it for the roll
                if (diceBox) {
                    // Show the dice container
                    diceContainer.style.display = 'block';
                    
                    // Determine appropriate dice notation based on table size
                    const diceNotation = getDiceNotationForTableSize(tableData.length);
                    
                    // Set the dice to roll
                    diceBox.setDice(diceNotation);
                    
                    // Roll the dice
                    diceBox.start_throw(
                        // before_roll callback
                        function(notation) {
                            // Add rolling animation to the d20 icon
                            if (tableRollerIcon) {
                                tableRollerIcon.classList.add('rolling');
                            }
                            return null; // Return null for random result
                        },
                        // after_roll callback
                        function(notation) {
                            // Remove rolling animation from the d20 icon
                            if (tableRollerIcon) {
                                tableRollerIcon.classList.remove('rolling');
                            }
                            
                            // Map the dice result to a table index
                            const diceResult = notation.resultTotal;
                            const tableIndex = mapDiceResultToTableIndex(diceResult, tableData.length);
                            const result = tableData[tableIndex];
                            
                            // Display the result with a slight delay
                            setTimeout(() => {
                                // Use innerHTML to preserve HTML links
                                tableRollerResult.innerHTML = result.mainResult;
                                
                                // Add the optional third column in italics if it exists
                                if (result.description) {
                                    tableRollerResult.innerHTML += '<div class="table-roller-description"><em>' + result.description + '</em></div>';
                                }
                                
                                // Add target="_blank" to all links in the result
                                const links = tableRollerResult.querySelectorAll('a');
                                links.forEach(link => {
                                    link.setAttribute('target', '_blank');
                                    link.setAttribute('rel', 'noopener noreferrer');
                                });
                                
                                tableRollerResult.classList.add('result-fade-in');
                                
                                // Hide the dice container after a delay
                                setTimeout(() => {
                                    diceContainer.style.display = 'none';
                                }, 1000);
                            }, 500);
                        }
                    );
                } else {
                    // Fallback to the original random selection if dice box isn't available
                    // Add rolling animation to the d20 icon
                    if (tableRollerIcon) {
                        tableRollerIcon.classList.add('rolling');
                        setTimeout(() => {
                            tableRollerIcon.classList.remove('rolling');
                        }, 800);
                    }
                    
                    // Roll on the table (random selection)
                    const randomIndex = Math.floor(Math.random() * tableData.length);
                    const result = tableData[randomIndex];
                    
                    // Display the result with a slight delay and animation
                    setTimeout(() => {
                        // Use innerHTML to preserve HTML links
                        tableRollerResult.innerHTML = result.mainResult;
                        
                        // Add the optional third column in italics if it exists
                        if (result.description) {
                            tableRollerResult.innerHTML += '<div class="table-roller-description"><em>' + result.description + '</em></div>';
                        }
                        
                        // Add target="_blank" to all links in the result
                        const links = tableRollerResult.querySelectorAll('a');
                        links.forEach(link => {
                            link.setAttribute('target', '_blank');
                            link.setAttribute('rel', 'noopener noreferrer');
                        });
                        
                        tableRollerResult.classList.add('result-fade-in');
                    }, 800);
                }
            });
        }
    });
    
    // Function to extract table data from markdown table
    function extractTableData(contentSection) {
        const tableData = [];
        
        if (contentSection) {
            // Find all tables in the content section
            const tables = contentSection.querySelectorAll('table');
            
            if (tables.length > 0) {
                // Use the first table found
                const table = tables[0];
                
                // Get all rows except the header row
                const rows = table.querySelectorAll('tbody tr');
                
                // Extract data from each row
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    
                    // Create a result object
                    const resultObj = {
                        mainResult: '',
                        description: ''
                    };
                    
                    if (cells.length > 1) {
                        // Use the second column (index 1) for the main result
                        resultObj.mainResult = cells[1].innerHTML.trim();
                        
                        // If there's a third column, use it for the description
                        if (cells.length > 2) {
                            resultObj.description = cells[2].innerHTML.trim();
                        }
                    } else if (cells.length > 0) {
                        // If there's only one column, use it for the main result
                        resultObj.mainResult = cells[0].innerHTML.trim();
                    }
                    
                    tableData.push(resultObj);
                });
            }
        }
        
        return tableData;
    }
    
    // Function to determine appropriate dice notation based on table size
    function getDiceNotationForTableSize(tableSize) {
        // Choose appropriate dice based on table size
        if (tableSize <= 4) {
            return "1d4";
        } else if (tableSize <= 6) {
            return "1d6";
        } else if (tableSize <= 8) {
            return "1d8";
        } else if (tableSize <= 10) {
            return "1d10";
        } else if (tableSize <= 12) {
            return "1d12";
        } else if (tableSize <= 20) {
            return "1d20";
        } else if (tableSize <= 100) {
            return "1d100";
        } else {
            // For very large tables, use d100 and modulo the result
            return "1d100";
        }
    }
    
    // Function to map dice result to table index
    function mapDiceResultToTableIndex(diceResult, tableSize) {
        // Map the dice result to a valid table index
        // For example, if we roll a d20 but only have 15 items, we need to map 16-20 to 1-5
        
        // First, ensure the result is at least 1
        let result = Math.max(1, diceResult);
        
        // Then, map it to a valid index (0 to tableSize-1)
        // We use modulo arithmetic, but subtract 1 first and add 1 after to handle the 1-based dice results
        return ((result - 1) % tableSize);
    }
});

