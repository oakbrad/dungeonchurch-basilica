// Table scroll effects
document.addEventListener('DOMContentLoaded', function() {
    // Find the table container and content
    const contentSection = document.querySelector('.gh-content');
    const tables = contentSection ? contentSection.querySelectorAll('table') : [];
    
    // Only proceed if we have tables
    if (tables.length === 0) return;
    
    // Get the first table (main table for the page)
    const table = tables[0];
    
    // Create background sigil element
    const backgroundSigil = document.createElement('div');
    backgroundSigil.className = 'background-sigil';
    backgroundSigil.innerHTML = document.querySelector('.partials-sigil-template').innerHTML;
    document.body.appendChild(backgroundSigil);
    
    // Progress indicator is now handled by the reading-progress partial
    
    // Variables to track scroll state
    let ticking = false;
    let tableTop = table.getBoundingClientRect().top + window.pageYOffset;
    let tableBottom = tableTop + table.offsetHeight;
    let windowHeight = window.innerHeight;

    // Calculate if the table is long enough to warrant sigil effect
    // We'll consider "long" as more than 2x the viewport height
    let isLongTable = table.offsetHeight > (windowHeight * 2);
    
    // Function to handle scroll effects
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Calculate scroll percentage through the table
        const tableScrollPercentage = Math.min(100, Math.max(0,
            ((scrollTop - tableTop) / (tableBottom - tableTop - windowHeight)) * 100
        ));

        // Only show sigil effect if the table is long enough
        if (isLongTable) {
            // Show background sigil when scrolled past first viewport of table
            // AND hide it when scrolled past the table
            if (scrollTop > tableTop + (windowHeight / 2) && scrollTop < tableBottom) {
                backgroundSigil.classList.add('visible');
                
                // More dramatic rotation based on scroll position
                const rotation = (tableScrollPercentage / 100) * 80 - 20; // -20 to +60 degrees
                backgroundSigil.querySelector('svg').style.transform = 
                    `scale(1.2) rotate(${rotation}deg)`;
            } else {
                backgroundSigil.classList.remove('visible');
            }
        }
        
        ticking = false;
    }
    
    // Listen for scroll events with requestAnimationFrame for performance
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    });
    
    // Update dimensions on window resize
    window.addEventListener('resize', function() {
        windowHeight = window.innerHeight;
        tableTop = table.getBoundingClientRect().top + window.pageYOffset;
        tableBottom = tableTop + table.offsetHeight;
        isLongTable = table.offsetHeight > (windowHeight * 2);
    });
    
    // Initial call to set up the state
    handleScroll();
});
