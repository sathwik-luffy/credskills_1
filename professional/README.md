# CredSkill — GitHub-ready offline working model

No API keys, Docker, Python server, Gemini, Judge0 or Piston are required.

## Meeting behavior
- `Join Meeting` opens a dedicated `meeting.html` page.
- The learner sees a real waiting room until the teacher joins.
- Camera/microphone controls use the browser.
- Screen sharing uses the browser.
- The safety notice is always visible beside the meeting.
- Live transcript uses browser SpeechRecognition where supported.
- Final transcript results are de-duplicated so silence/restarts do not repeat the previous sentence forever.

This offline version does not pretend to provide cross-network production video signaling. Production video should later use WebRTC signaling + TURN or a managed provider.
