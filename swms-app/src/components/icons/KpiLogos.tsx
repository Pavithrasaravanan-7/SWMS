import React from 'react';

/**
 * 1. Total Households Logo: Green hands holding/cradling an eco house with roof & chimney.
 * Matches user's exact uploaded KPI logo.
 */
export const TotalHouseholdsLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background soft glow */}
      <circle cx="60" cy="60" r="54" fill="#F0FDF4" opacity="0.6" />
      
      {/* Roof & Chimney */}
      <path 
        d="M60 22L28 48H35V80H85V48H92L60 22Z" 
        fill="#FFFFFF" 
        stroke="#8B4513" 
        strokeWidth="3.5" 
        strokeLinejoin="round" 
      />
      {/* Roof peak line */}
      <path 
        d="M60 19L24 48H34L60 26L86 48H96L60 19Z" 
        fill="#A0522D" 
      />
      {/* Chimney */}
      <rect x="74" y="26" width="7" height="15" fill="#8B4513" rx="1" />
      
      {/* House Front & Door / Window */}
      <rect x="42" y="52" width="14" height="14" rx="2" fill="#E2E8F0" stroke="#047857" strokeWidth="2" />
      <rect x="64" y="52" width="14" height="26" rx="2" fill="#D97706" stroke="#B45309" strokeWidth="2" />
      <circle cx="67" cy="65" r="1.5" fill="#FFFFFF" />

      {/* Small eco leaf on top */}
      <path 
        d="M60 28C60 28 66 22 72 25C72 31 66 34 60 28Z" 
        fill="#16A34A" 
      />

      {/* Left Cupped Hand */}
      <path 
        d="M20 78C20 78 24 64 36 60C44 57 48 64 48 70C48 76 40 86 34 94C30 99 22 96 20 90C19 86 20 78 20 78Z" 
        fill="#064E3B" 
      />
      <path 
        d="M16 88C18 76 28 62 42 58C46 57 48 60 46 64C42 70 34 82 28 94C24 100 15 96 16 88Z" 
        fill="#047857" 
      />
      {/* Left Forearm */}
      <path 
        d="M16 88C22 98 34 102 46 102C38 106 24 105 14 96L16 88Z" 
        fill="#065F46" 
      />

      {/* Right Cupped Hand */}
      <path 
        d="M100 78C100 78 96 64 84 60C76 57 72 64 72 70C72 76 80 86 86 94C90 99 98 96 100 90C101 86 100 78 100 78Z" 
        fill="#064E3B" 
      />
      <path 
        d="M104 88C102 76 92 62 78 58C74 57 72 60 74 64C78 70 86 82 92 94C96 100 105 96 104 88Z" 
        fill="#047857" 
      />
      {/* Right Forearm */}
      <path 
        d="M104 88C98 98 86 102 74 102C82 106 96 105 106 96L104 88Z" 
        fill="#065F46" 
      />

      {/* Palm Connection Base */}
      <path 
        d="M34 94C42 104 52 108 60 108C68 108 78 104 86 94C76 102 68 104 60 104C52 104 44 102 34 94Z" 
        fill="#064E3B" 
      />
    </svg>
  );
};

/**
 * 2. Collected Logo: Green waste collection truck with green recycling symbol + black roof canopy + eco leaf.
 * Matches user's exact uploaded KPI logo.
 */
export const CollectedTruckLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Canopy / Roof Arch over truck */}
      <path 
        d="M18 52L60 25L98 52" 
        stroke="#1E293B" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Eco Leaf on Roof Apex */}
      <g transform="translate(82, 14)">
        <path 
          d="M6 18C6 18 16 16 22 8C22 18 14 24 6 18Z" 
          fill="#22C55E" 
          stroke="#15803D" 
          strokeWidth="1.5" 
        />
        <path 
          d="M8 17C14 14 18 10 20 8" 
          stroke="#15803D" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
        />
      </g>

      {/* Main Truck Cargo Container (Green) */}
      <rect x="22" y="52" width="50" height="34" rx="4" fill="#16A34A" stroke="#15803D" strokeWidth="2" />
      
      {/* Recycling Logo on Cargo (White circular arrows) */}
      <g transform="translate(47, 68) scale(0.75)">
        {/* Top Arrow */}
        <path d="M-6 -8L0 -14L6 -8M0 -14V-2" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom Right Arrow */}
        <path d="M12 2L14 10L6 10M14 10L4 4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom Left Arrow */}
        <path d="M-6 10L-14 10L-12 2M-14 10L-4 4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Truck Cabin (Light Green / White accents) */}
      <path 
        d="M72 60H88C93 60 97 64 98 69L100 80C100 83 98 86 95 86H72V60Z" 
        fill="#22C55E" 
        stroke="#15803D" 
        strokeWidth="2" 
      />
      {/* Cabin Windshield / Window */}
      <path 
        d="M76 64H86C89 64 91 66 92 69L93 74H76V64Z" 
        fill="#E0F2FE" 
        stroke="#0284C7" 
        strokeWidth="1.5" 
      />

      {/* Headlight */}
      <rect x="97" y="78" width="3" height="4" rx="1" fill="#FACC15" />

      {/* Bumper */}
      <rect x="94" y="83" width="7" height="4" rx="1" fill="#64748B" />

      {/* Truck Chassis / Base Bar */}
      <rect x="20" y="84" width="78" height="4" fill="#334155" rx="1" />

      {/* Wheel 1 (Back Left) */}
      <circle cx="34" cy="90" r="8" fill="#1E293B" />
      <circle cx="34" cy="90" r="4.5" fill="#94A3B8" />
      <circle cx="34" cy="90" r="2" fill="#1E293B" />

      {/* Wheel 2 (Back Right / Mid) */}
      <circle cx="56" cy="90" r="8" fill="#1E293B" />
      <circle cx="56" cy="90" r="4.5" fill="#94A3B8" />
      <circle cx="56" cy="90" r="2" fill="#1E293B" />

      {/* Wheel 3 (Front) */}
      <circle cx="86" cy="90" r="8" fill="#1E293B" />
      <circle cx="86" cy="90" r="4.5" fill="#94A3B8" />
      <circle cx="86" cy="90" r="2" fill="#1E293B" />
    </svg>
  );
};

