import localCmPhoto from '../assets/cm_stalin.jpg';
import localCcmcLogo from '../assets/ccmc_logo.jpg';
import localCommissionerPhoto from '../assets/commissioner.jpg';
import localTotalCollected from '../assets/total_collected.jpg';
import localHouseholdCovered from '../assets/household_covered.jpg';
import localHouseholdNotCovered from '../assets/household_not_covered.jpg';
import localLiveGps from '../assets/live_gps.jpg';
import localAiPrediction from '../assets/ai_prediction_icon.jpg';
import localVehicleAssignment from '../assets/images/vehicle_assignment_1788169899349.jpg';
import loginBackgroundImg from '../assets/images/swms_exact_bg_1787311840654.jpg';

// User-specified CM Logo URL
export const CM_LOGO_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4ea0deQgUTsKEUDvVMOznEKHOU7klVFrJQ-Kc-cQMjpWcNXG8JCvOVSqc&s=10';
export const CCMC_LOGO_URL = 'https://ccmc.gov.in/img/upload/icon.png';
export const LIVE_GPS_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIj06f6-crEgnX5909hdgIHpFkyk93N3q3uUZVJ_QdQA&s=10';
export const COLLECTED_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhjRxIas0GNrojwojRiQPKEYYH35KJqhGyGkrwU-RwPbczIzKohb0Iv1M&s=10';
export const TOTAL_COLLECTED_URL = 'https://www.shutterstock.com/image-photo/pile-overflowing-black-garbage-bags-260nw-2489341561.jpg';
export const NOT_COVERED_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbrkLyKG-PQyuS21yJXta-22SFt61yZxKlKtYk11I3qA&s=10';
export const FREQUENTLY_NOT_COLLECTED_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT5XGvVWaICoDNXHMp0FWLGf6eV5RiHqypmHgI4nW4pw&s=10';
export const ALERTS_LOGO_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYibsjsoTix6LtGbiGD2TTa_L0GfB3q8bEDBqXyhaD3g&s=10';
export const REPORT_LOGO_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEw1Lp2FuHDM_T4SfHu8-lFNX0Hg_N0OlfxOJlV6mmEA&s=10';
export const COMMISSIONER_LOGO_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMVfboAHnHeLrXRF9BYf7XS5MqRrylsVubACDvH01IEQ&s=10';
export const VEHICLE_ASSIGNMENT_LOGO_URL = localVehicleAssignment;

export const loginBgImage = loginBackgroundImg;

export const cmPhoto = CM_LOGO_URL;
export const cmFallbackPhoto = localCmPhoto;
export const ccmcLogo = CCMC_LOGO_URL;
export const ccmcFallbackLogo = localCcmcLogo;
export const commissionerPhoto = COMMISSIONER_LOGO_URL;
export const commissionerFallbackPhoto = localCommissionerPhoto;

// KPI Card Logos matching user specification
export const TOTAL_HOUSEHOLDS_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="54" fill="#F0FDF4" opacity="0.6"/>
  <path d="M60 22L28 48H35V80H85V48H92L60 22Z" fill="#FFFFFF" stroke="#8B4513" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M60 19L24 48H34L60 26L86 48H96L60 19Z" fill="#A0522D"/>
  <rect x="74" y="26" width="7" height="15" fill="#8B4513" rx="1"/>
  <rect x="42" y="52" width="14" height="14" rx="2" fill="#E2E8F0" stroke="#047857" stroke-width="2"/>
  <rect x="64" y="52" width="14" height="26" rx="2" fill="#D97706" stroke="#B45309" stroke-width="2"/>
  <circle cx="67" cy="65" r="1.5" fill="#FFFFFF"/>
  <path d="M60 28C60 28 66 22 72 25C72 31 66 34 60 28Z" fill="#16A34A"/>
  <path d="M20 78C20 78 24 64 36 60C44 57 48 64 48 70C48 76 40 86 34 94C30 99 22 96 20 90C19 86 20 78 20 78Z" fill="#064E3B"/>
  <path d="M16 88C18 76 28 62 42 58C46 57 48 60 46 64C42 70 34 82 28 94C24 100 15 96 16 88Z" fill="#047857"/>
  <path d="M16 88C22 98 34 102 46 102C38 106 24 105 14 96L16 88Z" fill="#065F46"/>
  <path d="M100 78C100 78 96 64 84 60C76 57 72 64 72 70C72 76 80 86 86 94C90 99 98 96 100 90C101 86 100 78 100 78Z" fill="#064E3B"/>
  <path d="M104 88C102 76 92 62 78 58C74 57 72 60 74 64C78 70 86 82 92 94C96 100 105 96 104 88Z" fill="#047857"/>
  <path d="M104 88C98 98 86 102 74 102C82 106 96 105 106 96L104 88Z" fill="#065F46"/>
  <path d="M34 94C42 104 52 108 60 108C68 108 78 104 86 94C76 102 68 104 60 104C52 104 44 102 34 94Z" fill="#064E3B"/>
