package dk.via.habittracker.backend.dto.habit;

import dk.via.habittracker.backend.enums.HabitEntryStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class HabitEntryRequest
{
  @NotNull
  private LocalDate entryDate;

  @NotNull
  private HabitEntryStatus status;

  private BigDecimal valueAchieved;
  private String note;

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