package dk.via.habittracker.backend.config;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.Category;
import dk.via.habittracker.backend.entity.Habit;
import dk.via.habittracker.backend.entity.HabitEntry;
import dk.via.habittracker.backend.entity.UserPreference;
import dk.via.habittracker.backend.enums.FrequencyType;
import dk.via.habittracker.backend.enums.HabitEntryStatus;
import dk.via.habittracker.backend.enums.HabitType;
import dk.via.habittracker.backend.enums.ThemeMode;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.CategoryRepository;
import dk.via.habittracker.backend.repository.HabitEntryRepository;
import dk.via.habittracker.backend.repository.HabitRepository;
import dk.via.habittracker.backend.repository.UserPreferenceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.demo-data", name = "enabled", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner
{
  private final AppUserRepository userRepository;
  private final UserPreferenceRepository preferenceRepository;
  private final CategoryRepository categoryRepository;
  private final HabitRepository habitRepository;
  private final HabitEntryRepository habitEntryRepository;
  private final PasswordEncoder passwordEncoder;

  public DemoDataInitializer(AppUserRepository userRepository,
                             UserPreferenceRepository preferenceRepository,
                             CategoryRepository categoryRepository,
                             HabitRepository habitRepository,
                             HabitEntryRepository habitEntryRepository,
                             PasswordEncoder passwordEncoder)
  {
    this.userRepository = userRepository;
    this.preferenceRepository = preferenceRepository;
    this.categoryRepository = categoryRepository;
    this.habitRepository = habitRepository;
    this.habitEntryRepository = habitEntryRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(ApplicationArguments args)
  {
    if (userRepository.existsByUsername("demo"))
    {
      return;
    }

    AppUser demo = new AppUser();
    demo.setEmail("demo@habittracker.local");
    demo.setUsername("demo");
    demo.setPasswordHash(passwordEncoder.encode("demo1234"));
    demo.setFirstName("Demo");
    demo.setLastName("User");
    demo = userRepository.save(demo);

    UserPreference prefs = new UserPreference();
    prefs.setUser(demo);
    prefs.setThemeMode(ThemeMode.DARK);
    prefs.setEmailNotifications(true);
    prefs.setPushNotifications(false);
    preferenceRepository.save(prefs);

    Category health = new Category();
    health.setUser(demo);
    health.setName("Health");
    health.setDescription("Health focused habits");
    health = categoryRepository.save(health);

    Category learning = new Category();
    learning.setUser(demo);
    learning.setName("Learning");
    learning.setDescription("Learning focused habits");
    learning = categoryRepository.save(learning);

    Habit water = new Habit();
    water.setUser(demo);
    water.setCategory(health);
    water.setTitle("Drink water");
    water.setDescription("Drink at least 8 glasses");
    water.setHabitType(HabitType.NUMERIC);
    water.setFrequencyType(FrequencyType.DAILY);
    water.setTargetValue(BigDecimal.valueOf(8));
    water.setUnit("glasses");
    water.setActive(true);
    water.setReminderEnabled(false);
    water = habitRepository.save(water);

    Habit reading = new Habit();
    reading.setUser(demo);
    reading.setCategory(learning);
    reading.setTitle("Read 20 pages");
    reading.setDescription("Daily reading");
    reading.setHabitType(HabitType.NUMERIC);
    reading.setFrequencyType(FrequencyType.DAILY);
    reading.setTargetValue(BigDecimal.valueOf(20));
    reading.setUnit("pages");
    reading.setActive(true);
    reading.setReminderEnabled(false);
    reading = habitRepository.save(reading);

    LocalDate today = LocalDate.now();
    for (int i = 1; i <= 7; i++)
    {
      LocalDate date = today.minusDays(i);

      HabitEntry waterEntry = new HabitEntry();
      waterEntry.setHabit(water);
      waterEntry.setEntryDate(date);
      waterEntry.setStatus(HabitEntryStatus.COMPLETED);
      waterEntry.setValueAchieved(BigDecimal.valueOf(8));
      waterEntry.setNote("Seeded demo entry");
      habitEntryRepository.save(waterEntry);

      HabitEntry readingEntry = new HabitEntry();
      readingEntry.setHabit(reading);
      readingEntry.setEntryDate(date);
      readingEntry.setStatus(HabitEntryStatus.COMPLETED);
      readingEntry.setValueAchieved(BigDecimal.valueOf(20));
      readingEntry.setNote("Seeded demo entry");
      habitEntryRepository.save(readingEntry);
    }
  }
}