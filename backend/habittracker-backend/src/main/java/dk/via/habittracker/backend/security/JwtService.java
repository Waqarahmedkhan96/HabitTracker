package dk.via.habittracker.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService
{
  @Value("${app.jwt.secret}")
  private String secret;

  @Value("${app.jwt.expiration-ms}")
  private long expirationMs;

  public String generateToken(UUID userId, String username, String role)
  {
    Instant now = Instant.now();
    Instant expiry = now.plusMillis(expirationMs);

    return Jwts.builder()
        .setSubject(username)
        .claim("userId", userId.toString())
        .claim("role", role)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiry))
        .signWith(getSigningKey())
        .compact();
  }

  public Claims extractAllClaims(String token)
  {
    return Jwts.parser()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }

  public String extractUsername(String token)
  {
    return extractAllClaims(token).getSubject();
  }

  public boolean isTokenValid(String token, String username)
  {
    try
    {
      Claims claims = extractAllClaims(token);
      return claims.getSubject().equals(username) && claims.getExpiration().after(new Date());
    }
    catch (Exception e)
    {
      return false;
    }
  }

  private SecretKey getSigningKey()
  {
    byte[] keyBytes = Decoders.BASE64.decode(secret);
    return Keys.hmacShaKeyFor(keyBytes);
  }
}