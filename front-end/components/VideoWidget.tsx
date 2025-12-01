'use client';

import React, { useState } from 'react';

interface Store {
  _id: string;
  name: string;
  videoUrl?: string;
  clickableLink?: string;
}

interface VideoWidgetProps {
  store: Store;
}

export default function VideoWidget({ store }: VideoWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!store.videoUrl) {
    return null;
  }

  const generateEmbedCode = () => {
    const embedCode = `<!-- Mersiv Video Widget -->
<div id="mersiv-video-widget"></div>
<script>
(function() {
  const storeId = '${store._id}';
  const apiUrl = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}';
  
  // Fetch store data
  fetch(apiUrl + '/api/stores/' + storeId)
    .then(res => res.json())
    .then(store => {
      if (!store.videoUrl) {
        console.error('Mersiv Widget: No videoUrl found for store');
        return;
      }
      
      const widget = document.getElementById('mersiv-video-widget');
      if (!widget) {
        console.error('Mersiv Widget: Element #mersiv-video-widget not found');
        return;
      }
      
      widget.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:999999;width:300px;cursor:pointer;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.3);transition:transform 0.2s;';
      
      // Create video banner
      const isYouTube = store.videoUrl.includes('youtube.com') || store.videoUrl.includes('youtu.be');
      const banner = document.createElement(isYouTube ? 'iframe' : 'video');
      
      if (isYouTube) {
        banner.src = store.videoUrl;
        banner.style.cssText = 'width:100%;aspect-ratio:16/9;border:none;display:block;pointer-events:none;';
        banner.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        banner.setAttribute('allowfullscreen', 'true');
        banner.setAttribute('frameborder', '0');
        banner.setAttribute('loading', 'eager');
      } else {
        banner.src = store.videoUrl;
        banner.autoplay = true;
        banner.loop = true;
        banner.muted = true;
        banner.playsInline = true;
        banner.style.cssText = 'width:100%;display:block;';
      }
      
      widget.appendChild(banner);
      
      // Hover effect
      widget.onmouseenter = function() { widget.style.transform = 'scale(1.05)'; };
      widget.onmouseleave = function() { widget.style.transform = 'scale(1)'; };
      
      // Click to open modal
      widget.onclick = function() {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:1000000;display:flex;align-items:center;justify-content:center;';
        
        const content = document.createElement('div');
        content.style.cssText = 'position:relative;width:90%;height:90%;max-width:1400px;background:white;border-radius:12px;overflow:hidden;';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'position:absolute;top:16px;right:16px;width:44px;height:44px;background:rgba(0,0,0,0.8);color:white;border:none;border-radius:50%;font-size:28px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;';
        closeBtn.onmouseover = function() { closeBtn.style.background = 'black'; };
        closeBtn.onmouseout = function() { closeBtn.style.background = 'rgba(0,0,0,0.8)'; };
        closeBtn.onclick = function() { document.body.removeChild(modal); };
        
        const iframe = document.createElement('iframe');
        iframe.src = store.clickableLink || window.location.href;
        iframe.style.cssText = 'width:100%;height:100%;border:none;';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        
        content.appendChild(closeBtn);
        content.appendChild(iframe);
        modal.appendChild(content);
        modal.onclick = function(e) { if (e.target === modal) document.body.removeChild(modal); };
        document.body.appendChild(modal);
      };
      
      console.log('Mersiv Widget loaded successfully for store:', store.name);
    })
    .catch(err => console.error('Mersiv Widget Error:', err));
})();
</script>`;
    return embedCode;
  };

  const copyEmbedCode = async () => {
    const embedCode = generateEmbedCode();
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* Video Banner */}
      <div className="fixed bottom-5 left-5 z-[999999]">
        <div
          className={`w-[300px] cursor-pointer rounded-xl overflow-hidden shadow-xl transition-transform duration-200 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          onClick={() => setShowModal(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {store.videoUrl.includes('youtube.com') || store.videoUrl.includes('youtu.be') ? (
            <iframe
              src={store.videoUrl}
              className="w-full aspect-video block border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={store.name}
              loading="eager"
            />
          ) : (
            <video
              src={store.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full block"
              onError={() => {
                console.error('❌ Video failed to load:', store.videoUrl);
              }}
              onLoadedData={() => {
                console.log('✅ Video loaded successfully');
              }}
            />
          )}
        </div>
        
        {/* Get Embed Code Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEmbedCode(true);
          }}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-lg"
        >
          📋 Get Embed Code
        </button>
      </div>

      {/* Embed Code Modal */}
      {showEmbedCode && (
        <div
          className="fixed inset-0 bg-black/90 z-[1000001] flex items-center justify-center p-4"
          onClick={() => setShowEmbedCode(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <button
                onClick={() => setShowEmbedCode(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-2xl transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-2">Video Widget Embed Code</h2>
              <p className="text-blue-100">Copy and paste this code into your website</p>
            </div>
            
            {/* Code Content */}
            <div className="p-6">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
                  {generateEmbedCode()}
                </pre>
                
                {/* Copy Button */}
                <button
                  onClick={copyEmbedCode}
                  className={`absolute top-3 right-3 ${
                    copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Instructions */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📖 How to Use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Copy the embed code above</li>
                  <li>Paste it into your website&apos;s HTML</li>
                  <li>The widget will appear in the bottom-left corner</li>
                  <li>Clicking the video opens a modal with your clickable link</li>
                </ol>
              </div>
              
              {/* Widget Info */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-600 font-medium">Store</div>
                  <div className="text-gray-900 font-semibold">{store.name}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-600 font-medium">Store ID</div>
                  <div className="text-gray-900 font-mono text-xs">{store._id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Store Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/90 z-[1000000] flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-[90%] h-[90%] max-w-[1400px] bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-11 h-11 bg-black/80 hover:bg-black text-white rounded-full z-10 flex items-center justify-center text-3xl leading-none transition-colors"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Iframe */}
            <iframe
              src={store.clickableLink || window.location.href}
              className="w-full h-full border-none"
              title={store.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      )}
    </>
  );
}