</svg>
`)}`;

export const COLLECTED_TRUCK_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 52L60 25L98 52" stroke="#1E293B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(82, 14)">
    <path d="M6 18C6 18 16 16 22 8C22 18 14 24 6 18Z" fill="#22C55E" stroke="#15803D" stroke-width="1.5"/>
    <path d="M8 17C14 14 18 10 20 8" stroke="#15803D" stroke-width="1.2" stroke-linecap="round"/>
  </g>
  <rect x="22" y="52" width="50" height="34" rx="4" fill="#16A34A" stroke="#15803D" stroke-width="2"/>
  <g transform="translate(47, 68) scale(0.75)">
    <path d="M-6 -8L0 -14L6 -8M0 -14V-2" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 2L14 10L6 10M14 10L4 4" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-6 10L-14 10L-12 2M-14 10L-4 4" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <path d="M72 60H88C93 60 97 64 98 69L100 80C100 83 98 86 95 86H72V60Z" fill="#22C55E" stroke="#15803D" stroke-width="2"/>
  <path d="M76 64H86C89 64 91 66 92 69L93 74H76V64Z" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>
  <rect x="97" y="78" width="3" height="4" rx="1" fill="#FACC15"/>
  <rect x="94" y="83" width="7" height="4" rx="1" fill="#64748B"/>
  <rect x="20" y="84" width="78" height="4" fill="#334155" rx="1"/>
  <circle cx="34" cy="90" r="8" fill="#1E293B"/>
  <circle cx="34" cy="90" r="4.5" fill="#94A3B8"/>
  <circle cx="34" cy="90" r="2" fill="#1E293B"/>
  <circle cx="56" cy="90" r="8" fill="#1E293B"/>
  <circle cx="56" cy="90" r="4.5" fill="#94A3B8"/>
  <circle cx="56" cy="90" r="2" fill="#1E293B"/>
  <circle cx="86" cy="90" r="8" fill="#1E293B"/>
  <circle cx="86" cy="90" r="4.5" fill="#94A3B8"/>
  <circle cx="86" cy="90" r="2" fill="#1E293B"/>
</svg>
`)}`;

export const NOT_COLLECTED_DUSTBIN_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 25H70" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M36 30H84C86 30 87 32 86 34L83 38H37L34 34C33 32 34 30 36 30Z" fill="#64748B" stroke="#334155" stroke-width="2"/>
  <path d="M40 38L45 88C45.5 92 49 95 53 95H67C71 95 74.5 92 75 88L80 38H40Z" fill="#94A3B8" stroke="#475569" stroke-width="2.5"/>
  <line x1="52" y1="46" x2="54" y2="86" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
  <line x1="60" y1="46" x2="60" y2="86" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
  <line x1="68" y1="46" x2="66" y2="86" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
  <circle cx="76" cy="94" r="5" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>
  <circle cx="76" cy="94" r="2" fill="#E2E8F0"/>
  <circle cx="44" cy="94" r="5" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>
  <circle cx="44" cy="94" r="2" fill="#E2E8F0"/>
  <line x1="26" y1="26" x2="94" y2="96" stroke="#DC2626" stroke-width="9" stroke-linecap="round"/>
  <line x1="94" y1="26" x2="26" y2="96" stroke="#DC2626" stroke-width="9" stroke-linecap="round"/>
  <line x1="26" y1="26" x2="94" y2="96" stroke="#EF4444" stroke-width="5" stroke-linecap="round"/>
  <line x1="94" y1="26" x2="26" y2="96" stroke="#EF4444" stroke-width="5" stroke-linecap="round"/>
</svg>
`)}`;

export const PENDING_LOCKED_CLOCK_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="44" stroke="#DC2626" stroke-width="7" fill="#FFFFFF"/>
  <circle cx="60" cy="60" r="36" fill="#FEF2F2" opacity="0.6"/>
  <circle cx="60" cy="60" r="4" fill="#DC2626"/>
  <line x1="60" y1="60" x2="60" y2="34" stroke="#DC2626" stroke-width="6" stroke-linecap="round"/>
  <line x1="60" y1="60" x2="80" y2="60" stroke="#DC2626" stroke-width="6" stroke-linecap="round"/>
  <circle cx="60" cy="24" r="2.5" fill="#EF4444"/>
  <circle cx="96" cy="60" r="2.5" fill="#EF4444"/>
  <circle cx="60" cy="96" r="2.5" fill="#EF4444"/>
  <circle cx="24" cy="60" r="2.5" fill="#EF4444"/>
