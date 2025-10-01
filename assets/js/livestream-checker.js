// Livestream checker for conditionally displaying livestream content
document.addEventListener('DOMContentLoaded', function() {
    // Create livestream container if it doesn't exist
    let livestreamContainer = document.getElementById('livestream-container');
    if (!livestreamContainer) {
        livestreamContainer = document.createElement('div');
        livestreamContainer.id = 'livestream-container';
        livestreamContainer.innerHTML = `
            <div class="inner">
                <iframe src="https://live.dungeon.church/57f8d0b3-3324-4467-bacb-ffc6f7f2ed40.html" 
                        width="640" height="360" 
                        frameborder="no" 
                        scrolling="no" 
                        allowfullscreen="true">
                </iframe>
            </div>
        `;
        livestreamContainer.style.display = 'none';
        
        // Insert after header but before main content
        const siteMain = document.getElementById('site-main');
        if (siteMain) {
            siteMain.parentNode.insertBefore(livestreamContainer, siteMain);
        }
    }

    // Function to check stream status
    function checkStreamStatus() {
        return fetch('https://live.dungeon.church/memfs/57f8d0b3-3324-4467-bacb-ffc6f7f2ed40.m3u8', {
            method: 'HEAD',  // Use HEAD request to avoid downloading the entire file
            cache: 'no-store',  // Avoid caching to get fresh status
            mode: 'cors'  // Handle CORS if needed
        })
        .then(response => {
            return response.ok;  // Stream is active if response is OK (200)
        })
        .catch(() => {
            return false;  // Stream is not active if request fails
        });
    }

    // Function to update the display based on stream status
    function updateStreamDisplay(isStreamActive) {
        const coverContainer = document.querySelector('.site-header-content');
        
        if (isStreamActive) {
            // Show livestream
            livestreamContainer.style.display = 'block';
            
            // Modify header if needed
            if (coverContainer) {
                // Keep the header but hide the cover image
                const coverImage = coverContainer.querySelector('.site-header-cover');
                if (coverImage) {
                    coverImage.style.display = 'none';
                }
            }
        } else {
            // Hide livestream
            livestreamContainer.style.display = 'none';
            
            // Restore header
            if (coverContainer) {
                const coverImage = coverContainer.querySelector('.site-header-cover');
                if (coverImage) {
                    coverImage.style.display = '';
                }
            }
        }
    }

    // Add CSS for the livestream container
    const style = document.createElement('style');
    style.textContent = `
        #livestream-container {
            margin: 0 auto;
            padding: 2vw 0;
            text-align: center;
            background-color: #000;
        }
        #livestream-container .inner {
            max-width: 1040px;
            margin: 0 auto;
        }
        #livestream-container iframe {
            max-width: 100%;
            height: auto;
            aspect-ratio: 16/9;
        }
        @media (max-width: 650px) {
            #livestream-container {
                padding: 4vw 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initial check
    checkStreamStatus().then(updateStreamDisplay);
    
    // Set up periodic checks every 30 seconds
    setInterval(() => {
        checkStreamStatus().then(updateStreamDisplay);
    }, 30000);
});

