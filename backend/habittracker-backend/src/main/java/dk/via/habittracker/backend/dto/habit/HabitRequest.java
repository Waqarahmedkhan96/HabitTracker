package dk.via.habittracker.backend.dto.habit;

import dk.via.habittracker.backend.enums.FrequencyType;
import dk.via.habittracker.backend.enums.HabitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public class HabitRequest
{
  @NotBlank
  private String title;

  private String description;

  @NotNull
  private HabitType habitType;

  @NotNull
  private FrequencyType frequencyType;

  private UUID categoryId;
  private BigDecimal targetValue;
  private String unit;
  private String selectedDaysCsv;
  private Boolean active;
  private Boolean reminderEnabled;

  public String getTitle()
  {
    return title;
  }

  public void setTitle(String title)
  {
    this.title = title;
  }

  public String getDescription()
  {
    return description;
  }

  public void setDescription(String description)
  {
    this.description = description;
  }

  public HabitType getHabitType()
  {
    return habitType;
  }

  public void setHabitType(HabitType habitType)
  {
    this.habitType = habitType;
  }

  public FrequencyType getFrequencyType()
  {
    return frequencyType;
  }

  public void setFrequencyType(FrequencyType frequencyType)
  {
    this.frequencyType = frequencyType;
  }

  public UUID getCategoryId()
  {
    return categoryId;
  }

  public void setCategoryId(UUID categoryId)
  {
    this.categoryId = categoryId;
  }

  public BigDecimal getTargetValue()
  {
    return targetValue;
  }

  public void setTargetValue(BigDecimal targetValue)
  {
    this.targetValue = targetValue;
  }

  public String getUnit()
  {
    return unit;
  }

  public void setUnit(String unit)
  {
    this.unit = unit;
  }

  public String getSelectedDaysCsv()
  {
    return selectedDaysCsv;
  }

  public void setSelectedDaysCsv(String selectedDaysCsv)
  {
    this.selectedDaysCsv = selectedDaysCsv;
  }

  public Boolean getActive()
  {
    return active;
  }

  public void setActive(Boolean active)
  {
    this.active = active;
  }

  public Boolean getReminderEnabled()
  {
    return reminderEnabled;
  }

  public void setReminderEnabled(Boolean reminderEnabled)
  {
    this.reminderEnabled = reminderEnabled;
  }
}