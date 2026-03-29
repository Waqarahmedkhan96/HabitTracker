package dk.via.habittracker.backend.entity;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "reminders")
public class Reminder
{
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "habit_id", nullable = false)
  private Habit habit;

  @Column(nullable = false)
  private LocalTime reminderTime;

  @Column(nullable = false)
  private Boolean enabled = true;

  @Column(length = 50)
  private String daysCsv;

  public UUID getId()
  {
    return id;
  }

  public void setId(UUID id)
  {
    this.id = id;
  }

  public Habit getHabit()
  {
    return habit;
  }

  public void setHabit(Habit habit)
  {
    this.habit = habit;
  }

  public LocalTime getReminderTime()
  {
    return reminderTime;
  }

  public void setReminderTime(LocalTime reminderTime)
  {
    this.reminderTime = reminderTime;
  }

  public Boolean getEnabled()
  {
    return enabled;
  }

  public void setEnabled(Boolean enabled)
  {
    this.enabled = enabled;
  }

  public String getDaysCsv()
  {
    return daysCsv;
  }

  public void setDaysCsv(String daysCsv)
  {
    this.daysCsv = daysCsv;
  }
}