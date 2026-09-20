import React from 'react';

interface AnimatedNavbarLogoProps {
  size?: number;
  className?: string;
  isLightHeader?: boolean;
}

export const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = ({
  size = 44,
  className = '',
  isLightHeader = false,
}) => {
  // Base64 mask of the exact Deon Studios logo shape with uniform thickness,
  // square bounding box, concentric arc and circular cutout, and horizontal slit.
  const logoMask =
    'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0aCBkPSJNIDIwLDIwIEwgMTAwLDIwIEEgODAsODAgMCAwLDEgMTgwLDEwMCBBIDgwLDgwIDAgMCwxIDEwMCwxODAgTCAyMCwxODAgTCAyMCwxMDMgTCA1OC4xMSwxMDMgQSA0Miw0MiAwIDEsMCA1OC4xMSw5NyBMIDIwLDk3IEwgMjAsMjAgWiIgZmlsbD0iYmxhY2siLz48L3N2Zz4=")';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group transition-transform duration-300 hover:scale-[1.04] ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Deon Studios"
    >
      {/* 
        Container with CSS mask of the logo:
        Everything inside this div is clipped to the exact contour of the Deon Studios logo.
      */}
      <div
        className="w-full h-full relative overflow-hidden transition-all duration-300"
        style={{
          maskImage: logoMask,
          WebkitMaskImage: logoMask,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
      >
        {/* Deep Basin Base: Provides oceanic depth to the bowl */}
        <div className="absolute inset-0 bg-[#040a11]" />

        {/* 
          Layer 1: Primary Horizontal & Transverse Water Slosh
          Surges left and right, climbing the rim and splashing across with continuous fluid momentum.
          Negative palette: electric aqua, vibrant cyan, deep navy abyss.
        */}
        <div
          className="absolute -inset-[90%] rounded-full animate-water-slosh-a opacity-95"
          style={{
            background: `radial-gradient(ellipse 65% 55% at 45% 48%,
              #71bbca 0%,
              #4397ab 28%,
              #27697b 52%,
              #142d3c 74%,
              #050e18 100%
            )`,
          }}
        />

        {/* 
          Layer 2: Vertical & Angular Counter-Slosh
          Surges top-to-bottom and rebounds across opposing edges out-of-sync with Layer 1.
          Negative palette: raspberry rose, ruby plum, amethyst, shimmering into cyan.
        */}
        <div
          className="absolute -inset-[85%] rounded-full animate-water-slosh-b mix-blend-screen opacity-80"
          style={{
            background: `radial-gradient(ellipse 60% 60% at 55% 52%,
              #b25766 0%,
              #8b3c4a 32%,
              #4397ab 62%,
              #142d3c 85%,
              transparent 100%
            )`,
          }}
        />

        {/* 
          Layer 3: Cross-Current Diagonal Slosh & Swell
          Surges diagonally from corners (bottom-left to top-right and vice-versa) with prime period 14.7s.
          Eliminates any predictable pattern or cycle, making waves feel entirely stochastic.
        */}
        <div
          className="absolute -inset-[95%] rounded-full animate-water-slosh-c mix-blend-screen opacity-75"
          style={{
            background: `radial-gradient(circle at 40% 60%,
              #38bdf8 0%,
              #4792a3 30%,
              #974451 58%,
              #050e18 88%,
              transparent 100%
            )`,
          }}
        />

        {/* 
          Layer 4: Liquid Caustic Ripple & Surface Crest
          Gentle surface tension breathing and refracted highlights simulating liquid light caustics.
        */}
        <div
          className="absolute -inset-[70%] rounded-full animate-water-ripple mix-blend-screen opacity-70 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 48% 46%,
              rgba(113, 187, 202, 0.95) 0%,
              rgba(56, 189, 248, 0.5) 30%,
              rgba(178, 87, 102, 0.35) 60%,
              transparent 85%
            )`,
          }}
        />

        {/* 
          Layer 5: Adaptive Contrast Overlay
          Guarantees readability and contrast on both bright light pages and dark hero photography.
        */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            isLightHeader
              ? 'opacity-25 bg-[#032030] mix-blend-multiply'
              : 'opacity-15 bg-[#38bdf8] mix-blend-screen'
          }`}
        />
      </div>

      {/* 
        Crisp vector outline overlay:
        Maintains razor-sharp pixel edge definition on high-density displays.
      */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 20,20 L 100,20 A 80,80 0 0,1 180,100 A 80,80 0 0,1 100,180 L 20,180 L 20,103 L 58.11,103 A 42,42 0 1,0 58.11,97 L 20,97 L 20,20 Z"
          stroke={isLightHeader ? 'rgba(10, 35, 50, 0.22)' : 'rgba(113, 187, 202, 0.35)'}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

export default AnimatedNavbarLogo;
