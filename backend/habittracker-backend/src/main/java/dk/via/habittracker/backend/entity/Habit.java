package dk.via.habittracker.backend.entity;

import dk.via.habittracker.backend.enums.FrequencyType;
import dk.via.habittracker.backend.enums.HabitType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "habits")
public class Habit
{
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;

  @Column(nullable = false, length = 150)
  private String title;

  @Column(length = 500)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private HabitType habitType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private FrequencyType frequencyType;

  @Column(nullable = false)
  private Boolean active = true;

  @Column(precision = 10, scale = 2)
  private BigDecimal targetValue;

  @Column(length = 30)
  private String unit;

  @Column(length = 50)
  private String selectedDaysCsv;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  public void onCreate()
  {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  public void onUpdate()
  {
    updatedAt = LocalDateTime.now();
  }

  public UUID getId()
  {
    return id;
  }

  public void setId(UUID id)
  {
    this.id = id;
  }

  public AppUser getUser()
  {
    return user;
  }

  public void setUser(AppUser user)
  {
    this.user = user;
  }

  public Category getCategory()
  {
    return category;
  }

  public void setCategory(Category category)
  {
    this.category = category;
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

  public Boolean getActive()
  {
    return active;
  }

  public void setActive(Boolean active)
  {
    this.active = active;
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

  public LocalDateTime getUpdatedAt()
  {
    return updatedAt;
  }
}