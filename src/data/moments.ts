export interface Creative {
  id: string
  title: string
  description: string
  preview: {
    headline?: string
    stat?: string
    score?: string
    time?: string
    badge?: string
    cta?: string
    note?: string
    team1?: string
    team2?: string
    metric?: string
  }
}

export interface Moment {
  id: string
  name: string
  label: string
  hook: string
  trigger: string
  accentColor: string
  creatives: [Creative, Creative, Creative]
}

export interface Category {
  id: string
  name: string
  description: string
  moments: Moment[]
  /** Plain-language copy on how media buyers activate against these moments across a season */
  activationCopy: string
  /** Short labels for the “example moments” list (reference-style bullets) */
  exampleMoments: string[]
  /** League / event pills for “sports & tournaments” */
  sportsAndTournaments: string[]
  /** Label for the primary CTA on the category screen */
  workflowCtaLabel?: string
}

export const moments: Moment[] = [
  {
    id: 'buzzer-beater',
    name: 'Buzzer Beater',
    label: 'Game Winning',
    hook: 'The shot that silences arenas and breaks the internet in seconds.',
    trigger: 'Shot made as clock expires · Win probability < 15% → > 85%',
    accentColor: '#00ffcc',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Real-time score + countdown synced to the final shot',
        preview: { score: '98–97', time: '0.3s', stat: 'WIN PROB +73pt', team1: 'LAK', team2: 'CHI' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Cinematic freeze-frame of the game-winning release',
        preview: { badge: 'BUZZER BEATER', headline: 'Shot Heard Nationwide', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Screen-dominating moment with full sponsor integration',
        preview: { headline: 'MOMENT OF THE GAME', cta: 'WATCH REPLAY', metric: '3.2M live viewers' },
      },
    ],
  },
  {
    id: 'controversy',
    name: 'Controversy',
    label: 'High Pressure',
    hook: 'The underdog script no algorithm predicted — until it happened.',
    trigger: 'Favourite > −400 odds loses · Final margin ≤ 10pts',
    accentColor: '#ff4488',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Live odds swing and ranking delta displayed in-game',
        preview: { score: '72–68', time: 'FINAL', stat: 'ODDS SHIFT −1400', team1: 'RANK 14', team2: 'RANK 1' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Split before/after graphic — pre-game odds vs result',
        preview: { badge: 'UPSET ALERT', headline: 'Nobody Saw It Coming', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Full-screen reactive moment with shock-value creative',
        preview: { headline: 'THE IMPOSSIBLE RESULT', cta: 'SEE THE STATS', metric: '+1,400% search spike' },
      },
    ],
  },
  {
    id: 'overtime',
    name: 'Overtime',
    label: 'Endurance',
    hook: 'Extra time means extra everything — drama, stakes, and audience.',
    trigger: 'Score tied at regulation end · OT period begins',
    accentColor: '#ffaa00',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'OT clock + tension index shown across broadcast',
        preview: { score: '104–104', time: 'OT 2:14', stat: 'TENSION IDX 9.8', team1: 'BOS', team2: 'MIA' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Duelling team momentum bars locked in real-time',
        preview: { badge: 'OVERTIME', headline: 'Anyone\'s Game', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Full-panel live countdown with sponsor brand lock-up',
        preview: { headline: 'SUDDEN DEATH', cta: 'FOLLOW LIVE', metric: '41% higher ad recall' },
      },
    ],
  },
  {
    id: 'elimination',
    name: 'Elimination',
    label: 'Do or Die',
    hook: 'Win or go home. The purest pressure sport can produce.',
    trigger: 'Playoff elimination game · Team facing series end',
    accentColor: '#ff3300',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Series tracker + elimination countdown overlay',
        preview: { score: '3–1', time: 'SERIES', stat: 'ELIM PROB 89%', team1: 'WEST', team2: 'EAST' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Survival or exit — split narrative branded frame',
        preview: { badge: 'MUST WIN', headline: 'Last Chance', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'All-or-nothing creative that matches the stakes',
        preview: { headline: 'WIN OR GO HOME', cta: 'WATCH NOW', metric: '2.1× normal viewership' },
      },
    ],
  },
  {
    id: 'championship',
    name: 'Championship',
    label: 'Historic',
    hook: 'The culmination of an entire season — history made live.',
    trigger: 'Championship clinch · Trophy moment · Confetti drop',
    accentColor: '#ffd700',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Championship ticker with live trophy ceremony data',
        preview: { score: 'CHAMPIONS', time: 'FINAL', stat: 'DYNASTY: 3RD TITLE', team1: 'THE', team2: 'CHAMPS' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Gold-tier branded frame for the definitive moment',
        preview: { badge: 'CHAMPIONS', headline: 'They Did It', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Celebration-mode full-panel with premium brand presence',
        preview: { headline: 'CHAMPIONS', cta: 'RELIVE THE JOURNEY', metric: 'Peak audience moment' },
      },
    ],
  },
  {
    id: 'momentum-shift',
    name: 'Momentum Shift',
    label: 'Turning Point',
    hook: 'The swing that flips a game — quantified and visualised in real time.',
    trigger: 'Win probability delta > 30pt in < 90 seconds',
    accentColor: '#aa44ff',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Momentum graph overlay showing the exact swing point',
        preview: { score: '61–58', time: 'Q3 4:22', stat: 'SWING +38pt', team1: 'PHX', team2: 'DEN' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Before/after graphic with momentum arrow and data',
        preview: { badge: 'MOMENTUM SHIFT', headline: 'The Turning Point', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Dynamic data-driven creative capturing the swing',
        preview: { headline: 'GAME CHANGED HERE', cta: 'SEE THE DATA', metric: 'Win prob: 18% → 61%' },
      },
    ],
  },
  {
    id: 'hero-performance',
    name: 'Hero Performance',
    label: 'Clutch',
    hook: 'One player. One night. Numbers that rewrite the record books.',
    trigger: 'Single-game scoring / assists / rebounds > 99th percentile',
    accentColor: '#00ccff',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Live stat tracker showing record-pace performance',
        preview: { score: '52 PTS', time: '3Q END', stat: 'CAREER HIGH PACE', team1: 'ON', team2: 'FIRE' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Player performance card with live Genius data rails',
        preview: { badge: 'HERO NIGHT', headline: '52 & Counting', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Athlete-spotlight creative with real-time statline',
        preview: { headline: 'RECORD PERFORMANCE', cta: 'FULL STATLINE', metric: 'Top 0.1% all-time' },
      },
    ],
  },
  {
    id: 'review-controversy',
    name: 'Review / Controversy',
    label: 'Under Review',
    hook: 'The call everyone debates — with every data point to settle it.',
    trigger: 'Official review initiated · Social sentiment spike > 500%',
    accentColor: '#ff8800',
    creatives: [
      {
        id: 'live-data-overlay',
        title: 'CTV',
        description: 'Review clock + sentiment tracker live on broadcast',
        preview: { score: 'UNDER REVIEW', time: '3:47', stat: 'SENTIMENT: 73% FOUL', team1: 'OFF', team2: 'DEF' },
      },
      {
        id: 'branded-highlight-frame',
        title: 'Social',
        description: 'Multi-angle frame with data verdict overlay',
        preview: { badge: 'REVIEW', headline: 'The Data Decides', note: 'Powered by Genius Sports' },
      },
      {
        id: 'full-takeover',
        title: 'Interstitial',
        description: 'Controversy-as-content creative — audience votes live',
        preview: { headline: 'YOU MAKE THE CALL', cta: 'VOTE NOW', metric: '4.8M social engagements' },
      },
    ],
  },
]

