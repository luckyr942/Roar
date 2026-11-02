// Team names and colours (MI Paltan, CSK Army) and badge colours for moments.
// Why: so team styling is the same on every screen.

import type { Team } from './match/types';
import { THEME } from '../constants/theme';

export const ARMY_NAME: Record<Team, string> = { MI: 'MI PALTAN', CSK: 'CSK ARMY' };
export const TEAM_FULL: Record<Team, string> = { MI: 'Mumbai Indians', CSK: 'Chennai Super Kings' };
export const TEAM_COLOR: Record<Team, string> = { MI: THEME.mi, CSK: THEME.csk };
export const TEAM_TEXT: Record<Team, string> = { MI: THEME.miText, CSK: THEME.csk };
export const rivalTeam = (team: Team): Team => (team === 'MI' ? 'CSK' : 'MI');

export const LABEL_COLOR: Record<string, string> = {
    WICKET: THEME.drop,
    'RUN OUT': THEME.drop,
    SIX: THEME.mi,
    FOUR: THEME.mint,
    RESULT: THEME.roar,
};
