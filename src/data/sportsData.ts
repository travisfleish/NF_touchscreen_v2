export interface SportMoment {
  id: string
  name: string
  trigger: string
  description: string
  examples?: string[]
}

export interface SportCategory {
  id: string
  name: string
  moments: SportMoment[]
}

export interface SportData {
  id: string
  name: string
  gradient: string
  glow: string
  categories: SportCategory[]
}

/** Idle grid — bright; after a sport is chosen it switches to `SPORT_PARENT_*` in App. */
export const SPORT_IDLE_GRADIENT =
  'linear-gradient(145deg, rgba(118,172,255,0.92) 0%, rgba(52,105,255,0.92) 45%, rgba(0,41,200,0.96) 100%)'
export const SPORT_IDLE_GLOW = 'rgba(160,210,255,0.5)'

/** Active sport hub (selected / drill-down parent) — matches parent theme styling in MomentBubble. */
export const SPORT_PARENT_GRADIENT =
  'linear-gradient(145deg, rgba(32,48,120,0.96) 0%, rgba(12,28,105,0.97) 50%, rgba(6,16,72,0.98) 100%)'
export const SPORT_PARENT_GLOW = 'rgba(72,100,190,0.38)'

export const sportsData: SportData[] = [
  {
    id: 'march-madness',
    name: 'March Madness',
    gradient: SPORT_IDLE_GRADIENT,
    glow: SPORT_IDLE_GLOW,
    categories: [
      {
        id: 'championship-race',
        name: 'Championship Race',
        moments: [
          {
            id: 'elite-8',
            name: 'Elite 8',
            trigger: 'Teams advance to the Elite 8 stage',
            description: '',
          },
          {
            id: 'final-four',
            name: 'Final Four',
            trigger: 'Teams advance to the Final Four',
            description: '',
          },
        ],
      },
      {
        id: 'game-changing-moments',
        name: 'Game-Changing Moments',
        moments: [
          {
            id: 'buzzer-beaters',
            name: 'Buzzer Beaters',
            trigger: 'A made shot occurs at or near game expiration to tie or win',
            description: '',
          },
          {
            id: 'upsets',
            name: 'Upsets',
            trigger: 'A lower-seeded team defeats a higher-seeded team',
            description: '',
          },
        ],
      },
    ],
  },
  {
    id: 'nfl',
    name: 'NFL',
    gradient: SPORT_IDLE_GRADIENT,
    glow: SPORT_IDLE_GLOW,
    categories: [
      {
        id: 'rivalry-matchups',
        name: 'Rivalry Matchups',
        moments: [
          {
            id: 'divisional-rivalries',
            name: 'Divisional Rivalries',
            trigger: 'Games between teams within the same division',
            description: '',
          },
          {
            id: 'historic-matchups',
            name: 'Historic Matchups',
            trigger: 'Matchups between teams with established competitive history',
            description: '',
          },
        ],
      },
      {
        id: 'betting-moments',
        name: 'Betting Moments',
        moments: [
          {
            id: 'live-betting-swings',
            name: 'Live Betting Swings',
            trigger: 'Significant real-time changes in win probability or game state',
            description: '',
          },
          {
            id: 'odds-shifts',
            name: 'Odds Shifts',
            trigger: 'Notable movement in betting odds during the game',
            description: '',
          },
        ],
      },
    ],
  },
  {
    id: 'nba',
    name: 'NBA',
    gradient: SPORT_IDLE_GRADIENT,
    glow: SPORT_IDLE_GLOW,
    categories: [
      {
        id: 'high-stakes-moments',
        name: 'High Stakes Moments',
        moments: [
          {
            id: 'one-possession-games',
            name: 'One Possession Games',
            trigger: 'Score margin is 3 points or fewer',
            description: '',
          },
          {
            id: 'overtime',
            name: 'Overtime',
            trigger: 'Game extends beyond regulation into overtime',
            description: '',
          },
        ],
      },
      {
        id: 'outcome-moments',
        name: 'Outcome Moments',
        moments: [
          {
            id: 'game-winning-plays',
            name: 'Game-Winning Plays',
            trigger: 'A play gives a team the lead in the final moments of the game',
            description: '',
          },
          {
            id: 'buzzer-beaters',
            name: 'Buzzer Beaters',
            trigger: 'A made shot occurs at or near game expiration to tie or win',
            description: '',
          },
        ],
      },
    ],
  },
  {
    id: 'world-cup',
    name: 'World Cup',
    gradient: SPORT_IDLE_GRADIENT,
    glow: SPORT_IDLE_GLOW,
    categories: [
      {
        id: 'knockout-round-moments',
        name: 'Knockout Round Moments',
        moments: [
          {
            id: 'round-of-16-qualification',
            name: 'Round of 16 Qualification',
            trigger: 'A team advances from group stage to knockout round',
            description: '',
          },
          {
            id: 'semifinal-advancement',
            name: 'Semifinal Advancement',
            trigger: 'A team advances to the semifinals',
            description: '',
          },
        ],
      },
      {
        id: 'record-chasing-moments',
        name: 'Record Chasing Moments',
        moments: [
          {
            id: 'hat-trick-watch',
            name: 'Hat Trick\nWatch',
            trigger: 'A player scores two goals and is one away from a hat trick',
            description: '',
          },
          {
            id: 'all-time-goal-record-chase',
            name: 'All-Time Goal Record Chase',
            trigger: 'A player approaches or surpasses a major scoring milestone',
            description: '',
          },
        ],
      },
    ],
  },
  {
    id: 'mlb',
    name: 'MLB',
    gradient: SPORT_IDLE_GRADIENT,
    glow: SPORT_IDLE_GLOW,
    categories: [
      {
        id: 'pre-game-build-up',
        name: 'Pre-Game Build-Up',
        moments: [
          {
            id: 'lineup-announcements',
            name: 'Lineup Announcements',
            trigger: 'Official starting lineups are released before the game',
            description: '',
          },
          {
            id: 'hours-before-first-pitch',
            name: 'Hours Before First Pitch',
            trigger: 'Defined window leading up to game start',
            description: '',
          },
        ],
      },
      {
        id: 'player-events',
        name: 'Player Events',
        moments: [
          {
            id: 'home-runs',
            name: 'Home Runs',
            trigger: 'A batter hits a home run',
            description: '',
          },
          {
            id: 'pitching-milestones',
            name: 'Pitching Milestones',
            trigger: 'A pitcher reaches a notable strikeout or performance milestone',
            description: '',
          },
        ],
      },
    ],
  },
  {
    id: 'nwsl',
    name: 'NWSL',
    gradient: SPORT_IDLE_GRADIENT,
    glow: SPORT_IDLE_GLOW,
    categories: [
      {
        id: 'brand-protection',
        name: 'Brand Protection',
        moments: [
          {
            id: 'player-injury',
            name: 'Player Injury',
            trigger: 'An injury occurs causing a stoppage in play',
            description: '',
          },
          {
            id: 'controversial-situations',
            name: 'Controversial Situations',
            trigger: 'Incidents involving officiating decisions or disputes',
            description: '',
          },
        ],
      },
      {
        id: 'momentum-shift-moments',
        name: 'Momentum Shift Moments',
        moments: [
          {
            id: 'consecutive-goal-runs',
            name: 'Consecutive Goal Runs',
            trigger: 'A team scores multiple goals in a short time window',
            description: '',
          },
          {
            id: 'late-match-equalizers',
            name: 'Late Match Equalizers',
            trigger: 'A team scores a goal late in the match to draw level',
            description: '',
          },
        ],
      },
    ],
  },
]