export const categories: Category[] = [
  {
    id: 'championship-race',
    name: 'Championship Race',
    description:
      'The stretch where seasons turn into legacies — buzzer beaters, elimination pressure, overtime swings, and the trophy moment itself. These are the beats fans remember and sponsors want to own.',
    activationCopy:
      'Media buyers can activate against Genius-detected title-race moments all season long: align creatives to clinchers, elimination windows, and crunch-time spikes so your brand shows up exactly when stakes and audiences peak.',
    exampleMoments: [
      'Championship clinches & trophy moments',
      'Buzzer beaters & last-possession drama',
      'Win-or-go-home elimination games',
      'Overtime & sudden-death swings',
    ],
    sportsAndTournaments: [
      'NFL',
      'NBA',
      'NHL',
      'MLB',
      'NWSL',
      'MLS',
      'World Cup',
      'March Madness',
      'European Football',
      'WNBA',
    ],
    moments: [moments[4], moments[0], moments[3], moments[2]], // Championship, Buzzer Beater, Elimination, Overtime
  },
  {
    id: 'rivalry-matchups',
    name: 'Rivalry Matchups',
    description:
      'When historic opponents meet, intensity and engagement rise. These moments capture matchups fueled by rivalry, history, and fan passion.',
    activationCopy:
      'Buyers can activate across the season whenever rivalry-driven moments fire in Genius data — divisional grudge matches, playoff rematches, and regional showdowns — so campaigns ride the emotional and attention spikes fans already care about.',
    exampleMoments: [
      'Divisional rivalries',
      'Historic matchups',
      'Repeat playoff opponents',
      'Regional rivalries',
    ],
    sportsAndTournaments: [
      'NFL',
      'NBA',
      'NHL',
      'MLB',
      'NWSL',
      'MLS',
      'World Cup',
      'March Madness',
      'European Football',
      'WNBA',
    ],
    moments: [moments[1], moments[5], moments[6], moments[7]], // Controversy, Momentum Shift, Hero Performance, Review/Controversy
  },
]