/**
 * 3. Not Collected Logo: Wheelie dustbin/trash can with bold RED 'X' cross over it.
 * Matches user's exact uploaded KPI logo.
 */
export const NotCollectedDustbinLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dustbin Lid Handle */}
      <path 
        d="M50 25H70" 
        stroke="#475569" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      {/* Dustbin Lid */}
      <path 
        d="M36 30H84C86 30 87 32 86 34L83 38H37L34 34C33 32 34 30 36 30Z" 
        fill="#64748B" 
        stroke="#334155" 
        strokeWidth="2" 
      />

      {/* Dustbin Body */}
      <path 
        d="M40 38L45 88C45.5 92 49 95 53 95H67C71 95 74.5 92 75 88L80 38H40Z" 
        fill="#94A3B8" 
        stroke="#475569" 
        strokeWidth="2.5" 
      />

      {/* Vertical Ribs on Dustbin */}
      <line x1="52" y1="46" x2="54" y2="86" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="46" x2="60" y2="86" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      <line x1="68" y1="46" x2="66" y2="86" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

      {/* Dustbin Wheels */}
      <circle cx="76" cy="94" r="5" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
      <circle cx="76" cy="94" r="2" fill="#E2E8F0" />
      <circle cx="44" cy="94" r="5" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
      <circle cx="44" cy="94" r="2" fill="#E2E8F0" />

      {/* BOLD RED 'X' CROSS OVER THE DUSTBIN */}
      <line 
        x1="26" 
        y1="26" 
        x2="94" 
        y2="96" 
        stroke="#DC2626" 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
      <line 
        x1="94" 
        y1="26" 
        x2="26" 
        y2="96" 
        stroke="#DC2626" 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
      {/* Inner highlight for 3D red cross effect */}
      <line 
        x1="26" 
        y1="26" 
        x2="94" 
        y2="96" 
        stroke="#EF4444" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />
      <line 
        x1="94" 
        y1="26" 
        x2="26" 
        y2="96" 
        stroke="#EF4444" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

/**
 * 4. Pending / Locked Logo: Red circular clock with red clock hands.
 * Matches user's exact uploaded KPI logo.
 */
export const PendingLockedClockLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Circle Ring (Red) */}
      <circle 
        cx="60" 
        cy="60" 
        r="44" 
        stroke="#DC2626" 
        strokeWidth="7" 
        fill="#FFFFFF" 
      />
      {/* Subtle Inner Ring */}
      <circle 
        cx="60" 
        cy="60" 
        r="36" 
        fill="#FEF2F2" 
        opacity="0.6" 
      />

      {/* Center Pivot Point */}
      <circle 
        cx="60" 
        cy="60" 
        r="4" 
        fill="#DC2626" 
      />

      {/* Hour Hand (Pointing Up / 12) */}
      <line 
        x1="60" 
        y1="60" 
        x2="60" 
        y2="34" 
        stroke="#DC2626" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />

      {/* Minute Hand (Pointing Right / 3) */}
      <line 
        x1="60" 
        y1="60" 
        x2="80" 
        y2="60" 
        stroke="#DC2626" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />

      {/* 12, 3, 6, 9 Hour Markers */}
      <circle cx="60" cy="24" r="2.5" fill="#EF4444" />
      <circle cx="96" cy="60" r="2.5" fill="#EF4444" />
      <circle cx="60" cy="96" r="2.5" fill="#EF4444" />
      <circle cx="24" cy="60" r="2.5" fill="#EF4444" />
    </svg>
  );
};
