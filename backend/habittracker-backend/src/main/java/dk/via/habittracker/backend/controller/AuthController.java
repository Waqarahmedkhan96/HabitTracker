package dk.via.habittracker.backend.controller;

import dk.via.habittracker.backend.dto.auth.AuthResponse;
import dk.via.habittracker.backend.dto.auth.LoginRequest;
import dk.via.habittracker.backend.dto.auth.RegisterRequest;
import dk.via.habittracker.backend.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController
{
  private final AuthService authService;

  public AuthController(AuthService authService)
  {
    this.authService = authService;
  }

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody RegisterRequest request)
  {
    return authService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request)
  {
    return authService.login(request);
  }
}