import { useEffect, useRef, useState } from "react";

const announcementDelay = 500;

/**
 * What an `Autocomplete`'s live region says
 */
interface ResultsAnnouncement {
  /**
   * The live region's text
   */
  announcement: string;

  /**
   * Says how many options match once typing pauses, replacing any count still to come
   */
  announceCount: () => void;
}

/**
 * Announces how many options match once typing pauses for the type-ahead window
 *
 * @param resultsLabel the words for a number of matches
 * @param countShown counts the options the filter shows
 * @returns the live region's text and a way to announce the count
 */
export function useResultsAnnouncement(
  resultsLabel: (count: number) => string,
  countShown: () => number
): ResultsAnnouncement {
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Emptied first, so the same count after another pause is announced again
  function announceCount(): void {
    setAnnouncement("");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAnnouncement(resultsLabel(countShown()));
    }, announcementDelay);
  }

  return { announceCount, announcement };
}
