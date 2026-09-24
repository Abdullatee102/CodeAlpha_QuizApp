// app/constants/academicIcons.js
// Meaningful icon and color palette system for LAUTECH Faculties and Departments

export const FACULTY_ICONS = {
  FCI: {
    icon: 'laptop',
    color: '#2563EB', // Tech Blue
    lightBg: '#EFF6FF',
    family: 'Computing & Informatics',
  },
  FET: {
    icon: 'cog-outline',
    color: '#D97706', // Industrial Amber
    lightBg: '#FFFBEB',
    family: 'Engineering & Technology',
  },
  FES: {
    icon: 'earth',
    color: '#059669', // Environmental Emerald
    lightBg: '#ECFDF5',
    family: 'Environmental Sciences',
  },
  FFCS: {
    icon: 'silverware-fork-knife',
    color: '#E11D48', // Food Crimson
    lightBg: '#FFF1F2',
    family: 'Food & Consumer Sciences',
  },
  FMS: {
    icon: 'briefcase-outline',
    color: '#4F46E5', // Business Indigo
    lightBg: '#EEF2FF',
    family: 'Management Sciences',
  },
  FPAS: {
    icon: 'atom',
    color: '#7C3AED', // Science Violet
    lightBg: '#F5F3FF',
    family: 'Pure & Applied Sciences',
  },
  FASS: {
    icon: 'account-group-outline',
    color: '#DB2777', // Humanities Rose
    lightBg: '#FDF2F8',
    family: 'Arts & Social Sciences',
  },
  FBMS: {
    icon: 'microscope',
    color: '#0891B2', // Medical Cyan
    lightBg: '#ECFEFF',
    family: 'Basic Medical Sciences',
  },
  FBCS: {
    icon: 'needle',
    color: '#475569', // Clinical Slate
    lightBg: '#F8FAFC',
    family: 'Basic Clinical Sciences',
  },
  FCS: {
    icon: 'hospital-building',
    color: '#DC2626', // Clinical Red
    lightBg: '#FEF2F2',
    family: 'Clinical Sciences',
  },
  FNS: {
    icon: 'heart-pulse',
    color: '#C026D3', // Nursing Magenta
    lightBg: '#FDF4FF',
    family: 'Nursing Sciences',
  },
  FRNR: {
    icon: 'tree-outline',
    color: '#15803D', // Forestry Green
    lightBg: '#F0FDF4',
    family: 'Renewable Natural Resources',
  },
  FAS: {
    icon: 'sprout',
    color: '#65A30D', // Agriculture Lime
    lightBg: '#F7FEE7',
    family: 'Agricultural Sciences',
  },
};

export const getFacultyMeta = (faculty) => {
  const code = (faculty?.code || '').toUpperCase().trim();
  if (FACULTY_ICONS[code]) {
    return FACULTY_ICONS[code];
  }

  const name = (faculty?.name || '').toLowerCase();
  if (name.includes('comput') || name.includes('informatics')) {
    return FACULTY_ICONS.FCI;
  }
  if (name.includes('engineering') || name.includes('technology')) {
    return FACULTY_ICONS.FET;
  }
  if (name.includes('environment')) {
    return FACULTY_ICONS.FES;
  }
  if (name.includes('food') || name.includes('consumer')) {
    return FACULTY_ICONS.FFCS;
  }
  if (name.includes('management') || name.includes('business')) {
    return FACULTY_ICONS.FMS;
  }
  if (name.includes('pure') || name.includes('applied science')) {
    return FACULTY_ICONS.FPAS;
  }
  if (name.includes('art') || name.includes('social')) {
    return FACULTY_ICONS.FASS;
  }
  if (name.includes('basic medical')) {
    return FACULTY_ICONS.FBMS;
  }
  if (name.includes('basic clinical')) {
    return FACULTY_ICONS.FBCS;
  }
  if (name.includes('clinical science')) {
    return FACULTY_ICONS.FCS;
  }
  if (name.includes('nursing')) {
    return FACULTY_ICONS.FNS;
  }
  if (name.includes('renewable') || name.includes('natural resource')) {
    return FACULTY_ICONS.FRNR;
  }
  if (name.includes('agric')) {
    return FACULTY_ICONS.FAS;
  }

  return {
    icon: 'school-outline',
    color: '#3B82F6',
    lightBg: '#EFF6FF',
    family: 'Academic Faculty',
  };
};

