package dk.via.habittracker.backend.dto.profile;

import dk.via.habittracker.backend.enums.ThemeMode;

public class ProfileUpdateRequest
{
  private String firstName;
  private String lastName;
  private ThemeMode themeMode;
  private Boolean emailNotifications;
  private Boolean pushNotifications;

  public String getFirstName()
  {
    return firstName;
  }

  public void setFirstName(String firstName)
  {
    this.firstName = firstName;
  }

  public String getLastName()
  {
    return lastName;
  }

  public void setLastName(String lastName)
  {
    this.lastName = lastName;
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