package dk.via.habittracker.backend.entity;

import dk.via.habittracker.backend.enums.HabitEntryStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "habit_entries",
    uniqueConstraints = @UniqueConstraint(columnNames = {"habit_id", "entryDate"}))
public class HabitEntry
{
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "habit_id", nullable = false)
  private Habit habit;

  @Column(nullable = false)
  private LocalDate entryDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private HabitEntryStatus status;

  @Column(precision = 10, scale = 2)
  private BigDecimal valueAchieved;

  @Column(length = 500)
  private String note;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void onCreate()
  {
    createdAt = LocalDateTime.now();
  }

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

  public LocalDateTime getCreatedAt()
  {
    return createdAt;
  }
}