</svg>
`)}`;

export const VEHICLE_ASSIGNMENT_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vaBg" x1="0" y1="0" x2="160" y2="120" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ECFDF5"/>
      <stop offset="1" stop-color="#D1FAE5"/>
    </linearGradient>
    <linearGradient id="truckBody" x1="10" y1="40" x2="80" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#16A34A"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="headerCard" x1="85" y1="18" x2="150" y2="70" gradientUnits="userSpaceOnUse">
      <stop stop-color="#065F46"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
    <filter id="shadow" x="0" y="0" width="160" height="120" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#064E3B" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="160" height="120" rx="14" fill="url(#vaBg)"/>
  
  <!-- Subtle Map Grid in background -->
  <g opacity="0.35">
    <line x1="20" y1="20" x2="70" y2="20" stroke="#10B981" stroke-width="2" stroke-dasharray="3 3"/>
    <line x1="30" y1="10" x2="30" y2="45" stroke="#10B981" stroke-width="2" stroke-dasharray="3 3"/>
    <line x1="55" y1="12" x2="55" y2="45" stroke="#10B981" stroke-width="2" stroke-dasharray="3 3"/>
    <path d="M28 22 Q42 32 56 26" stroke="#2563EB" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="28" cy="22" r="3.5" fill="#047857"/>
    <circle cx="28" cy="22" r="1.5" fill="#FFFFFF"/>
    <circle cx="56" cy="26" r="3.5" fill="#2563EB"/>
    <circle cx="56" cy="26" r="1.5" fill="#FFFFFF"/>
  </g>

  <!-- Vehicle Assigned Card (Top Right) -->
  <g filter="url(#shadow)">
    <rect x="86" y="14" width="66" height="52" rx="6" fill="#FFFFFF" stroke="#10B981" stroke-width="1"/>
    <rect x="86" y="14" width="66" height="15" rx="6" fill="url(#headerCard)"/>
    <rect x="86" y="24" width="66" height="5" fill="url(#headerCard)"/>
    
    <!-- Card Header Truck + Title -->
    <path d="M92 20h4l2 3h3v3h-9z" fill="#FFFFFF"/>
    <circle cx="94" cy="26" r="1" fill="#047857"/>
    <circle cx="99" cy="26" r="1" fill="#047857"/>
    <text x="103" y="24.5" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="4.8" font-weight="900">Vehicle Assigned</text>

    <!-- Card Content Rows -->
    <text x="91" y="36" fill="#065F46" font-family="system-ui, sans-serif" font-size="4" font-weight="800">Vehicle No</text>
    <text x="114" y="36" fill="#0F172A" font-family="system-ui, sans-serif" font-size="3.8" font-weight="800">TN 38 B 4521</text>

    <text x="91" y="44" fill="#065F46" font-family="system-ui, sans-serif" font-size="4" font-weight="800">Driver Name</text>
    <text x="114" y="44" fill="#0F172A" font-family="system-ui, sans-serif" font-size="3.8" font-weight="800">Ravi Kumar</text>

    <text x="91" y="52" fill="#065F46" font-family="system-ui, sans-serif" font-size="4" font-weight="800">Route / Zone</text>
    <text x="114" y="52" fill="#0F172A" font-family="system-ui, sans-serif" font-size="3.8" font-weight="800">Zone 3 - W12</text>
  </g>

  <!-- Green Check Badge on Card -->
  <g filter="url(#shadow)">
    <circle cx="138" cy="62" r="9" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M134.5 62 L137 64.5 L142 59" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Waste Management Truck -->
  <g filter="url(#shadow)">
    <!-- Rooftop Amber Beacon -->
    <rect x="52" y="44" width="12" height="3" rx="1.5" fill="#F59E0B"/>
    <rect x="55" y="42" width="6" height="2" rx="1" fill="#FBBF24"/>

    <!-- Green Compactor Body -->
    <path d="M14 50 L58 47 L60 88 L18 88 Z" fill="url(#truckBody)" stroke="#047857" stroke-width="1.5"/>
    <rect x="18" y="52" width="38" height="30" rx="3" fill="#15803D" opacity="0.4"/>
    
    <!-- White Recycling Logo on truck body -->
    <g transform="translate(34, 63) scale(0.65)">
      <path d="M-6 -8L0 -14L6 -8M0 -14V-2" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 2L14 10L6 10M14 10L4 4" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-6 10L-14 10L-12 2M-14 10L-4 4" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- White Truck Cab -->
    <path d="M58 52 H80 C84 52 87 55 88 59 L91 74 C91.5 76 90 78 88 78 H60 V52 Z" fill="#FFFFFF" stroke="#047857" stroke-width="1.5"/>
    <!-- Windshield -->
    <path d="M62 55 H78 C80 55 82 57 83 59 L85 67 H62 V55 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="1"/>
    <!-- Cab Green Lower Bumper -->
    <path d="M59 78 H92 C93 78 94 79 94 80 L93 88 H59 V78 Z" fill="#047857"/>
    <!-- Eco Leaf Badge on Grill -->
    <path d="M78 82 C78 82 82 80 84 83 C84 86 81 87 78 82 Z" fill="#4ADE80"/>
    <circle cx="88" cy="83" r="2" fill="#FACC15"/>

    <!-- Truck Wheels -->
    <g>
      <circle cx="28" cy="92" r="9" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
      <circle cx="28" cy="92" r="5" fill="#94A3B8"/>
      <circle cx="28" cy="92" r="2" fill="#1E293B"/>

      <circle cx="48" cy="92" r="9" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
      <circle cx="48" cy="92" r="5" fill="#94A3B8"/>
      <circle cx="48" cy="92" r="2" fill="#1E293B"/>

      <circle cx="78" cy="92" r="9" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
      <circle cx="78" cy="92" r="5" fill="#94A3B8"/>
      <circle cx="78" cy="92" r="2" fill="#1E293B"/>
    </g>
  </g>

  <!-- Sanitation Officer Figure -->
  <g filter="url(#shadow)">
    <!-- Cap -->
    <path d="M98 57 C98 54 102 52 105 52 C108 52 110 54 110 57 H98 Z" fill="#047857"/>
    <path d="M98 57 H113" stroke="#065F46" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Head & Face -->
    <circle cx="104" cy="61" r="4" fill="#FBCFE8"/>
    <!-- Green Uniform Body & Hi-Vis Safety Vest -->
    <path d="M97 67 C97 65 100 65 104 65 C108 65 111 65 111 67 L113 86 H95 L97 67 Z" fill="#047857"/>
    <path d="M98 67 H110 L111 82 H97 L98 67 Z" fill="#FACC15"/>
    <!-- Reflective Stripes on vest -->
    <line x1="99" y1="72" x2="109" y2="72" stroke="#FFFFFF" stroke-width="1.5"/>
    <line x1="98" y1="78" x2="110" y2="78" stroke="#FFFFFF" stroke-width="1.5"/>
    <!-- Digital Tablet in Hands -->
    <rect x="94" y="73" width="7" height="10" rx="1" fill="#0F172A" transform="rotate(-15 94 73)"/>
    <rect x="95" y="74.5" width="5" height="7" rx="0.5" fill="#38BDF8" transform="rotate(-15 94 73)"/>
    <!-- Legs & Boots -->
    <rect x="98" y="86" width="3.5" height="18" fill="#064E3B" rx="1"/>
    <rect x="104" y="86" width="3.5" height="18" fill="#064E3B" rx="1"/>
    <path d="M97 102 H102 V106 H96 C96 104 97 102 97 102 Z" fill="#0F172A"/>
    <path d="M103 102 H108 V106 H102 C102 104 103 102 103 102 Z" fill="#0F172A"/>
  </g>
