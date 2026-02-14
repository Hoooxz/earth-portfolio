'use client';

import { useState } from 'react';

export interface LayerControlPanelProps {
  layers: {
    id: string;
    label: string;
    visible: boolean;
    opacity: number;
  }[];
  onToggleLayer: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function LayerControlPanel({
  layers,
  onToggleLayer,
  onOpacityChange,
  onRefresh,
  loading = false,
}: LayerControlPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '280px',
        background: 'rgba(10, 14, 39, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        padding: '16px',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: expanded ? '16px' : '0',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#00d4ff',
          }}
        >
          🌍 图层控制
        </h3>
        <span
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </div>

      {/* Layer Controls */}
      {expanded && (
        <>
          <div style={{ marginBottom: '16px' }}>
            {layers.map((layer) => (
              <div
                key={layer.id}
                style={{
                  marginBottom: '12px',
                  padding: '8px',
                  background: 'rgba(0, 212, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                {/* Checkbox and Label */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => onToggleLayer(layer.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 500,
                      color: layer.visible ? '#ffffff' : '#888888',
                    }}
                  >
                    {layer.label}
                  </span>
                </label>

                {/* Opacity Slider */}
                {layer.visible && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '24px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#888888',
                        marginRight: '8px',
                        minWidth: '40px',
                      }}
                    >
                      透明度
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={layer.opacity}
                      onChange={(e) =>
                        onOpacityChange(layer.id, parseFloat(e.target.value))
                      }
                      style={{
                        flex: 1,
                        height: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#888888',
                        marginLeft: '8px',
                        minWidth: '40px',
                        textAlign: 'right',
                      }}
                    >
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: loading
                  ? 'rgba(0, 212, 255, 0.2)'
                  : 'rgba(0, 212, 255, 0.3)',
                border: '1px solid rgba(0, 212, 255, 0.5)',
                borderRadius: '8px',
                color: '#00d4ff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background =
                    'rgba(0, 212, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background =
                    'rgba(0, 212, 255, 0.3)';
                }
              }}
            >
              {loading ? '⏳ 刷新中...' : '🔄 刷新数据'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
