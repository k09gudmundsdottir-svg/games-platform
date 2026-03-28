import React, { useState, useRef, useEffect } from 'react';

const JITSI_DOMAIN = 'meet.jit.si';

export default function JitsiPanel({ roomCode, mandatory = false, displayName = 'Player' }) {
  const [expanded, setExpanded] = useState(mandatory);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);

  const jitsiRoomName = `AzureNexus-${roomCode}`;

  const jitsiUrl = `https://${JITSI_DOMAIN}/${encodeURIComponent(jitsiRoomName)}` +
    `#userInfo.displayName="${encodeURIComponent(displayName)}"` +
    `&config.startWithAudioMuted=true` +
    `&config.startWithVideoMuted=true` +
    `&config.prejoinPageEnabled=false` +
    `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
    `&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","chat","hangup"]`;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div
          ref={containerRef}
          className="w-80 h-60 md:w-96 md:h-72 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl shadow-black/50 bg-gray-900"
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Connecting video...</span>
              </div>
            </div>
          )}
          <iframe
            src={jitsiUrl}
            title="Video Chat"
            className="w-full h-full border-0"
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
            onLoad={() => setLoaded(true)}
          />
        </div>
      )}

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm shadow-lg transition-all duration-200 ${
          expanded
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/25'
        }`}
        title={expanded ? 'Close video' : 'Open video chat'}
      >
        <span className="text-lg">{expanded ? '📵' : '📹'}</span>
        {expanded ? 'Close Video' : 'Video Chat'}
        {mandatory && !expanded && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-300 rounded-full uppercase tracking-wider font-bold">
            Required
          </span>
        )}
      </button>
    </div>
  );
}
