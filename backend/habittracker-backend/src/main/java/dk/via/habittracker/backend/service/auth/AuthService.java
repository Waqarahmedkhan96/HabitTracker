package dk.via.habittracker.backend.service.auth;

import dk.via.habittracker.backend.dto.auth.AuthResponse;
import dk.via.habittracker.backend.dto.auth.LoginRequest;
import dk.via.habittracker.backend.dto.auth.RegisterRequest;
import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.entity.UserPreference;
import dk.via.habittracker.backend.enums.Role;
import dk.via.habittracker.backend.repository.AppUserRepository;
import dk.via.habittracker.backend.repository.UserPreferenceRepository;
import dk.via.habittracker.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService
{
  private final AppUserRepository userRepository;
  private final UserPreferenceRepository preferenceRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(AppUserRepository userRepository,
                     UserPreferenceRepository preferenceRepository,
                     PasswordEncoder passwordEncoder,
                     JwtService jwtService)
  {
    this.userRepository = userRepository;
    this.preferenceRepository = preferenceRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public AuthResponse register(RegisterRequest request)
  {
    if (userRepository.existsByEmail(request.getEmail()))
    {
      throw new RuntimeException("Email already exists");
    }

    if (userRepository.existsByUsername(request.getUsername()))
    {
      throw new RuntimeException("Username already exists");
    }

    AppUser user = new AppUser();
    user.setEmail(request.getEmail());
    user.setUsername(request.getUsername());
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setFirstName(request.getFirstName());
    user.setLastName(request.getLastName());
    user.setRole(Role.USER);

    user = userRepository.save(user);

    UserPreference preference = new UserPreference();
    preference.setUser(user);
    preferenceRepository.save(preference);

    String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

    return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getRole().name());
  }

  public AuthResponse login(LoginRequest request)
  {
    AppUser user = userRepository.findByEmail(request.getEmailOrUsername())
        .or(() -> userRepository.findByUsername(request.getEmailOrUsername()))
        .orElseThrow(() -> new RuntimeException("Invalid credentials"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
    {
      throw new RuntimeException("Invalid credentials");
    }

    String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

    return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getRole().name());
  }
}