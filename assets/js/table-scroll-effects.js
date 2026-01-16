// Table scroll effects
(function() {
    let backgroundSigil = null;
    let table = null;
    let ticking = false;
    let tableTop = 0;
    let tableBottom = 0;
    let windowHeight = 0;
    let isLongTable = false;
    let scrollHandler = null;
    let resizeHandler = null;

    // Function to handle scroll effects
    function handleScroll() {
        if (!table || !backgroundSigil) {
            ticking = false;
            return;
        }

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
                const svg = backgroundSigil.querySelector('svg');
                if (svg) {
                    svg.style.transform = `scale(1.2) rotate(${rotation}deg)`;
                }
            } else {
                backgroundSigil.classList.remove('visible');
            }
        }

        ticking = false;
    }

    function updateDimensions() {
        if (!table) return;
        windowHeight = window.innerHeight;
        tableTop = table.getBoundingClientRect().top + window.pageYOffset;
        tableBottom = tableTop + table.offsetHeight;
        isLongTable = table.offsetHeight > (windowHeight * 2);
    }

    // Initialize or reinitialize with a specific table element
    // Can be called after dynamically loading a table
    function initTableScrollEffects(targetTable) {
        // Use provided table or find one in the page
        if (targetTable) {
            table = targetTable;
        } else {
            // Look for tables in both .gh-content and .table-roller-table-container
            const contentSection = document.querySelector('.gh-content');
            const rollerContainer = document.querySelector('.table-roller-table-container');

            let tables = [];
            if (contentSection) {
                tables = tables.concat(Array.from(contentSection.querySelectorAll('table')));
            }
            if (rollerContainer) {
                tables = tables.concat(Array.from(rollerContainer.querySelectorAll('table')));
            }

            if (tables.length === 0) return;
            table = tables[0];
        }

        // Create background sigil element if it doesn't exist
        if (!backgroundSigil) {
            const sigilTemplate = document.querySelector('.partials-sigil-template');
            if (!sigilTemplate) return;

            backgroundSigil = document.createElement('div');
            backgroundSigil.className = 'background-sigil';
            backgroundSigil.innerHTML = sigilTemplate.innerHTML;
            document.body.appendChild(backgroundSigil);
        }

        // Update dimensions for the new table
        updateDimensions();

        // Set up event listeners (only once)
        if (!scrollHandler) {
            scrollHandler = function() {
                if (!ticking) {
                    window.requestAnimationFrame(handleScroll);
                    ticking = true;
                }
            };
            window.addEventListener('scroll', scrollHandler);
        }

        if (!resizeHandler) {
            resizeHandler = function() {
                updateDimensions();
            };
            window.addEventListener('resize', resizeHandler);
        }

        // Initial call to set up the state
        handleScroll();
    }

    // Expose the init function globally so rolltable.js can call it
    window.initTableScrollEffects = initTableScrollEffects;

    // Auto-initialize on DOMContentLoaded for markdown tables
    document.addEventListener('DOMContentLoaded', function() {
        initTableScrollEffects();
    });
})();
