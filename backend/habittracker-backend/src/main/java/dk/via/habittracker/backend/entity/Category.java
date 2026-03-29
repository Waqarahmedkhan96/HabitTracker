package dk.via.habittracker.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "categories",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "name"}))
public class Category
{
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(length = 255)
  private String description;

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

  public AppUser getUser()
  {
    return user;
  }

  public void setUser(AppUser user)
  {
    this.user = user;
  }

  public String getName()
  {
    return name;
  }

  public void setName(String name)
  {
    this.name = name;
  }

  public String getDescription()
  {
    return description;
  }

  public void setDescription(String description)
  {
    this.description = description;
  }

  public LocalDateTime getCreatedAt()
  {
    return createdAt;
  }
}