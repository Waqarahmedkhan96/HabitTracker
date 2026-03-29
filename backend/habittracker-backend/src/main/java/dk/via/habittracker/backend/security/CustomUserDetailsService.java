package dk.via.habittracker.backend.security;

import dk.via.habittracker.backend.entity.AppUser;
import dk.via.habittracker.backend.repository.AppUserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService
{
  private final AppUserRepository appUserRepository;

  public CustomUserDetailsService(AppUserRepository appUserRepository)
  {
    this.appUserRepository = appUserRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException
  {
    AppUser user = appUserRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    return new User(
        user.getUsername(),
        user.getPasswordHash(),
        user.isEnabled(),
        true,
        true,
        true,
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
    );
  }
}