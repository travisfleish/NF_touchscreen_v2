export interface SportMoment {
  id: string
  name: string
  trigger: string
  description: string
  examples?: string[]
}

export interface SportData {
  id: string
  name: string
  bubbleImage: string
  gradient: string
  glow: string
  moments: SportMoment[]
}

export const sportsData: SportData[] = [
  {
    id: 'nfl',
    name: 'NFL',
    bubbleImage: '/nfl.jpg',
    gradient: 'linear-gradient(145deg, rgba(106,138,255,0.9) 0%, rgba(35,76,255,0.92) 50%, rgba(0,24,170,0.95) 100%)',
    glow: 'rgba(120,150,255,0.55)',
    moments: [
      {
        id: 'lead-up-tailgate-watch-party',
        name: 'Lead up: Watch Party',
        trigger: '24 hours before kick-off',
        description:
          'This package activates 24 hours ahead of kick-off, reaching audiences the moment excitement builds and last minute preparation happens. Ideal for brands looking to own the start of the experience and associate it with pre-game rituals, research, and anticipation.',
      },
      {
        id: 'down-to-the-wire-2-minute-drill',
        name: 'Down to the Wire: 2 Minute Drill',
        trigger: 'Between 45% and 55% win probability within last 5 minutes',
        description:
          'Activates when a trailing team starts mounting a serious late game push, delivering high-attention moments filled with tension, hope, and rising excitement.',
      },
      {
        id: 'advancement-playoff-contenders',
        name: 'Advancement: Playoff Contenders',
        trigger: 'Wins putting teams in Wild Card or playoff contention',
        description:
          'Activates when teams give their fans hope and something to look forward to in the postseason. Delivering relief and bragging rights to fans who were feeling down.',
      },
      {
        id: 'elimination-playoff-elimination',
        name: 'Elimination: Playoff Elimination',
        trigger: 'Losses putting teams mathematically out of playoff contention',
        description:
          "Activates there's-always-next-year sentiment across losing fan bases. They look to a new hero emerging in the draft.",
      },
      {
        id: 'big-gains',
        name: 'Big Gains',
        trigger: 'Plays of over 50 yards',
        description:
          'Activates when massive gains are made on the field giving fans a sense of tremendous achievement, opportunity, and excitement.',
      },
      {
        id: 'its-good',
        name: "It's Good!",
        trigger: 'Game won by a last second field goal attempt',
        description:
          'Own the most iconic moment in sports — the last second field goal. Activates instantly when a last-second field goal attempt wins the game, aligning brands with unforgettable, viral, highlight-worthy moments.',
      },
    ],
  },
  {
    id: 'march-madness',
    name: 'March Madness',
    bubbleImage: '/march_madness.png',
    gradient: 'linear-gradient(145deg, rgba(118,172,255,0.92) 0%, rgba(52,105,255,0.92) 45%, rgba(0,41,200,0.96) 100%)',
    glow: 'rgba(160,210,255,0.5)',
    moments: [
      {
        id: 'gameday-lead-up',
        name: 'Gameday Lead Up',
        trigger: 'Tip-off time',
        description:
          'Capture peak anticipation as fans settle in to watch. This package activates 24 hours ahead of tip-off, reaching audiences the moment excitement builds.',
      },
      {
        id: 'late-game-rally',
        name: 'Late Game Rally',
        trigger: 'Trailing team closing the gap late in the game',
        description:
          'Activates when a trailing team starts mounting a serious late push, delivering high-attention moments filled with tension, hope, and rising excitement.',
      },
      {
        id: 'down-to-the-wire',
        name: 'Down to the Wire',
        trigger: 'Between 45% and 55% win probability within last 10 minutes',
        description:
          'Own the most intense moments of the game. Activates during tight contests where the outcome is uncertain, capturing peak fan attention as every possession matters.',
      },
      {
        id: 'blowout-in-the-making',
        name: 'Blowout in the Making',
        trigger: '80%+ win probability within last 10 minutes',
        description:
          'Align with dominance and confidence as one team pulls away. Activates when a decisive victory is imminent.',
      },
      {
        id: 'buzzer-beater-win',
        name: 'Buzzer Beater Win',
        trigger: 'Points scored to win in final 10 seconds',
        description:
          'Own the most iconic moment in sports. Activates instantly when a last-second shot wins the game, aligning brands with unforgettable, viral, highlight-worthy moments.',
      },
      {
        id: 'advancement',
        name: 'Advancement',
        trigger: 'Team wins and advances',
        description:
          'Celebrate victory and progress. Activates when teams secure the next step in their tournament journey, reaching energized fans in moments of pride and excitement.',
      },
      {
        id: 'elimination',
        name: 'Elimination',
        trigger: 'Team loses and is eliminated',
        description:
          'Reach fans during emotional turning points as seasons come to an end. Captures moments of reflection, loyalty, and heightened engagement following elimination games.',
      },
      {
        id: 'upset',
        name: 'Upset',
        trigger: 'Lower seed beats higher seed',
        description:
          'Align with the thrill of the unexpected. Activates when underdogs take down favorites, generating national attention, conversation, and strong emotional reactions.',
        examples: ['Upset in the Making', 'Bracket Buster in Progress'],
      },
      {
        id: 'cinderella-story',
        name: 'Cinderella Story',
        trigger: '10 seed or higher advances',
        description:
          'Follow the magic of underdog runs. Activates as unexpected teams continue advancing, capturing widespread fan support, optimism, and tournament storytelling.',
      },
      {
        id: 'tournament-tracker',
        name: 'Tournament Tracker',
        trigger: 'Reach fans of teams still alive in tournament',
        description:
          'Maintain consistent reach throughout the tournament. Automatically keeps brands connected with fans whose teams remain in contention.',
      },
      {
        id: 'sweet-16',
        name: 'Sweet 16',
        trigger: 'Reach fans of Sweet 16 teams',
        description:
          'Target high-intent fans as the tournament narrows. Activates around the Sweet 16 stage when excitement intensifies and national attention grows.',
      },
      {
        id: 'elite-8',
        name: 'Elite 8',
        trigger: 'Reach fans of Elite 8 teams',
        description:
          'Engage deeply invested audiences as teams push toward the Final Four. Delivers premium reach during one of the most competitive stages of the tournament.',
      },
      {
        id: 'final-four',
        name: 'Final Four',
        trigger: 'Reach fans of Final Four teams',
        description:
          'Own the spotlight moments. Activates during the week of the Final Four when attention peaks and stakes are highest.',
      },
      {
        id: 'championship',
        name: 'Championship',
        trigger: 'Reach fans of teams in Championship game',
        description:
          'Align with the biggest stage. Activates around the championship matchup, capturing peak viewership, emotion, and fan attention across the entire tournament.',
      },
      {
        id: 'champion',
        name: 'Champion',
        trigger: 'Reach fans of the winning team',
        description:
          'Celebrate the ultimate victory. Activates immediately after a team is crowned champion, connecting brands with fans experiencing peak pride, joy, and celebration.',
      },
      {
        id: 'hero-game-great-individual-performances',
        name: 'Hero Game',
        trigger: 'Double-double, triple-double, 20+ points, 10+ rebounds, 5+ threes, 3+ steals',
        description:
          'Align with standout player performances. Activates when athletes deliver exceptional stat lines, capturing moments of greatness and fan admiration.',
      },
    ],
  },
]
