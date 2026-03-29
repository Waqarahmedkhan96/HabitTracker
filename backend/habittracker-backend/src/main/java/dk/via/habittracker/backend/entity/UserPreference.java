package dk.via.habittracker.backend.entity;

import dk.via.habittracker.backend.enums.ThemeMode;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
public class UserPreference
{
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @OneToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private AppUser user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ThemeMode themeMode = ThemeMode.SYSTEM;

  @Column(nullable = false)
  private Boolean emailNotifications = true;

  @Column(nullable = false)
  private Boolean pushNotifications = true;

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

  public ThemeMode getThemeMode()
  {
    return themeMode;
  }

  public void setThemeMode(ThemeMode themeMode)
  {
    this.themeMode = themeMode;
  }

  public Boolean getEmailNotifications()
  {
    return emailNotifications;
  }

  public void setEmailNotifications(Boolean emailNotifications)
  {
    this.emailNotifications = emailNotifications;
  }

  public Boolean getPushNotifications()
  {
    return pushNotifications;
  }

  public void setPushNotifications(Boolean pushNotifications)
  {
    this.pushNotifications = pushNotifications;
  }
}