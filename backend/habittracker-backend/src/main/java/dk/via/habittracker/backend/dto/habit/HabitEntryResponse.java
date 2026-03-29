package dk.via.habittracker.backend.dto.habit;

import dk.via.habittracker.backend.enums.HabitEntryStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class HabitEntryResponse
{
  private UUID id;
  private UUID habitId;
  private LocalDate entryDate;
  private HabitEntryStatus status;
  private BigDecimal valueAchieved;
  private String note;

  public UUID getId()
  {
    return id;
  }

  public void setId(UUID id)
  {
    this.id = id;
  }

  public UUID getHabitId()
  {
    return habitId;
  }

  public void setHabitId(UUID habitId)
  {
    this.habitId = habitId;
  }

  public LocalDate getEntryDate()
  {
    return entryDate;
  }

  public void setEntryDate(LocalDate entryDate)
  {
    this.entryDate = entryDate;
  }

  public HabitEntryStatus getStatus()
  {
    return status;
  }

  public void setStatus(HabitEntryStatus status)
  {
    this.status = status;
  }

  public BigDecimal getValueAchieved()
  {
    return valueAchieved;
  }

  public void setValueAchieved(BigDecimal valueAchieved)
  {
    this.valueAchieved = valueAchieved;
  }

  public String getNote()
  {
    return note;
  }

  public void setNote(String note)
  {
    this.note = note;
  }
}