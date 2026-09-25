export const shortenBoothName = (name: string): string => {
  if (!name) return '';

  let shortened = name;

  const replacements = [
    // Schools - Ordered by longest first to avoid partial matches
    ['Panchayat Union Boys Elementary School', 'PUBES'],
    ['Panchayat Union Middle School', 'PUMS'],
    ['Panchayat Union Primary School', 'PUPS'],
    ['Panchayat Union Elementary School', 'PUES'],
    
    ['Government Girls Higher Secondary School', 'GGHSS'],
    ['Government Boys Higher Secondary School', 'GBHSS'],
    ['Government Higher Secondary School', 'GHSS'],
    ['Government High School', 'GHS'],
    ['Government Primary School', 'GPS'],
    ['Government Adi Dravidar Elementary School', 'GADES'],
    // Handle specific spacing typo requested by user
    ['Government  Adi Dravidar Elementary  School', 'GADES'],
    
    ['Annai Velankanni Cluny High School', 'AVCHS'],
    ['Dhamodharanar Nursery & Primary School', 'DNPS'],
    ['St Susaiyappar R C Primary School', 'SSRCPS'],
    ['St Marys High School', 'SMHS'],
    ['Tripuraneni Vidyalaya Matriculation School', 'TVMS'],
    ['S K Velayudham Higher Secondary School', 'SKVHSS'],
    ['St. John High School', 'SJHS'],
    ['Vallalar Gurukulam Higher Secondary School', 'VGHSS'],
    ['Kalaimagal Aided Middle School', 'KAMS'],
    ['Sri Kalaivani Vidyalaya Nursury & Primary School', 'SKVNPS'],
    ['Radhakrishnan Aided Middle School', 'RAMS'],
    ['Vallalar Aided Ele School', 'VAES'],
    ['Arulmigu Vallalar Aided High School', 'AVAHS'],
    
    ['Adidravidar Welfare School', 'ADWS'],
    ['Adi Dravidar Welfare', 'ADW'],
    ['Municipal Elementary School', 'MES'],
    ['R C Primary School', 'RCPS'],
    ['Anganwadi Centre', 'AWC'],
    ['Panchayat Office', 'PO'],
    ['Village Service Centre', 'VSC'],
    ['Sub Health Centre', 'SHC'],
    ['Assistant Executive Engineer Office', 'AEEO'],
    ['Panchayat Union Ele School (West)', 'PUES(W)'],
    
    // Buildings and Wings
    ['North Facing Building', 'N. Bldg'],
    ['South Facing Building', 'S. Bldg'],
    ['East Facing Building', 'E. Bldg'],
    ['West Facing Building', 'W. Bldg'],
    ['North Facing Main Building', 'N. Main Bldg'],
    ['North Facing Additional to Main Building', 'N. Addl to Main Bldg'],
    ['South Facing New Building Centre Portion (West)', 'S. New Bldg C. P. (W)'],
    ['South Facing New Building Centre Wing (East)', 'S. New Bldg C. W. (E)'],
    ['South Facing New Building', 'S. New Bldg'],
    ['North Facing New Building', 'N. New Bldg'],
    ['East Facing New Building', 'E. New Bldg'],
    ['West Facing New Building', 'W. New Bldg'],
    ['North Wing', 'N. Wing'],
    ['South Wing', 'S. Wing'],
    ['East Wing', 'E. Wing'],
    ['West Wing', 'W. Wing'],
  ];

  for (const [full, short] of replacements) {
    const regex = new RegExp(full, 'ig');
    shortened = shortened.replace(regex, short);
  }

  // Remove 6-digit pincodes, along with optional preceding hyphen/comma/spaces (e.g. " - 607102", " 607102", ", 607102")
  shortened = shortened.replace(/[\s\-,]*\b\d{6}\b/g, '');

  return shortened;
};
