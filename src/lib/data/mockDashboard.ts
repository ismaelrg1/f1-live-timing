import type {
	BestSector,
	Compound,
	DashboardSessionState,
	DriverRow,
	LastLapSector,
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

const bestSector = (index: number, value: string, position: number | null): BestSector => ({
	index,
	value,
	position
});

const lastLapSector = (
	index: number,
	value: string,
	options: Partial<Pick<LastLapSector, 'personalFastest' | 'overallFastest'>> = {}
): LastLapSector => ({
	index,
	value,
	personalFastest: options.personalFastest ?? false,
	overallFastest: options.overallFastest ?? false
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

const qualifyingDriver = (
	position: number,
	racingNumber: string,
	tla: string,
	driverName: string,
	team: string,
	teamColour: string,
	bestLap: string,
	diffToFastest: string,
	diffToAhead: string,
	options: {
		knockedOut?: boolean;
		cutoff?: boolean;
		compound?: Compound;
		tyreLaps?: number;
		lastLap?: string;
	} = {}
): DriverRow => ({
	position: String(position),
	racingNumber,
	tla,
	driverName,
	broadcastName: driverName
		.split(' ')
		.map((part, index, parts) => (index === 0 ? part[0] : parts[index]))
		.join(' '),
	team,
	teamColour,
	gapToLeader: '',
	intervalToAhead: '',
	catchingAhead: false,
	lastLap: options.lastLap ?? bestLap,
	lastLapPersonalBest: false,
	lastLapOverallBest: false,
	bestLap,
	bestLapLap: 8 + position,
	bestLapRank: position,
	sectors: [
		sector(0, '30.142', '30.142', [2048, 2048, 2048, 2048, 2048]),
		sector(1, '41.220', '41.220', [2048, 2048, 2048, 2048, 2048, 2048]),
		sector(2, '24.196', '24.196', [2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048])
	],
	lastLapSectors: [
		lastLapSector(0, '30.142'),
		lastLapSector(1, '41.220'),
		lastLapSector(2, '24.196')
	],
	bestSectors: [bestSector(0, '24.900', position), bestSector(1, '31.800', position), bestSector(2, '38.900', position)],
	laps: 10 + (position % 5),
	pitStops: 3,
	compound: options.compound ?? 'SOFT',
	tyreLaps: options.tyreLaps ?? 3,
	stintLaps: options.tyreLaps ?? 3,
	isNewTyre: (options.tyreLaps ?? 3) <= 3,
	tyresNotChanged: false,
	gridPosition: null,
	gridDelta: null,
	retired: false,
	stopped: false,
	inPit: false,
	pitOut: false,
	outlap: false,
	stints: [stint(0, options.compound ?? 'SOFT', options.tyreLaps ?? 3, 0, { lapTime: bestLap, lapNumber: 8 + position })],
	knockedOut: options.knockedOut ?? false,
	cutoff: options.cutoff ?? false,
	timeDiffToFastest: diffToFastest,
	timeDiffToPositionAhead: diffToAhead
});

export const mockRaceSessionState: DashboardSessionState = {
	sessionKey: 11731,
	meetingKey: 1308,
	meetingName: 'Bahrain Grand Prix',
	circuitName: 'Bahrain International Circuit',
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
	currentLap: 36,
	totalLaps: 55,
	remainingLaps: 19,
	qualifyingPart: null,
	qualifyingPartLabel: null,
	eliminationZoneStartsAt: null,
	trackStatusCode: '1',
	trackStatusMessage: 'AllClear',
	cutOffTime: '',
	cutOffPercentage: '',
	weather: {
		airTemp: '26.1',
		trackTemp: '33.8',
		humidity: '84.0',
		pressure: '1006.3',
		rainfall: '0',
		windDirection: '40',
		windSpeed: '0.9'
	}
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
		lastLapSectors: [
			lastLapSector(0, '25.516'),
			lastLapSector(1, '32.883', { personalFastest: true, overallFastest: true }),
			lastLapSector(2, '39.821', { personalFastest: true, overallFastest: true })
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
		lastLapSectors: [
			lastLapSector(0, '25.330'),
			lastLapSector(1, '33.299', { personalFastest: true }),
			lastLapSector(2, '40.301')
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
		lastLapSectors: [
			lastLapSector(0, '25.424'),
			lastLapSector(1, '33.481'),
			lastLapSector(2, '40.540')
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
	},
	{
		position: '4',
		racingNumber: '81',
		tla: 'PIA',
		driverName: 'Oscar PIASTRI',
		broadcastName: 'O PIASTRI',
		team: 'McLaren',
		teamColour: 'FF8000',
		gapToLeader: '+12.410',
		intervalToAhead: '+7.491',
		catchingAhead: true,
		lastLap: '1:39.102',
		lastLapPersonalBest: true,
		lastLapOverallBest: false,
		bestLap: '1:38.912',
		bestLapLap: 49,
		bestLapRank: 4,
		sectors: [
			sector(0, '25.102', '25.204', [2049, 2049, 2048, 2050, 2048], { personalFastest: true }),
			sector(1, '33.745', '33.821', [2048, 2052, 2048, 2049, 2048, 0], { personalFastest: true }),
			sector(2, '', '40.265', [0, 0, 0, 0, 0, 0, 0, 0, 0])
		],
		lastLapSectors: [
			lastLapSector(0, '25.204'),
			lastLapSector(1, '33.821'),
			lastLapSector(2, '40.265')
		],
		bestSectors: [bestSector(0, '25.102', 4), bestSector(1, '33.745', 4), bestSector(2, '40.265', 3)],
		laps: 54,
		pitStops: 2,
		compound: 'MEDIUM',
		tyreLaps: 22,
		stintLaps: 22,
		isNewTyre: false,
		tyresNotChanged: false,
		gridPosition: 8,
		gridDelta: 4,
		retired: false,
		stopped: false,
		inPit: false,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'SOFT', 16, 0),
			stint(1, 'MEDIUM', 22, 0, { lapTime: '1:38.912', lapNumber: 49, lapFlags: 1 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '5',
		racingNumber: '16',
		tla: 'LEC',
		driverName: 'Charles LECLERC',
		broadcastName: 'C LECLERC',
		team: 'Ferrari',
		teamColour: 'ED1131',
		gapToLeader: '+18.034',
		intervalToAhead: '+5.624',
		catchingAhead: false,
		lastLap: '1:41.012',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:39.201',
		bestLapLap: 42,
		bestLapRank: 5,
		sectors: [
			sector(0, '', '25.609', [2064, 2064, 2064, 0, 0]),
			sector(1, '', '33.902', [0, 0, 0, 0, 0, 0]),
			sector(2, '', '40.478', [0, 0, 0, 0, 0, 0, 0, 0, 0])
		],
		lastLapSectors: [
			lastLapSector(0, '25.609'),
			lastLapSector(1, '33.902'),
			lastLapSector(2, '40.478')
		],
		bestSectors: [bestSector(0, '25.271', 6), bestSector(1, '33.761', 5), bestSector(2, '40.169', 2)],
		laps: 54,
		pitStops: 3,
		compound: 'HARD',
		tyreLaps: 1,
		stintLaps: 1,
		isNewTyre: true,
		tyresNotChanged: false,
		gridPosition: 4,
		gridDelta: -1,
		retired: false,
		stopped: false,
		inPit: false,
		pitOut: true,
		outlap: true,
		stints: [
			stint(0, 'MEDIUM', 21, 0),
			stint(1, 'SOFT', 20, 0),
			stint(2, 'HARD', 1, 0, { lapNumber: 54 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '6',
		racingNumber: '63',
		tla: 'RUS',
		driverName: 'George RUSSELL',
		broadcastName: 'G RUSSELL',
		team: 'Mercedes',
		teamColour: '00D7B6',
		gapToLeader: '+1 LAP',
		intervalToAhead: '+24.801',
		catchingAhead: false,
		lastLap: '',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:39.880',
		bestLapLap: 38,
		bestLapRank: 7,
		sectors: [
			sector(0, '', '25.801', [2052, 2052, 0, 0, 0], { stopped: true }),
			sector(1, '', '34.102', [0, 0, 0, 0, 0, 0], { stopped: true }),
			sector(2, '', '40.802', [0, 0, 0, 0, 0, 0, 0, 0, 0], { stopped: true })
		],
		lastLapSectors: [
			lastLapSector(0, '25.801'),
			lastLapSector(1, '34.102'),
			lastLapSector(2, '40.802')
		],
		bestSectors: [bestSector(0, '25.548', 9), bestSector(1, '33.990', 8), bestSector(2, '40.342', 5)],
		laps: 47,
		pitStops: 2,
		compound: 'INTERMEDIATE',
		tyreLaps: 12,
		stintLaps: 12,
		isNewTyre: false,
		tyresNotChanged: false,
		gridPosition: 5,
		gridDelta: -1,
		retired: false,
		stopped: true,
		inPit: false,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'SOFT', 18, 0),
			stint(1, 'INTERMEDIATE', 12, 0, { lapTime: '1:39.880', lapNumber: 38 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '7',
		racingNumber: '4',
		tla: 'NOR',
		driverName: 'Lando NORRIS',
		broadcastName: 'L NORRIS',
		team: 'McLaren',
		teamColour: 'FF8000',
		gapToLeader: '+1 LAP',
		intervalToAhead: '',
		catchingAhead: false,
		lastLap: '',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '1:40.115',
		bestLapLap: 31,
		bestLapRank: 8,
		sectors: [
			sector(0, '', '25.711', [0, 0, 0, 0, 0], { stopped: true }),
			sector(1, '', '34.210', [0, 0, 0, 0, 0, 0], { stopped: true }),
			sector(2, '', '40.910', [0, 0, 0, 0, 0, 0, 0, 0, 0], { stopped: true })
		],
		lastLapSectors: [
			lastLapSector(0, '25.711'),
			lastLapSector(1, '34.210'),
			lastLapSector(2, '40.910')
		],
		bestSectors: [bestSector(0, '25.611', 11), bestSector(1, '34.017', 10), bestSector(2, '40.487', 6)],
		laps: 40,
		pitStops: 2,
		compound: 'WET',
		tyreLaps: 6,
		stintLaps: 6,
		isNewTyre: false,
		tyresNotChanged: false,
		gridPosition: 6,
		gridDelta: -1,
		retired: true,
		stopped: false,
		inPit: false,
		pitOut: false,
		outlap: false,
		stints: [
			stint(0, 'MEDIUM', 24, 0),
			stint(1, 'WET', 6, 0, { lapTime: '1:40.115', lapNumber: 31 })
		],
		knockedOut: false,
		cutoff: false,
		timeDiffToFastest: '',
		timeDiffToPositionAhead: ''
	},
	{
		position: '8',
		racingNumber: '14',
		tla: 'ALO',
		driverName: 'Fernando ALONSO',
		broadcastName: 'F ALONSO',
		team: 'Aston Martin',
		teamColour: '229971',
		gapToLeader: '+1 LAP',
		intervalToAhead: '+3.100',
		catchingAhead: true,
		lastLap: '1:40.901',
		lastLapPersonalBest: false,
		lastLapOverallBest: false,
		bestLap: '',
		bestLapLap: null,
		bestLapRank: null,
		sectors: [
			sector(0, '25.900', '25.920', [2048, 2048, 2048, 2048, 2048]),
			sector(1, '34.200', '34.280', [2048, 2048, 2050, 2050, 2048, 2048]),
			sector(2, '40.801', '40.880', [2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048])
		],
		lastLapSectors: [
			lastLapSector(0, '25.920'),
			lastLapSector(1, '34.280'),
			lastLapSector(2, '40.880')
		],
		bestSectors: [bestSector(0, '', null), bestSector(1, '', null), bestSector(2, '', null)],
		laps: 18,
		pitStops: 1,
		compound: 'UNKNOWN',
		tyreLaps: 0,
		stintLaps: 0,
		isNewTyre: false,
		tyresNotChanged: true,
		gridPosition: null,
		gridDelta: null,
		retired: false,
		stopped: false,
		inPit: true,
		pitOut: false,
		outlap: false,
		stints: [stint(0, 'UNKNOWN', 0, 0, { tyresNotChanged: true })],
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
	circuitName: 'Bahrain International Circuit',
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
	totalLaps: null,
	remainingLaps: null,
	qualifyingPart: 1,
	qualifyingPartLabel: 'Q1',
	eliminationZoneStartsAt: 16,
	trackStatusCode: '1',
	trackStatusMessage: 'AllClear',
	cutOffTime: '1:43.230',
	cutOffPercentage: '107',
	weather: {
		airTemp: '31.0',
		trackTemp: '45.6',
		humidity: '61.7',
		pressure: '1008.4',
		rainfall: '0',
		windDirection: '2',
		windSpeed: '3.0'
	}
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
		lastLapSectors: [
			lastLapSector(0, '33.878'),
			lastLapSector(1, '41.826'),
			lastLapSector(2, '59.283')
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
		lastLapSectors: [
			lastLapSector(0, '30.044'),
			lastLapSector(1, '41.905'),
			lastLapSector(2, '62.745')
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
		lastLapSectors: [
			lastLapSector(0, '30.242'),
			lastLapSector(1, '41.185'),
			lastLapSector(2, '67.836')
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
	},
	qualifyingDriver(4, '81', 'PIA', 'Oscar PIASTRI', 'McLaren', 'FF8000', '1:35.601', '+0.471', '+0.043', {
		compound: 'SOFT',
		tyreLaps: 4
	}),
	qualifyingDriver(5, '16', 'LEC', 'Charles LECLERC', 'Ferrari', 'ED1131', '1:35.744', '+0.614', '+0.143'),
	qualifyingDriver(6, '1', 'NOR', 'Lando NORRIS', 'McLaren', 'FF8000', '1:35.801', '+0.671', '+0.057', {
		compound: 'MEDIUM',
		tyreLaps: 2
	}),
	qualifyingDriver(7, '63', 'RUS', 'George RUSSELL', 'Mercedes', '00D7B6', '1:35.920', '+0.790', '+0.119'),
	qualifyingDriver(8, '14', 'ALO', 'Fernando ALONSO', 'Aston Martin', '229971', '1:36.011', '+0.881', '+0.091'),
	qualifyingDriver(9, '55', 'SAI', 'Carlos SAINZ', 'Williams', '1868DB', '1:36.148', '+1.018', '+0.137'),
	qualifyingDriver(10, '10', 'GAS', 'Pierre GASLY', 'Alpine', '00A1E8', '1:36.207', '+1.077', '+0.059'),
	qualifyingDriver(11, '30', 'LAW', 'Liam LAWSON', 'Racing Bulls', '6C98FF', '1:36.318', '+1.188', '+0.111'),
	qualifyingDriver(12, '5', 'BOR', 'Gabriel BORTOLETO', 'Audi', 'F50537', '1:36.427', '+1.297', '+0.109'),
	qualifyingDriver(13, '18', 'STR', 'Lance STROLL', 'Aston Martin', '229971', '1:36.540', '+1.410', '+0.113'),
	qualifyingDriver(14, '27', 'HUL', 'Nico HULKENBERG', 'Audi', 'F50537', '1:36.701', '+1.571', '+0.161'),
	qualifyingDriver(15, '23', 'ALB', 'Alexander ALBON', 'Williams', '1868DB', '1:36.842', '+1.712', '+0.141', {
		cutoff: true
	}),
	qualifyingDriver(16, '87', 'BEA', 'Oliver BEARMAN', 'Haas F1 Team', '9C9FA2', '1:36.901', '+1.771', '+0.059', {
		knockedOut: true,
		cutoff: true
	}),
	qualifyingDriver(17, '31', 'OCO', 'Esteban OCON', 'Haas F1 Team', '9C9FA2', '1:37.044', '+1.914', '+0.143', {
		knockedOut: true
	}),
	qualifyingDriver(18, '43', 'COL', 'Franco COLAPINTO', 'Alpine', '00A1E8', '1:37.280', '+2.150', '+0.236', {
		knockedOut: true,
		compound: 'MEDIUM',
		tyreLaps: 5
	})
];

const cloneQualifyingRows = (
	updates: Record<
		string,
		Partial<Pick<DriverRow, 'knockedOut' | 'cutoff' | 'bestLap' | 'timeDiffToFastest' | 'timeDiffToPositionAhead'>>
	>
): DriverRow[] =>
	mockQualifyingDriverRows.map((driver) => ({
		...driver,
		knockedOut: false,
		cutoff: false,
		...updates[driver.position]
	}));

export const mockQualifyingQ1LiveSessionState: DashboardSessionState = {
	...mockQualifyingSessionState,
	sessionStatus: 'Started',
	clockRemaining: '00:03:42',
	clockRunning: true,
	qualifyingPart: 1,
	qualifyingPartLabel: 'Q1',
	eliminationZoneStartsAt: 16
};

export const mockQualifyingQ1LiveDriverRows: DriverRow[] = cloneQualifyingRows({
	'15': { cutoff: true },
	'16': { cutoff: true }
});

export const mockQualifyingQ1FinishedSessionState: DashboardSessionState = {
	...mockQualifyingSessionState,
	sessionStatus: 'Finished',
	clockRemaining: '00:00:00',
	clockRunning: false,
	qualifyingPart: 1,
	qualifyingPartLabel: 'Q1',
	eliminationZoneStartsAt: 16
};

export const mockQualifyingQ1FinishedDriverRows: DriverRow[] = cloneQualifyingRows({
	'16': { knockedOut: true },
	'17': { knockedOut: true },
	'18': { knockedOut: true }
});

export const mockQualifyingQ2LiveSessionState: DashboardSessionState = {
	...mockQualifyingSessionState,
	sessionStatus: 'Started',
	clockRemaining: '00:04:18',
	clockRunning: true,
	qualifyingPart: 2,
	qualifyingPartLabel: 'Q2',
	eliminationZoneStartsAt: 11
};

export const mockQualifyingQ2LiveDriverRows: DriverRow[] = cloneQualifyingRows({
	'10': { cutoff: true },
	'11': { cutoff: true },
	'16': { knockedOut: true },
	'17': { knockedOut: true },
	'18': { knockedOut: true }
});

export const mockQualifyingQ2FinishedSessionState: DashboardSessionState = {
	...mockQualifyingSessionState,
	sessionStatus: 'Finished',
	clockRemaining: '00:00:00',
	clockRunning: false,
	qualifyingPart: 2,
	qualifyingPartLabel: 'Q2',
	eliminationZoneStartsAt: 11
};

export const mockQualifyingQ2FinishedDriverRows: DriverRow[] = cloneQualifyingRows({
	'11': { knockedOut: true },
	'12': { knockedOut: true },
	'13': { knockedOut: true },
	'14': { knockedOut: true },
	'15': { knockedOut: true },
	'16': { knockedOut: true },
	'17': { knockedOut: true },
	'18': { knockedOut: true }
});

export const mockQualifyingQ3LiveSessionState: DashboardSessionState = {
	...mockQualifyingSessionState,
	sessionStatus: 'Started',
	clockRemaining: '00:05:10',
	clockRunning: true,
	qualifyingPart: 3,
	qualifyingPartLabel: 'Q3',
	eliminationZoneStartsAt: null
};

export const mockQualifyingQ3LiveDriverRows: DriverRow[] = cloneQualifyingRows({
	'11': { knockedOut: true },
	'12': { knockedOut: true },
	'13': { knockedOut: true },
	'14': { knockedOut: true },
	'15': { knockedOut: true },
	'16': { knockedOut: true },
	'17': { knockedOut: true },
	'18': { knockedOut: true }
});

export const mockSessionState = mockRaceSessionState;
export const mockDriverRows = mockRaceDriverRows;
