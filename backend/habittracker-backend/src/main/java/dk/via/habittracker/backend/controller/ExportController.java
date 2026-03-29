package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.service.export.CsvExportService;
import java.security.Principal;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/export")
public class ExportController
{
  private final CsvExportService csvExportService;

  public ExportController(CsvExportService csvExportService)
  {
    this.csvExportService = csvExportService;
  }

  @GetMapping("/habits")
  public ResponseEntity<String> exportHabits(Principal principal)
  {
    String csv = csvExportService.exportHabitsCsv(principal);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=habittracker-habits.csv")
        .contentType(MediaType.TEXT_PLAIN)
        .body(csv);
  }

  @GetMapping("/entries")
  public ResponseEntity<String> exportEntries(Principal principal)
  {
    String csv = csvExportService.exportEntriesCsv(principal);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=habittracker-entries.csv")
        .contentType(MediaType.TEXT_PLAIN)
        .body(csv);
  }
}