// ── DeceasedRow.jsx ───────────────────────────────────────────────────────────
// Drop-in replacement for the DeceasedRow component in SurveyForm.jsx
//
// New features vs. original:
//   1. Upload death certificate  — PDF, DOCX, JPG, PNG (unchanged UX, polished UI)
//   2. 📷 Take Photo via camera  — opens device camera, captures image, shows
//      a live preview with a scan-line overlay so it feels like a document scan.
//      The captured image is stored as a File object on rec.certificateFile,
//      exactly like a regular file-upload — so the existing handleSubmit /
//      api_save_deceased backend code works with ZERO changes.
//
// Usage: Replace the existing DeceasedRow function in SurveyForm.jsx with this
// entire block.  No other changes required.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useCallback } from 'react';

// ── Small camera modal ────────────────────────────────────────────────────────
function CameraModal({ onCapture, onClose }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [ready,   setReady]   = useState(false);
  const [flash,   setFlash]   = useState(false);
  const [preview, setPreview] = useState(null); // base64 of captured frame
  const [capturedFile, setCapturedFile] = useState(null);

  // Start camera on mount
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      alert('Camera access denied or unavailable. Please upload a file instead.');
      onClose();
    }
  }, [onClose]);

  // Start camera when modal mounts
  React.useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  // Capture a frame from the video
  const capture = useCallback(() => {
    if (!videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    const video  = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      const ts   = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `death_cert_${ts}.jpg`, { type: 'image/jpeg' });
      setCapturedFile(file);
      setPreview(canvas.toDataURL('image/jpeg', 0.92));
    }, 'image/jpeg', 0.92);
  }, []);

  const retake = () => { setPreview(null); setCapturedFile(null); };

  const confirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 540,
        background: '#0d1117', borderRadius: 16,
        border: '1px solid rgba(239,68,68,0.3)',
        overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'rgba(239,68,68,0.08)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#f87171' }}>Scan Death Certificate</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                {preview ? 'Review capture — retake or confirm' : 'Position document in frame and capture'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.07)', border: 'none',
            color: 'rgba(255,255,255,0.5)', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Viewfinder */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', overflow: 'hidden' }}>

          {/* Live video (hidden when preview shown) */}
          <video
            ref={videoRef}
            autoPlay playsInline muted
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: preview ? 'none' : 'block',
            }}
          />

          {/* Captured preview */}
          {preview && (
            <img src={preview} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {/* Scan-line overlay (only on live view) */}
          {!preview && ready && (
            <>
              {/* Corner brackets */}
              {[
                { top: 14, left: 14, borderTop: '2px solid #f87171', borderLeft: '2px solid #f87171' },
                { top: 14, right: 14, borderTop: '2px solid #f87171', borderRight: '2px solid #f87171' },
                { bottom: 14, left: 14, borderBottom: '2px solid #f87171', borderLeft: '2px solid #f87171' },
                { bottom: 14, right: 14, borderBottom: '2px solid #f87171', borderRight: '2px solid #f87171' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
              ))}
              {/* Scanning line */}
              <div style={{
                position: 'absolute', left: 14, right: 14, height: 2,
                background: 'linear-gradient(90deg, transparent, #f87171, transparent)',
                animation: 'scanLine 2s ease-in-out infinite',
                boxShadow: '0 0 8px #f87171',
              }} />
              <style>{`
                @keyframes scanLine {
                  0%   { top: 14px; opacity: 1; }
                  48%  { top: calc(100% - 14px); opacity: 1; }
                  50%  { top: calc(100% - 14px); opacity: 0; }
                  52%  { top: 14px; opacity: 0; }
                  54%  { top: 14px; opacity: 1; }
                  100% { top: 14px; opacity: 1; }
                }
              `}</style>
            </>
          )}

          {/* Flash overlay */}
          {flash && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,0.6)',
              pointerEvents: 'none',
            }} />
          )}

          {/* Not ready overlay */}
          {!ready && !preview && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Starting camera…</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          padding: '18px 20px',
          background: 'rgba(0,0,0,0.4)',
        }}>
          {!preview ? (
            // Capture button
            <button
              onClick={capture}
              disabled={!ready}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: ready ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'rgba(255,255,255,0.1)',
                border: '3px solid rgba(255,255,255,0.15)',
                cursor: ready ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, boxShadow: ready ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
              title="Capture"
            >📸</button>
          ) : (
            // Retake / Confirm buttons
            <>
              <button onClick={retake} style={{
                padding: '10px 22px', borderRadius: 10,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}>↩ Retake</button>
              <button onClick={confirm} style={{
                padding: '10px 26px', borderRadius: 10,
                background: 'linear-gradient(135deg,#10b981,#34d399)',
                border: 'none', color: '#051612',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 16px rgba(16,185,129,0.3)',
              }}>✓ Use this photo</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── DeceasedRow ───────────────────────────────────────────────────────────────
function DeceasedRow({ rec, index, onChange, onRemove }) {
  const [showCamera, setShowCamera] = useState(false);

  const handleCameraCapture = (file) => {
    onChange(index, 'certificateFile', file);
    setShowCamera(false);
  };

  return (
    <>
      {/* Camera modal (rendered at root level via portal-like absolute positioning) */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div style={{
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 10, padding: 14, marginBottom: 10,
      }}>
        {/* Row header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>Deceased #{index + 1}</span>
          <button onClick={() => onRemove(index)} style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', borderRadius: 6,
            padding: '4px 10px', cursor: 'pointer', fontSize: 12,
          }}>Remove</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Full Name *</label>
            <input className="input" placeholder="Full name" value={rec.name}
              onChange={e => onChange(index, 'name', e.target.value)} />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Voter ID *</label>
            <input className="input" placeholder="Voter ID" value={rec.voterid}
              onChange={e => onChange(index, 'voterid', e.target.value)} />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Gender *</label>
            <select className="input" value={rec.gender} onChange={e => onChange(index, 'gender', e.target.value)}>
              <option value="">— Select —</option>
              {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Age at Death *</label>
            <input className="input" type="number" placeholder="Age" value={rec.ageAtDeath}
              onChange={e => onChange(index, 'ageAtDeath', e.target.value)} />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Date of Birth</label>
            <input className="input" type="date" value={rec.dob || ''}
              onChange={e => onChange(index, 'dob', e.target.value)} />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Date of Death *</label>
            <input className="input" type="date" value={rec.dateOfDeath || ''}
              onChange={e => onChange(index, 'dateOfDeath', e.target.value)} />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>Death Certificate No.</label>
            <input className="input" placeholder="Certificate number" value={rec.deathCertificate}
              onChange={e => onChange(index, 'deathCertificate', e.target.value)} />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 11 }}>House Number</label>
            <input className="input" placeholder="House no." value={rec.houseNumber}
              onChange={e => onChange(index, 'houseNumber', e.target.value)} />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label className="field-label" style={{ fontSize: 11 }}>Address</label>
            <input className="input" placeholder="Address" value={rec.address}
              onChange={e => onChange(index, 'address', e.target.value)} />
          </div>

          {/* ── Death Certificate Document upload section ── */}
          <div style={{ gridColumn: '1/-1' }}>
            <label className="field-label" style={{ fontSize: 11 }}>
              Death Certificate Document
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6, fontWeight: 400 }}>
                PDF · DOCX · JPG · PNG  or  📷 Camera scan
              </span>
            </label>

            {/* Upload area */}
            <div style={{
              border: '1px dashed rgba(239,68,68,0.35)', borderRadius: 10,
              padding: '12px 14px',
              background: rec.certificateFile ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.03)',
              borderColor: rec.certificateFile ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
              transition: 'all 0.2s',
            }}>

              {/* If no file yet — show both action buttons */}
              {!rec.certificateFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

                  {/* File upload button */}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    id={`cert-file-${index}`}
                    style={{ display: 'none' }}
                    onChange={e => onChange(index, 'certificateFile', e.target.files[0] || null)}
                  />
                  <label htmlFor={`cert-file-${index}`} style={{
                    cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', borderRadius: 8,
                    padding: '8px 16px', fontSize: 12, fontWeight: 600,
                    whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
                    transition: 'background 0.15s',
                  }}>
                    📎 Upload File
                  </label>

                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>or</span>

                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    style={{
                      cursor: 'pointer',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171', borderRadius: 8,
                      padding: '8px 16px', fontSize: 12, fontWeight: 600,
                      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    📷 Take Photo
                  </button>

                  <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>No document attached</span>
                </div>
              )}

              {/* File attached — show preview row */}
              {rec.certificateFile && (() => {
                const file   = rec.certificateFile;
                const isImg  = file.type?.startsWith('image/');
                const imgURL = isImg ? URL.createObjectURL(file) : null;
                const isCamera = file.name?.startsWith('death_cert_') && isImg;

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                    {/* Thumbnail for images */}
                    {isImg && imgURL && (
                      <img
                        src={imgURL}
                        alt="Certificate preview"
                        style={{
                          width: 48, height: 48, objectFit: 'cover',
                          borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* File icon for non-images */}
                    {!isImg && (
                      <div style={{
                        width: 48, height: 48, borderRadius: 6, flexShrink: 0,
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      }}>📄</div>
                    )}

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: '#86efac',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {isCamera ? '📷 Camera capture' : `📎 ${file.name}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                        {(file.size / 1024).toFixed(0)} KB
                        {isCamera && (
                          <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 700,
                            background: 'rgba(16,185,129,0.15)', color: '#34d399',
                            borderRadius: 4, padding: '1px 6px',
                          }}>SCANNED</span>
                        )}
                      </div>
                    </div>

                    {/* Replace actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {/* Retake / re-upload */}
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                        id={`cert-replace-${index}`}
                        style={{ display: 'none' }}
                        onChange={e => onChange(index, 'certificateFile', e.target.files[0] || null)}
                      />
                      <label htmlFor={`cert-replace-${index}`} style={{
                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-3)', padding: '4px 8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6, background: 'rgba(255,255,255,0.04)',
                        whiteSpace: 'nowrap',
                      }} title="Replace with file">
                        📎
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--text-3)', padding: '4px 8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, background: 'rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                        }}
                        title="Retake with camera"
                      >📷</button>
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => onChange(index, 'certificateFile', null)}
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--text-3)',
                          fontSize: 16, padding: 0, lineHeight: 1,
                        }}
                        title="Remove file"
                      >✕</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default DeceasedRow;