// Livestream checker for conditionally displaying livestream content
document.addEventListener('DOMContentLoaded', function() {
    // Function to check stream status
    function checkStreamStatus() {
        return fetch('https://live.dungeon.church/memfs/9427a5bf-a270-4cec-9bf5-6e873a79269e.m3u8', {
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

    // Create the livestream info banner
    function createLivestreamBanner() {
        const banner = document.createElement('div');
        banner.id = 'livestream-banner';
        banner.innerHTML = `
            <div class="inner">
                <p>LIVE on <a href="https://twitch.tv/dungeon_church" target="_blank">Twitch</a> / 
                <a href="https://youtube.com/@dungeon_church" target="_blank">YouTube</a> / 
                <a href="https://streamplace.live/dungeon_church" target="_blank">StreamPlace</a></p>
            </div>
        `;
        return banner;
    }

    // Function to update the display based on stream status
    function updateStreamDisplay(isStreamActive) {
        const coverContainer = document.querySelector('.site-header-content');
        if (!coverContainer) return;

        // Get the site-header-inner element (floating text)
        const headerInner = coverContainer.querySelector('.site-header-inner');

        // Get or create livestream iframe
        let livestreamIframe = document.getElementById('livestream-iframe');
        if (!livestreamIframe && isStreamActive) {
            livestreamIframe = document.createElement('iframe');
            livestreamIframe.id = 'livestream-iframe';
            livestreamIframe.src = 'https://live.dungeon.church/9427a5bf-a270-4cec-9bf5-6e873a79269e.html';
            livestreamIframe.setAttribute('frameborder', 'no');
            livestreamIframe.setAttribute('scrolling', 'no');
            livestreamIframe.setAttribute('allowfullscreen', 'true');
            livestreamIframe.classList.add('site-header-cover', 'livestream-active');
        }

        // Get the cover image
        const coverImage = coverContainer.querySelector('img.site-header-cover');
        
        // Get or create the livestream banner
        let livestreamBanner = document.getElementById('livestream-banner');
        if (!livestreamBanner && isStreamActive) {
            livestreamBanner = createLivestreamBanner();
            
            // Insert the banner between the header and main content
            const siteMain = document.getElementById('site-main');
            if (siteMain) {
                siteMain.parentNode.insertBefore(livestreamBanner, siteMain);
            }
        }
        
        if (isStreamActive) {
            // If we have a cover image, replace it with the livestream
            if (coverImage && livestreamIframe) {
                // If the iframe isn't already in the DOM, insert it
                if (!document.getElementById('livestream-iframe')) {
                    coverImage.style.display = 'none';
                    coverContainer.insertBefore(livestreamIframe, coverImage);
                }
            }
            
            // Hide the site-header-inner (floating text)
            if (headerInner) {
                headerInner.style.display = 'none';
            }
            
            // Show the livestream banner
            if (livestreamBanner) {
                livestreamBanner.style.display = 'block';
            }
        } else {
            // Stream is not active, show the cover image and remove the iframe
            if (coverImage) {
                coverImage.style.display = '';
            }
            
            // Remove the iframe if it exists
            if (livestreamIframe && livestreamIframe.parentNode) {
                livestreamIframe.parentNode.removeChild(livestreamIframe);
            }
            
            // Show the site-header-inner (floating text)
            if (headerInner) {
                headerInner.style.display = '';
            }
            
            // Remove the livestream banner if it exists
            if (livestreamBanner && livestreamBanner.parentNode) {
                livestreamBanner.parentNode.removeChild(livestreamBanner);
            }
        }
    }

    // Add CSS for the livestream iframe and banner
    const style = document.createElement('style');
    style.textContent = `
        iframe.site-header-cover.livestream-active {
            width: 100%;
            height: 100%;
            min-height: 40vh;
            object-fit: cover;
            margin: 0;
            padding: 0;
            display: block;
        }
        
        #livestream-banner {
            background-color: var(--ghost-accent-color, #e50914);
            color: white;
            text-align: center;
            padding: 0.5rem 0;
            font-weight: bold;
            font-size: 1.2rem;
            margin: 0;
        }
        
        #livestream-banner .inner {
            max-width: 1040px;
            margin: 0 auto;
        }
        
        #livestream-banner p {
            margin: 0;
            padding: 0;
        }
        
        #livestream-banner a {
            color: white;
            text-decoration: underline;
        }
        
        #livestream-banner a:hover {
            text-decoration: none;
        }
        
        @media (max-width: 650px) {
            iframe.site-header-cover.livestream-active {
                min-height: 30vh;
            }
            
            #livestream-banner {
                font-size: 1rem;
                padding: 0.4rem 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initial check
    checkStreamStatus().then(updateStreamDisplay);
    
    // Set up periodic checks every 10 seconds
    setInterval(() => {
        checkStreamStatus().then(updateStreamDisplay);
    }, 10000);
});

