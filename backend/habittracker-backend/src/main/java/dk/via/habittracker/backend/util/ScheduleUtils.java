package dk.via.habittracker.backend.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public final class ScheduleUtils {

    private ScheduleUtils() {
    }

    public static Set<DayOfWeek> parseSelectedDays(String selectedDaysCsv) {
        if (selectedDaysCsv == null || selectedDaysCsv.isBlank()) {
            return Collections.emptySet();
        }

        return Arrays.stream(selectedDaysCsv.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toUpperCase)
            .map(DayOfWeek::valueOf)
            .collect(Collectors.toCollection(HashSet::new));
    }

    public static boolean isScheduledOn(LocalDate date, Set<DayOfWeek> selectedDays, boolean daily) {
        if (daily) {
            return true;
        }
        return selectedDays.contains(date.getDayOfWeek());
    }

    public static String normalizeCsv(String selectedDaysCsv) {
        return parseSelectedDays(selectedDaysCsv).stream()
            .map(DayOfWeek::name)
            .sorted()
            .collect(Collectors.joining(","));
    }
}
