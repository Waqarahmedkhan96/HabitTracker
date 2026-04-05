package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.dashboard.DashboardResponse;
import dk.via.habittracker.backend.service.dashboard.DashboardService;
import java.security.Principal;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController
{
  private final DashboardService dashboardService;

  public DashboardController(DashboardService dashboardService)
  {
    this.dashboardService = dashboardService;
  }

  @GetMapping
  public DashboardResponse getDashboard(Principal principal,
                                        @RequestParam(required = false) LocalDate date)
  {
    return dashboardService.getDashboard(principal, date);
  }
}