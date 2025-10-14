import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{
            position: 'absolute',
          }}
        >
          <rect x="10" y="20" width="100" height="70" fill="white" rx="8" />
          <rect x="15" y="25" width="90" height="60" fill="#0f172a" rx="4" />
          <path
            d="M 30 45 L 45 50 L 30 55"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 55 45 L 70 50 L 55 55"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 80 45 L 95 50 L 80 55"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: 'white',
            marginTop: 90,
          }}
        >
          EPG
        </div>
      </div>
    ),
    size
  );
}

