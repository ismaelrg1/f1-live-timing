export interface RaceControlMessage {
  id: string;
  utc: string;
  lap: number | null;
  category: string;
  message: string;
  status: string;
  flag: string;
  scope: string;
  sector: number | null;
  racingNumber: string;
  driverTla: string;
}