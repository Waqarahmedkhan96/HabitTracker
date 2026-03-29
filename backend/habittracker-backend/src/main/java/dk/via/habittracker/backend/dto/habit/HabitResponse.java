package dk.via.habittracker.backend.dto.habit;

import dk.via.habittracker.backend.enums.FrequencyType;
import dk.via.habittracker.backend.enums.HabitType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class HabitResponse
{
  private UUID id;
  private String title;
  private String description;
  private HabitType habitType;
  private FrequencyType frequencyType;
  private UUID categoryId;
  private String categoryName;
  private Boolean active;
  private Boolean reminderEnabled;
  private BigDecimal targetValue;
  private String unit;
  private String selectedDaysCsv;
  private LocalDateTime createdAt;
  private int currentStreak;
  private int longestStreak;
  private double successPercentage;

  public UUID getId()
  {
    return id;
  }

  public void setId(UUID id)
  {
    this.id = id;
  }

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

  public String getCategoryName()
  {
    return categoryName;
  }

  public void setCategoryName(String categoryName)
  {
    this.categoryName = categoryName;
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

  public LocalDateTime getCreatedAt()
  {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt)
  {
    this.createdAt = createdAt;
  }

  public int getCurrentStreak()
  {
    return currentStreak;
  }

  public void setCurrentStreak(int currentStreak)
  {
    this.currentStreak = currentStreak;
  }

  public int getLongestStreak()
  {
    return longestStreak;
  }

  public void setLongestStreak(int longestStreak)
  {
    this.longestStreak = longestStreak;
  }

  public double getSuccessPercentage()
  {
    return successPercentage;
  }

  public void setSuccessPercentage(double successPercentage)
  {
    this.successPercentage = successPercentage;
  }
}