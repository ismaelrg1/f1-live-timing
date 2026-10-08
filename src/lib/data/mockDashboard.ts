import type {
	BestSector,
	Compound,
	DashboardSessionState,
	DriverRow,
	MiniSectorStatus,
	Sector,
	Stint
} from '../types/dashboard';

const segmentStatuses = (statuses: MiniSectorStatus[]) =>
	statuses.map((status, index) => ({ index, status }));

const sector = (
	index: number,
	value: string,
	previousValue: string,
	segments: MiniSectorStatus[],
	options: Partial<Pick<Sector, 'personalFastest' | 'overallFastest' | 'stopped'>> = {}
): Sector => ({
	index,
	value,
	previousValue,
	personalFastest: options.personalFastest ?? false,
	overallFastest: options.overallFastest ?? false,
	stopped: options.stopped ?? false,
	segments: segmentStatuses(segments)
});

const bestSector = (index: number, value: string, position: number): BestSector => ({
	index,
	value,
	position
});

const stint = (
	index: number,
	compound: Compound,
	totalLaps: number,
	startLaps: number,
	options: Partial<Omit<Stint, 'index' | 'compound' | 'totalLaps' | 'startLaps'>> = {}
): Stint => ({
	index,
	compound,
	totalLaps,
	startLaps,
	new: options.new ?? startLaps === 0,
	tyresNotChanged: options.tyresNotChanged ?? false,
	lapTime: options.lapTime,
	lapNumber: options.lapNumber,
	lapFlags: options.lapFlags
});

export const mockRaceSessionState: DashboardSessionState = {
	sessionKey: 11731,
	meetingKey: 1308,
	meetingName: 'Bahrain Grand Prix',
	circuitName: 'Kuala Lumpur',
	countryCode: 'BRN',
	sessionType: 'Race',
	sessionName: 'Race',
	sessionStatus: 'Started',
	archiveStatus: 'Generating',
	startDate: '2026-10-04T15:00:00',
	endDate: '2026-10-04T17:00:00',
	gmtOffset: '08:00:00',
	clockUtc: '2026-10-04T08:35:40.5255667Z',
	clockRemaining: '01:57:19',
	clockRunning: true,
	currentLap: 55,
	qualifyingPart: null,
	qualifyingPartLabel: null,
	trackStatusCode: '1',
	trackStatusMessage: 'AllClear',
	cutOffTime: '',
	cutOffPercentage: ''
};

