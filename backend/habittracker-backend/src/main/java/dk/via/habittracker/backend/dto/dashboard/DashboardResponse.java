package dk.via.habittracker.backend.dto.dashboard;

import java.util.List;

public class DashboardResponse
{
  private int totalActiveHabits;
  private int completedToday;
  private int missedToday;
  private double todayCompletionPercentage;
  private List<String> habitTitlesDueToday;

  public int getTotalActiveHabits()
  {
    return totalActiveHabits;
  }

  public void setTotalActiveHabits(int totalActiveHabits)
  {
    this.totalActiveHabits = totalActiveHabits;
  }

  public int getCompletedToday()
  {
    return completedToday;
  }

  public void setCompletedToday(int completedToday)
  {
    this.completedToday = completedToday;
  }

  public int getMissedToday()
  {
    return missedToday;
  }

  public void setMissedToday(int missedToday)
  {
    this.missedToday = missedToday;
  }

  public double getTodayCompletionPercentage()
  {
    return todayCompletionPercentage;
  }

  public void setTodayCompletionPercentage(double todayCompletionPercentage)
  {
    this.todayCompletionPercentage = todayCompletionPercentage;
  }

  public List<String> getHabitTitlesDueToday()
  {
    return habitTitlesDueToday;
  }

  public void setHabitTitlesDueToday(List<String> habitTitlesDueToday)
  {
    this.habitTitlesDueToday = habitTitlesDueToday;
  }
}