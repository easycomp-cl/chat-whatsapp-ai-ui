export type AlertTone = {
  id: string;
  label: string;
  src: string;
};

export const ALERT_TONES: AlertTone[] = [
  {
    id: "universfield-new-notification-09-352705",
    label: "Tono 1",
    src: "/alerts/universfield-new-notification-09-352705.mp3",
  },
  {
    id: "universfield-new-notification-010-352755",
    label: "Tono 2",
    src: "/alerts/universfield-new-notification-010-352755.mp3",
  },
  {
    id: "universfield-new-notification-018-363746",
    label: "Tono 3",
    src: "/alerts/universfield-new-notification-018-363746.mp3",
  },
  {
    id: "universfield-new-notification-036-485897",
    label: "Tono 4",
    src: "/alerts/universfield-new-notification-036-485897.mp3",
  },
  {
    id: "universfield-new-notification-040-493469",
    label: "Tono 5",
    src: "/alerts/universfield-new-notification-040-493469.mp3",
  },
  {
    id: "universfield-new-notification-051-494246",
    label: "Tono 6",
    src: "/alerts/universfield-new-notification-051-494246.mp3",
  },
  {
    id: "universfield-new-notification-057-494255",
    label: "Tono 7",
    src: "/alerts/universfield-new-notification-057-494255.mp3",
  },
  {
    id: "universfield-new-notification-059-494262",
    label: "Tono 8",
    src: "/alerts/universfield-new-notification-059-494262.mp3",
  },
  {
    id: "universfield-new-notification-062-494544",
    label: "Tono 9",
    src: "/alerts/universfield-new-notification-062-494544.mp3",
  },
  {
    id: "universfield-new-notification-065-494546",
    label: "Tono 10",
    src: "/alerts/universfield-new-notification-065-494546.mp3",
  },
];

export const DEFAULT_ALERT_TONE_ID = ALERT_TONES[0].id;

export function getAlertToneById(id: string): AlertTone {
  return ALERT_TONES.find((tone) => tone.id === id) ?? ALERT_TONES[0];
}