export const mockRaceDriverRows: DriverRow[] = [
	{
		position: '1',
		racingNumber: '3',
		tla: 'VER',
		driverName: 'Max VERSTAPPEN',
		broadcastName: 'M VERSTAPPEN',
		team: 'Red Bull Racing',
		teamColour: '4781D7',
		gapToLeader: '',
		intervalToAhead: '',
		catchingAhead: false,
		lastLap: '1:38.220',
		lastLapPersonalBest: true,
		lastLapOverallBest: true,
		bestLap: '1:38.220',
		bestLapLap: 55,
		bestLapRank: 1,
		sectors: [
			sector(0, '25.516', '25.516', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '32.883', '32.883', [2048, 2048, 2048, 2048, 0, 0], {
				personalFastest: true,
				overallFastest: true
			}),
			sector(2, '39.821', '39.821', [0, 0, 0, 0, 0, 0, 0, 0, 0], {
				personalFastest: true,
				overallFastest: true
			})
		],
		bestSectors: [bestSector(0, '25.327', 8), bestSector(1, '32.883', 1), bestSector(2, '39.821', 1)],
		laps: 55,
		pitStops: 3,
		compound: 'SOFT',
		tyreLaps: 18,
		stintLaps: 15,
		isNewTyre: false,
		tyresNotChanged: false,
		gridPosition: 1,
		gridDelta: 0,
		retired: false,
		stopped: false,
		inPit: false,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'INTERMEDIATE', 9, 0),
			stint(1, 'SOFT', 24, 0),
			stint(2, 'SOFT', 10, 0, { new: false }),
			stint(3, 'SOFT', 15, 3, { new: false, lapTime: '1:38.220', lapNumber: 55, lapFlags: 3 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '2',
		racingNumber: '12',
		tla: 'ANT',
		driverName: 'Kimi ANTONELLI',
		broadcastName: 'K ANTONELLI',
		team: 'Mercedes',
		teamColour: '00D7B6',
		gapToLeader: '+2.307',
		intervalToAhead: '+2.307',
		catchingAhead: false,
		lastLap: '1:38.930',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:38.589',
		bestLapLap: 52,
		bestLapRank: 2,
		sectors: [
			sector(0, '25.330', '25.330', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '33.299', '33.299', [2048, 2048, 2048, 2048, 2048, 0], { personalFastest: true }),
			sector(2, '40.301', '40.301', [0, 0, 0, 0, 0, 0, 0, 0, 0])
		],
		bestSectors: [bestSector(0, '25.032', 2), bestSector(1, '33.299', 2), bestSector(2, '40.158', 2)],
		laps: 55,
		pitStops: 3,
		compound: 'SOFT',
		tyreLaps: 17,
		stintLaps: 14,
		isNewTyre: false,
		tyresNotChanged: false,
		gridPosition: 3,
		gridDelta: 1,
		retired: false,
		stopped: false,
		inPit: false,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'INTERMEDIATE', 9, 0),
			stint(1, 'MEDIUM', 24, 0, { lapTime: '1:41.337', lapNumber: 17 }),
			stint(2, 'SOFT', 14, 3, { new: false, lapTime: '1:40.338', lapNumber: 35 }),
			stint(3, 'SOFT', 14, 3, { new: false, lapTime: '1:38.589', lapNumber: 52, lapFlags: 1 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '3',
		racingNumber: '44',
		tla: 'HAM',
		driverName: 'Lewis HAMILTON',
		broadcastName: 'L HAMILTON',
		team: 'Ferrari',
		teamColour: 'ED1131',
		gapToLeader: '+4.919',
		intervalToAhead: '+2.612',
		catchingAhead: false,
		lastLap: '1:39.445',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:38.610',
		bestLapLap: 53,
		bestLapRank: 3,
		sectors: [
			sector(0, '25.424', '25.424', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '33.481', '33.481', [2048, 2048, 2048, 2048, 0, 0]),
			sector(2, '40.540', '40.540', [0, 0, 0, 0, 0, 0, 0, 0, 0])
		],
		bestSectors: [bestSector(0, '24.992', 1), bestSector(1, '33.301', 3), bestSector(2, '40.317', 4)],
		laps: 55,
		pitStops: 2,
		compound: 'SOFT',
		tyreLaps: 18,
		stintLaps: 15,
		isNewTyre: false,
		tyresNotChanged: false,
		gridPosition: 2,
		gridDelta: -1,
		retired: false,
		stopped: false,
		inPit: false,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'SOFT', 31, 0),
			stint(1, 'MEDIUM', 15, 3, { new: false, lapTime: '1:40.178', lapNumber: 33 }),
			stint(2, 'SOFT', 15, 3, { new: false, lapTime: '1:38.610', lapNumber: 53, lapFlags: 1 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	}
];

export const mockQualifyingSessionState: DashboardSessionState = {
	sessionKey: 11730,
	meetingKey: 1308,
	meetingName: 'Bahrain Grand Prix',
	circuitName: 'Kuala Lumpur',
	countryCode: 'BRN',
	sessionType: 'Qualifying',
	sessionName: 'Qualifying',
	sessionStatus: 'Finished',
	archiveStatus: 'Generating',
	startDate: '2026-10-03T16:00:00',
	endDate: '2026-10-03T17:00:00',
	gmtOffset: '08:00:00',
	clockUtc: '2026-10-03T09:00:00.011Z',
	clockRemaining: '00:00:00',
	clockRunning: false,
	currentLap: null,
	qualifyingPart: 3,
	qualifyingPartLabel: 'Q3',
	trackStatusCode: '1',
	trackStatusMessage: 'AllClear',
	cutOffTime: '1:43.230',
	cutOffPercentage: '107'
};

export const mockQualifyingDriverRows: DriverRow[] = [
	{
		position: '1',
		racingNumber: '3',
		tla: 'VER',
		driverName: 'Max VERSTAPPEN',
		broadcastName: 'M VERSTAPPEN',
		team: 'Red Bull Racing',
		teamColour: '4781D7',
		gapToLeader: '',
		intervalToAhead: '',
		catchingAhead: false,
		lastLap: '2:14.987',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:35.130',
		bestLapLap: 11,
		bestLapRank: 1,
		sectors: [
			sector(0, '33.878', '33.878', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '41.826', '41.826', [2048, 2048, 2048, 2048, 2048, 2048]),
			sector(2, '59.283', '59.283', [2048, 2048, 2048, 2048, 2048, 2048, 2064, 2064, 2064])
		],
		bestSectors: [bestSector(0, '24.504', 1), bestSector(1, '31.456', 4), bestSector(2, '39.016', 1)],
		laps: 12,
		pitStops: 4,
		compound: 'SOFT',
		tyreLaps: 3,
		stintLaps: 3,
		isNewTyre: true,
		tyresNotChanged: false,
		gridPosition: null,
		gridDelta: null,
		retired: false,
		stopped: false,
		inPit: true,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'SOFT', 3, 0, { lapTime: '1:36.477', lapNumber: 3 }),
			stint(1, 'SOFT', 3, 0, { lapTime: '1:35.696', lapNumber: 6 }),
			stint(2, 'SOFT', 3, 0, { lapTime: '1:35.250', lapNumber: 9 }),
			stint(3, 'SOFT', 3, 0, { lapTime: '1:35.130', lapNumber: 12, lapFlags: 3 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '2',
		racingNumber: '44',
		tla: 'HAM',
		driverName: 'Lewis HAMILTON',
		broadcastName: 'L HAMILTON',
		team: 'Ferrari',
		teamColour: 'ED1131',
		gapToLeader: '',
		intervalToAhead: '',
		catchingAhead: false,
		lastLap: '2:14.694',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:35.428',
		bestLapLap: 14,
		bestLapRank: 2,
		sectors: [
			sector(0, '30.044', '30.044', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '41.905', '41.905', [2048, 2048, 2048, 2048, 2048, 2048]),
			sector(2, '62.745', '62.745', [2048, 2048, 2048, 2048, 2048, 2048, 2064, 2064, 2064])
		],
		bestSectors: [bestSector(0, '24.747', 2), bestSector(1, '31.201', 1), bestSector(2, '39.454', 9)],
		laps: 15,
		pitStops: 5,
		compound: 'SOFT',
		tyreLaps: 3,
		stintLaps: 3,
		isNewTyre: true,
		tyresNotChanged: false,
		gridPosition: null,
		gridDelta: null,
		retired: false,
		stopped: false,
		inPit: true,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'MEDIUM', 3, 0, { lapTime: '1:36.595', lapNumber: 3 }),
			stint(1, 'SOFT', 3, 0, { lapTime: '1:36.032', lapNumber: 6 }),
			stint(2, 'SOFT', 6, 3, { new: false, tyresNotChanged: true, lapTime: '1:37.245', lapNumber: 9 }),
			stint(3, 'SOFT', 3, 0, { lapTime: '1:35.745', lapNumber: 12 }),
			stint(4, 'SOFT', 3, 0, { lapTime: '1:35.428', lapNumber: 15, lapFlags: 1 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '+0.298',
		timeDiffToPositionAhead: '+0.298'
	},
	{
		position: '3',
		racingNumber: '6',
		tla: 'HAD',
		driverName: 'Isack HADJAR',
		broadcastName: 'I HADJAR',
		team: 'Red Bull Racing',
		teamColour: '4781D7',
		gapToLeader: '',
		intervalToAhead: '',
		catchingAhead: false,
		lastLap: '2:19.263',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:35.558',
		bestLapLap: 8,
		bestLapRank: 3,
		sectors: [
			sector(0, '30.242', '30.242', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '41.185', '41.185', [2048, 2048, 2048, 2048, 2048, 2048]),
			sector(2, '67.836', '67.836', [2048, 2048, 2048, 2048, 2048, 2048, 2064, 2064, 2064])
		],
		bestSectors: [bestSector(0, '24.839', 5), bestSector(1, '31.459', 6), bestSector(2, '39.231', 3)],
		laps: 12,
		pitStops: 4,
		compound: 'SOFT',
		tyreLaps: 3,
		stintLaps: 3,
		isNewTyre: true,
		tyresNotChanged: false,
		gridPosition: null,
		gridDelta: null,
		retired: false,
		stopped: false,
		inPit: true,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'SOFT', 3, 0, { lapTime: '1:36.898', lapNumber: 3 }),
			stint(1, 'SOFT', 3, 0, { lapTime: '1:36.192', lapNumber: 6 }),
			stint(2, 'SOFT', 3, 0, { lapTime: '1:35.558', lapNumber: 9, lapFlags: 1 }),
			stint(3, 'SOFT', 3, 0, { lapTime: '1:35.559', lapNumber: 12 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '+0.428',
		timeDiffToPositionAhead: '+0.130'
	}
];

export const mockSessionState = mockRaceSessionState;
export const mockDriverRows = mockRaceDriverRows;