</svg>
`)}`;

export const vehicleAssignmentIcon = VEHICLE_ASSIGNMENT_LOGO_URL;
export const vehicleAssignmentFallbackIcon = VEHICLE_ASSIGNMENT_SVG_DATA_URL;

export const totalCollectedIcon = TOTAL_HOUSEHOLDS_SVG_DATA_URL;
export const totalCollectedFallbackIcon = TOTAL_HOUSEHOLDS_SVG_DATA_URL;
export const householdCoveredIcon = COLLECTED_TRUCK_SVG_DATA_URL;
export const householdCoveredFallbackIcon = COLLECTED_TRUCK_SVG_DATA_URL;
export const householdNotCoveredIcon = NOT_COLLECTED_DUSTBIN_SVG_DATA_URL;
export const householdNotCoveredFallbackIcon = NOT_COLLECTED_DUSTBIN_SVG_DATA_URL;
export const frequentlyNotCollectedIcon = FREQUENTLY_NOT_COLLECTED_URL;
export const frequentlyNotCollectedFallbackIcon = PENDING_LOCKED_CLOCK_SVG_DATA_URL;
export const liveGpsIcon = LIVE_GPS_URL;
export const liveGpsFallbackIcon = localLiveGps;
export const alertsIcon = ALERTS_LOGO_URL;
export const reportsIcon = REPORT_LOGO_URL;
export const aiPredictionIcon = localAiPrediction;
