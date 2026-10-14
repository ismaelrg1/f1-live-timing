import type { DashboardSessionState, DriverRow } from '../types/dashboard';
import {
	mockDriverRows,
	mockQualifyingDriverRows,
	mockQualifyingQ1FinishedDriverRows,
	mockQualifyingQ1FinishedSessionState,
	mockQualifyingQ1LiveDriverRows,
	mockQualifyingQ1LiveSessionState,
	mockQualifyingQ2FinishedDriverRows,
	mockQualifyingQ2FinishedSessionState,
	mockQualifyingQ2LiveDriverRows,
	mockQualifyingQ2LiveSessionState,
	mockQualifyingQ3LiveDriverRows,
	mockQualifyingQ3LiveSessionState,
	mockQualifyingSessionState,
	mockRaceDriverRows,
	mockRaceSessionState,
	mockSessionState
} from './mockDashboard';

export interface MockScenario {
	id: string;
	label: string;
	description: string;
	session: DashboardSessionState;
	drivers: DriverRow[];
}

const mockPracticeSessionState: DashboardSessionState = {
	...mockRaceSessionState,
	sessionType: 'PRACTICE',
	sessionName: 'Practice 2',
	sessionStatus: 'Started',
	clockRemaining: '00:42:16',
	clockRunning: true,
	currentLap: null,
	totalLaps: null,
	remainingLaps: null,
	qualifyingPart: null,
	qualifyingPartLabel: null,
	eliminationZoneStartsAt: null,
	cutOffTime: '',
	cutOffPercentage: ''
};

const trackStatusSession = (
	trackStatusCode: string,
	trackStatusMessage: string
): DashboardSessionState => ({
	...mockRaceSessionState,
	trackStatusCode,
	trackStatusMessage
});

export const mockScenarios: MockScenario[] = [
	{
		id: 'race',
		label: 'Race',
		description: 'Carrera con vueltas, gaps, stints y estados de pit.',
		session: mockSessionState,
		drivers: mockDriverRows
	},
	{
		id: 'race-yellow',
		label: 'Race yellow',
		description: 'Carrera con bandera amarilla y pulso amarillo en la tabla.',
		session: trackStatusSession('2', 'YELLOW'),
		drivers: mockRaceDriverRows
	},
	{
		id: 'race-sc',
		label: 'Race SC',
		description: 'Carrera con Safety Car y alerta amarilla en la tabla.',
		session: trackStatusSession('4', 'SAFETY CAR'),
		drivers: mockRaceDriverRows
	},
	{
		id: 'race-red',
		label: 'Race red',
		description: 'Carrera con bandera roja y pulso rojo en la tabla.',
		session: trackStatusSession('5', 'RED FLAG'),
		drivers: mockRaceDriverRows
	},
	{
		id: 'race-vsc',
		label: 'Race VSC',
		description: 'Carrera con Virtual Safety Car y alerta amarilla en la tabla.',
		session: trackStatusSession('6', 'VIRTUAL SAFETY CAR'),
		drivers: mockRaceDriverRows
	},
	{
		id: 'race-vsc-ending',
		label: 'Race VSC ending',
		description: 'Carrera con VSC ending y alerta amarilla en la tabla.',
		session: trackStatusSession('7', 'VSC ENDING'),
		drivers: mockRaceDriverRows
	},
	{
		id: 'practice',
		label: 'Practice',
		description: 'Practica sin contador de vueltas de carrera ni zona de eliminacion.',
		session: mockPracticeSessionState,
		drivers: mockRaceDriverRows
	},
	{
		id: 'qualifying-base',
		label: 'Qualy base',
		description: 'Qualy generica para revisar columnas sin estado especial.',
		session: mockQualifyingSessionState,
		drivers: mockQualifyingDriverRows
	},
	{
		id: 'q1-live',
		label: 'Q1 live',
		description: 'Q1 en directo con cutoff activo y linea de eliminacion en P16.',
		session: mockQualifyingQ1LiveSessionState,
		drivers: mockQualifyingQ1LiveDriverRows
	},
	{
		id: 'q1-finished',
		label: 'Q1 finished',
		description: 'Q1 finalizada con pilotos eliminados apagados.',
		session: mockQualifyingQ1FinishedSessionState,
		drivers: mockQualifyingQ1FinishedDriverRows
	},
	{
		id: 'q2-live',
		label: 'Q2 live',
		description: 'Q2 en directo con eliminados de Q1 y cutoff actual.',
		session: mockQualifyingQ2LiveSessionState,
		drivers: mockQualifyingQ2LiveDriverRows
	},
	{
		id: 'q2-finished',
		label: 'Q2 finished',
		description: 'Q2 finalizada con corte en P11.',
		session: mockQualifyingQ2FinishedSessionState,
		drivers: mockQualifyingQ2FinishedDriverRows
	},
	{
		id: 'q3-live',
		label: 'Q3 live',
		description: 'Q3 en directo sin linea de eliminacion dentro de la tabla.',
		session: mockQualifyingQ3LiveSessionState,
		drivers: mockQualifyingQ3LiveDriverRows
	}
];

export const defaultMockScenario = mockScenarios[0];
