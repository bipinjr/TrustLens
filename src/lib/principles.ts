// Stajano, F. & Wilson, P. (2011). Understanding scam victims: seven principles for systems security.
// Communications of the ACM, 54(3), 70-75. https://doi.org/10.1145/1897852.1897872
export const PRINCIPLES = {
  time: {
    name: "Time pressure",
    short: "Rushes you so you can't stop and think.",
    long: "When we must decide fast, we stop reasoning and act on instinct. Deadlines like \"today\" or \"within 2 hours\" are there to switch off your careful thinking.",
    example: "Your account will be blocked today",
  },
  social_compliance: {
    name: "Obeying authority",
    short: "Pretends to be a bank, police or government.",
    long: "We are raised not to question officials. Scammers borrow the voice of a bank, the police, CBI or customs, so that doing what they say feels like the right thing.",
    example: "This is Inspector Rajesh from Cyber Crime",
  },
  need_greed: {
    name: "Need and greed",
    short: "Dangles money, a job or a prize you want.",
    long: "Our needs and wishes make us drop our guard. A lottery win, easy daily income or a doubled investment makes us want to believe it.",
    example: "Earn ₹3,000 per day liking videos",
  },
  distraction: {
    name: "Distraction",
    short: "Keeps your attention busy so you miss the trap.",
    long: "While your mind is busy with the story, a link to tap, an app to install or a number to call slips past unnoticed.",
    example: "Stay on the video call, install this app",
  },
  kindness: {
    name: "Kindness",
    short: "Uses your wish to help someone in trouble.",
    long: "Most people are good and want to help. A \"relative\" who lost their phone or a stranger in an emergency turns your kindness into the hook.",
    example: "Mummy, I lost my phone, send money urgently",
  },
  herd: {
    name: "Following the crowd",
    short: "Makes it look like everyone else is doing it.",
    long: "We relax when others seem to share the same risk. Fake groups, fake reviews and \"10,000 people already earned\" make a trap look safe.",
    example: "Join 25,000 members already earning",
  },
  dishonesty: {
    name: "Shame and secrecy",
    short: "Makes you feel guilty, so you won't ask for help.",
    long: "Once you feel you did something wrong or embarrassing, you stay quiet. Scammers use that silence to keep you from checking with anyone.",
    example: "Don't tell your family, or you will be arrested",
  },
} as const;

export type PrincipleId = keyof typeof PRINCIPLES;
export const PRINCIPLE_IDS = Object.keys(PRINCIPLES) as PrincipleId[];

export const CITATIONS = {
  stajano: {
    label: "Stajano & Wilson, 2011",
    title: "Understanding scam victims: seven principles for systems security",
    venue: "Communications of the ACM 54(3)",
    url: "https://doi.org/10.1145/1897852.1897872",
    pdf: "https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-754.pdf",
    note: "Cambridge technical report version (open access)",
  },
  inoculation: {
    label: "Roozenbeek et al., 2022",
    title: "Psychological inoculation improves resilience against misinformation on social media",
    venue: "Science Advances 8(34)",
    url: "https://doi.org/10.1126/sciadv.abo6254",
    pdf: "https://www.science.org/doi/pdf/10.1126/sciadv.abo6254",
    note: "Open access",
  },
  prebunking: {
    label: "Roozenbeek, van der Linden & Nygren, 2020",
    title: "Prebunking interventions based on \"inoculation\" theory can reduce susceptibility to misinformation across cultures",
    venue: "Harvard Kennedy School Misinformation Review",
    url: "https://misinforeview.hks.harvard.edu/article/global-vaccination-badnews/",
    pdf: "https://misinforeview.hks.harvard.edu/wp-content/uploads/2020/02/FORMATTED_globalvaccination_Jan30.pdf",
    note: "Open access",
  },
  mha: {
    label: "MHA, Lok Sabha, July 2025",
    title: "Indians lost ₹22,845 crore to cyber fraud in 2024",
    venue: "via The New Indian Express",
    pdf: undefined as string | undefined,
    note: "News report of the Lok Sabha answer",
    url: "https://www.newindianexpress.com/india/2025/Jul/22/indian-citizens-lost-over-rs-22845-crore-to-online-fraudsters-in-2024-mha-in-lok-sabha",
  },
} as const;