// Department domain icon resolution
export const getDepartmentMeta = (department, facultyCode) => {
  const code = (department?.code || '').toUpperCase().trim();
  const name = (department?.name || '').toLowerCase();

  // Specific code mappings
  const codeMap = {
    // Computing
    CSC: { icon: 'code-tags', color: '#2563EB' },
    CYB: { icon: 'shield-check-outline', color: '#1D4ED8' },
    INS: { icon: 'database-outline', color: '#3B82F6' },

    // Engineering
    AGE: { icon: 'tractor', color: '#D97706' },
    CHE: { icon: 'flask-round-bottom-outline', color: '#B45309' },
    CVE: { icon: 'bridge', color: '#D97706' },
    CPE: { icon: 'cpu-64-bit', color: '#2563EB' },
    EEE: { icon: 'lightning-bolt-outline', color: '#EAB308' },
    FDE: { icon: 'blender-outline', color: '#EA580C' },
    MEE: { icon: 'cog-outline', color: '#78350F' },

    // Basic Medical & Health
    ANA: { icon: 'human-male-height', color: '#0891B2' },
    PHS: { icon: 'heart-pulse', color: '#E11D48' },
    MLS: { icon: 'microscope', color: '#0D9488' },

    // Nursing
    MHN: { icon: 'head-heart-outline', color: '#C026D3' },
    MSN: { icon: 'stethoscope', color: '#9333EA' },
    MCN: { icon: 'baby-carriage', color: '#DB2777' },
    PHN: { icon: 'hospital-marker', color: '#7C3AED' },

    // Humanities & Social Sciences
    ELS: { icon: 'book-open-page-variant-outline', color: '#BE185D' },
    HIS: { icon: 'pillar', color: '#9D174D' },
    PHL: { icon: 'lightbulb-outline', color: '#831843' },
    POL: { icon: 'scale-balance', color: '#4F46E5' },
    PSY: { icon: 'brain', color: '#7C3AED' },
    SOC: { icon: 'account-group-outline', color: '#6366F1' },
    LIS: { icon: 'bookshelf', color: '#0284C7' },
    MCM: { icon: 'newspaper-variant-outline', color: '#EA580C' },
    ECO: { icon: 'chart-line', color: '#059669' },

    // Agriculture
    AER: { icon: 'account-tie-voice-outline', color: '#65A30D' },
    ANB: { icon: 'dna', color: '#4D7C0F' },
    APH: { icon: 'paw-outline', color: '#3F6212' },
    CEP: { icon: 'sprout-outline', color: '#15803D' },
    CPS: { icon: 'barley', color: '#84CC16' },
    AEC: { icon: 'currency-usd', color: '#047857' },

    // Pure & Applied
    MTH: { icon: 'math-compass', color: '#7C3AED' },
    PHY: { icon: 'atom', color: '#6D28D9' },
    CHM: { icon: 'flask-outline', color: '#5B21B6' },
    BIO: { icon: 'leaf-outline', color: '#16A34A' },
    MCB: { icon: 'bacteria-outline', color: '#0284C7' },
    BCH: { icon: 'molecule', color: '#0891B2' },
    STA: { icon: 'chart-bar', color: '#4F46E5' },
  };

  if (codeMap[code]) {
    return codeMap[code];
  }

  // Keyword-based fallback
  if (name.includes('computer') || name.includes('software')) {
    return { icon: 'laptop', color: '#2563EB' };
  }
  if (name.includes('cyber') || name.includes('security')) {
    return { icon: 'shield-check-outline', color: '#1D4ED8' };
  }
  if (name.includes('engineer')) {
    return { icon: 'cog-outline', color: '#D97706' };
  }
  if (name.includes('medical') || name.includes('clinical') || name.includes('health')) {
    return { icon: 'stethoscope', color: '#0891B2' };
  }
  if (name.includes('nurs')) {
    return { icon: 'heart-pulse', color: '#C026D3' };
  }
  if (name.includes('agric') || name.includes('crop') || name.includes('soil')) {
    return { icon: 'sprout', color: '#65A30D' };
  }
  if (name.includes('food') || name.includes('nutrition')) {
    return { icon: 'food-apple-outline', color: '#E11D48' };
  }
  if (name.includes('math') || name.includes('stat')) {
    return { icon: 'calculator-variant-outline', color: '#7C3AED' };
  }
  if (name.includes('art') || name.includes('history') || name.includes('english')) {
    return { icon: 'book-open-page-variant-outline', color: '#DB2777' };
  }

  // Inherit from faculty if available
  const facultyMeta = getFacultyMeta({ code: facultyCode });
  return {
    icon: 'book-education-outline',
    color: facultyMeta.color,
  };
};

// Course domain icon resolution
export const getCourseIcon = (courseCode) => {
  const code = (courseCode || '').toUpperCase().trim();
  if (code.startsWith('CSC') || code.startsWith('CYB') || code.startsWith('INS')) {
    return 'code-tags';
  }
  if (code.startsWith('CPE') || code.startsWith('EEE') || code.startsWith('MEE') || code.startsWith('CVE') || code.startsWith('CHE') || code.startsWith('AGE')) {
    return 'cog-outline';
  }
  if (code.startsWith('MTH') || code.startsWith('STA')) {
    return 'math-compass';
  }
  if (code.startsWith('PHY')) {
    return 'atom';
  }
  if (code.startsWith('CHM') || code.startsWith('BCH')) {
    return 'flask-outline';
  }
  if (code.startsWith('BIO') || code.startsWith('MCB')) {
    return 'microscope';
  }
  if (code.startsWith('ANA') || code.startsWith('PHS') || code.startsWith('MLS')) {
    return 'human-male-height';
  }
  if (code.startsWith('NSG') || code.startsWith('MHN') || code.startsWith('MSN')) {
    return 'heart-pulse';
  }
  if (code.startsWith('AGR') || code.startsWith('AER') || code.startsWith('ANB') || code.startsWith('APH') || code.startsWith('CEP')) {
    return 'sprout';
  }
  if (code.startsWith('ELS') || code.startsWith('HIS') || code.startsWith('PHL') || code.startsWith('POL') || code.startsWith('SOC') || code.startsWith('MCM')) {
    return 'book-open-variant';
  }
  return 'book-outline';
};

