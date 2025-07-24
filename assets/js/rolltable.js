// Table roller functionality
document.addEventListener('DOMContentLoaded', function() {
    // Find all table roller containers on the page
    const tableRollerContainers = document.querySelectorAll('.table-roller-container');
    
    // Initialize each table roller
    tableRollerContainers.forEach(function(container, index) {
        const tableRollerButton = container.querySelector('.table-roller-button');
        const tableRollerResult = container.querySelector('.table-roller-result');
        const tableRollerIcon = container.querySelector('.d20-icon');
        
        // Find the associated content section for this roller
        // If there's a data-content-selector attribute, use that to find the content
        // Otherwise, use the default selector
        const contentSelector = container.getAttribute('data-content-selector') || '.gh-content';
        const contentSection = document.querySelector(contentSelector);
        
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
});
