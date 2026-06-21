'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ScrollAnimationInit from '@/components/ui/ScrollAnimationInit'

export default function ApiDocsPage() {
  const [platform, setPlatform] = useState('bukkit') // 'bukkit', 'folia', 'mod'

  useEffect(() => {
    document.title = 'Developer API Documentation | TournaDash'
  }, [])

  const endpoints = [
    {
      method: 'GET',
      badgeVariant: 'success',
      path: '/api/plugin/check',
      description: 'Validates the server token and returns basic tournament status metadata.',
      responseExample: `{
  "connected": true,
  "tournament": {
    "name": "Minecraft Masters Cup",
    "status": "ONGOING",
    "whitelist_enabled": true
  }
}`,
      bukkitCode: `// Asynchronously check connection status
Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/check"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Connected successfully! Response: " + response.body());
        } else {
            plugin.getLogger().warning("Connection failed. HTTP Code: " + response.statusCode());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error checking connection: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia asynchronous connection check
Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/check"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Connected successfully! Response: " + response.body());
        } else {
            plugin.getLogger().warning("Connection failed. HTTP Code: " + response.statusCode());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error checking connection: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style asynchronous connection check (Fabric/Quilt/Forge/NeoForge)
java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/check"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            System.out.println("[TournaDash] Connected successfully! Response: " + response.body());
        } else {
            System.err.println("[TournaDash] Connection failed. HTTP Code: " + response.statusCode());
        }
    } catch (Exception e) {
        System.err.println("[TournaDash] Error checking connection: " + e.getMessage());
    }
});`
    },
    {
      method: 'GET',
      badgeVariant: 'success',
      path: '/api/plugin/whitelist',
      description: 'Fetches the list of all approved/selected players for the tournament whitelisting.',
      responseExample: `{
  "whitelist": [
    { "minecraft_ign": "Steve", "minecraft_uuid": "85720e6a-72ef-401d-85d7-b08bc8c4146a" },
    { "minecraft_ign": "Alex", "minecraft_uuid": "d38bb81e-1cf6-4442-8877-cd0d5a49c3bd" }
  ]
}`,
      bukkitCode: `// Fetch whitelisted player names & UUIDs
Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/whitelist"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Whitelisted players loaded: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error loading whitelist: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia fetch whitelisted player names & UUIDs
Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/whitelist"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Whitelisted players loaded: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error loading whitelist: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style fetch whitelisted player names & UUIDs (Fabric/Quilt/Forge/NeoForge)
java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/whitelist"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            System.out.println("[TournaDash] Whitelisted players loaded: " + response.body());
        }
    } catch (Exception e) {
        System.err.println("[TournaDash] Error loading whitelist: " + e.getMessage());
    }
});`
    },
    {
      method: 'POST',
      badgeVariant: 'primary',
      path: '/api/plugin/status',
      description: 'Updates the tournament status or gates whitelist access settings.',
      requestBody: `{
  "status": "ENDED", // Optional: 'SOON', 'ONGOING', 'ENDED'
  "whitelist_enabled": true // Optional: boolean
}`,
      responseExample: `{
  "success": true,
  "updated": {
    "status": "ENDED"
  }
}`,
      bukkitCode: `// Update status and toggle whitelist gate
String payload = "{\\"status\\": \\"ONGOING\\", \\"whitelist_enabled\\": true}";

Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + serverToken)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        plugin.getLogger().info("Status update response: " + response.body());
    } catch (Exception e) {
        plugin.getLogger().severe("Error updating status: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia update status and toggle whitelist gate
String payload = "{\\"status\\": \\"ONGOING\\", \\"whitelist_enabled\\": true}";

Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + serverToken)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        plugin.getLogger().info("Status update response: " + response.body());
    } catch (Exception e) {
        plugin.getLogger().severe("Error updating status: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style update status and toggle whitelist gate (Fabric/Quilt/Forge/NeoForge)
String payload = "{\\"status\\": \\"ONGOING\\", \\"whitelist_enabled\\": true}";

java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + serverToken)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        System.out.println("[TournaDash] Status update response: " + response.body());
    } catch (Exception e) {
        System.err.println("[TournaDash] Error updating status: " + e.getMessage());
    }
});`
    },
    {
      method: 'POST',
      badgeVariant: 'primary',
      path: '/api/plugin/leaderboard',
      description: 'Creates a new custom tournament leaderboard (standings board) or overwrites an existing one of the same name.',
      requestBody: `{
  "name": "Round 1 Standings",
  "is_public": true,
  "entries": [
    { "position": 1, "username": "Steve", "notes": "Winner - 15 Kills" },
    { "position": 2, "username": "Alex", "notes": "10 Kills" }
  ]
}`,
      responseExample: `{
  "success": true,
  "leaderboard_id": "c1387d89-9e8c-4a3b-821f-0e6d63bcde6b",
  "name": "Round 1 Standings",
  "is_public": true,
  "entries_count": 2
}`,
      bukkitCode: `// Create GSON payload and submit standings
com.google.gson.JsonObject payload = new com.google.gson.JsonObject();
payload.addProperty("name", "Round 1 Standings");
payload.addProperty("is_public", true);

com.google.gson.JsonArray entries = new com.google.gson.JsonArray();
com.google.gson.JsonObject entry1 = new com.google.gson.JsonObject();
entry1.addProperty("position", 1);
entry1.addProperty("username", "Steve");
entry1.addProperty("notes", "Winner - 15 Kills");
entries.add(entry1);

payload.add("entries", entries);

Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + serverToken)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        plugin.getLogger().info("Leaderboard response: " + response.body());
    } catch (Exception e) {
        plugin.getLogger().severe("Error posting standings: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia create GSON payload and submit standings
com.google.gson.JsonObject payload = new com.google.gson.JsonObject();
payload.addProperty("name", "Round 1 Standings");
payload.addProperty("is_public", true);

com.google.gson.JsonArray entries = new com.google.gson.JsonArray();
com.google.gson.JsonObject entry1 = new com.google.gson.JsonObject();
entry1.addProperty("position", 1);
entry1.addProperty("username", "Steve");
entry1.addProperty("notes", "Winner - 15 Kills");
entries.add(entry1);

payload.add("entries", entries);

Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + serverToken)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        plugin.getLogger().info("Leaderboard response: " + response.body());
    } catch (Exception e) {
        plugin.getLogger().severe("Error posting standings: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style create GSON payload and submit standings (Fabric/Quilt/Forge/NeoForge)
com.google.gson.JsonObject payload = new com.google.gson.JsonObject();
payload.addProperty("name", "Round 1 Standings");
payload.addProperty("is_public", true);

com.google.gson.JsonArray entries = new com.google.gson.JsonArray();
com.google.gson.JsonObject entry1 = new com.google.gson.JsonObject();
entry1.addProperty("position", 1);
entry1.addProperty("username", "Steve");
entry1.addProperty("notes", "Winner - 15 Kills");
entries.add(entry1);

payload.add("entries", entries);

java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + serverToken)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        System.out.println("[TournaDash] Leaderboard response: " + response.body());
    } catch (Exception e) {
        System.err.println("[TournaDash] Error posting standings: " + e.getMessage());
    }
});`
    },
    {
      method: 'GET',
      badgeVariant: 'success',
      path: '/api/plugin/leaderboard',
      description: 'Retrieves all custom leaderboards and entries for the authorized tournament.',
      responseExample: `{
  "tournament_id": "b139de67-1111-2222-3333-444455556666",
  "leaderboards": [
    {
      "id": "c1387d89-9e8c-4a3b-821f-0e6d63bcde6b",
      "name": "Round 1 Standings",
      "is_public": true,
      "entries": [
        { "position": 1, "username": "Steve", "notes": "Winner - 15 Kills" }
      ]
    }
  ]
}`,
      bukkitCode: `// Retrieve leaderboards and entries asynchronously
Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Leaderboards: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error retrieving leaderboards: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia retrieve leaderboards and entries
Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Leaderboards: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error retrieving leaderboards: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style retrieve leaderboards and entries (Fabric/Quilt/Forge/NeoForge)
java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            System.out.println("[TournaDash] Leaderboards: " + response.body());
        }
    } catch (Exception e) {
        System.err.println("[TournaDash] Error retrieving leaderboards: " + e.getMessage());
    }
});`
    },
    {
      method: 'DELETE',
      badgeVariant: 'danger',
      path: '/api/plugin/leaderboard?name=<name>',
      description: 'Deletes a custom leaderboard and all its standings entries by name.',
      responseExample: `{
  "success": true,
  "message": "Leaderboard 'Round 1 Standings' deleted successfully"
}`,
      bukkitCode: `// Delete a leaderboard by name asynchronously
String boardName = "Round 1 Standings";
try {
    String encodedName = java.net.URLEncoder.encode(boardName, "UTF-8");
    Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard?name=" + encodedName))
                    .header("Authorization", "Bearer " + serverToken)
                    .DELETE()
                    .build();
            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            plugin.getLogger().info("Delete response: " + response.body());
        } catch (Exception e) {
            plugin.getLogger().severe("Error executing delete: " + e.getMessage());
        }
    });
} catch (Exception e) {
    plugin.getLogger().severe("Encoding error: " + e.getMessage());
}`,
      foliaCode: `// Folia delete a leaderboard by name
String boardName = "Round 1 Standings";
try {
    String encodedName = java.net.URLEncoder.encode(boardName, "UTF-8");
    Bukkit.getAsyncScheduler().runNow(plugin, task -> {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard?name=" + encodedName))
                    .header("Authorization", "Bearer " + serverToken)
                    .DELETE()
                    .build();
            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            plugin.getLogger().info("Delete response: " + response.body());
        } catch (Exception e) {
            plugin.getLogger().severe("Error executing delete: " + e.getMessage());
        }
    });
} catch (Exception e) {
    plugin.getLogger().severe("Encoding error: " + e.getMessage());
}`,
      modCode: `// Mod-style delete a leaderboard by name (Fabric/Quilt/Forge/NeoForge)
String boardName = "Round 1 Standings";
try {
    String encodedName = java.net.URLEncoder.encode(boardName, "UTF-8");
    java.util.concurrent.CompletableFuture.runAsync(() -> {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/leaderboard?name=" + encodedName))
                    .header("Authorization", "Bearer " + serverToken)
                    .DELETE()
                    .build();
            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            System.out.println("[TournaDash] Delete response: " + response.body());
        } catch (Exception e) {
            System.err.println("[TournaDash] Error executing delete: " + e.getMessage());
        }
    });
} catch (Exception e) {
    System.err.println("[TournaDash] Encoding error: " + e.getMessage());
}`
    },
    {
      method: 'GET',
      badgeVariant: 'success',
      path: '/api/plugin/members',
      description: 'Fetches the list of all members of the organization, including their roles and Minecraft IGNs (if set).',
      responseExample: `{
  "organization_id": "d139de67-1111-2222-3333-444455556666",
  "total": 1,
  "members": [
    {
      "id": "e1387d89-9e8c-4a3b-821f-0e6d63bcde6b",
      "user_id": "usr_72ef-401d-85d7",
      "role": "OWNER",
      "minecraft_ign": "Steve",
      "username": "steve_player",
      "display_name": "Steve Pro",
      "avatar_url": "https://...",
      "created_at": "2026-06-20T12:00:00Z"
    }
  ]
}`,
      bukkitCode: `// Fetch organization members list
Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/members"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Members loaded: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error loading members: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia fetch organization members list
Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/members"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Members loaded: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error loading members: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style fetch organization members list (Fabric/Quilt/Forge/NeoForge)
java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/members"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            System.out.println("[TournaDash] Members loaded: " + response.body());
        }
    } catch (Exception e) {
        System.err.println("[TournaDash] Error loading members: " + e.getMessage());
    }
});`
    },
    {
      method: 'GET',
      badgeVariant: 'success',
      path: '/api/plugin/participants',
      description: 'Fetches the list of players who are whitelisted/approved for this specific tournament.',
      responseExample: `{
  "tournament_id": "b139de67-1111-2222-3333-444455556666",
  "total": 1,
  "active": 1,
  "participants": [
    {
      "id": "p1387d89-9e8c-4a3b-821f-0e6d63bcde6b",
      "minecraft_ign": "Steve",
      "minecraft_uuid": "85720e6a-72ef-401d-85d7-b08bc8c4146a",
      "is_banned": false,
      "added_via": "plugin",
      "created_at": "2026-06-21T10:00:00Z"
    }
  ]
}`,
      bukkitCode: `// Fetch tournament participants list
Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/participants"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Participants loaded: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error loading participants: " + e.getMessage());
    }
});`,
      foliaCode: `// Folia fetch tournament participants list
Bukkit.getAsyncScheduler().runNow(plugin, task -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/participants"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            plugin.getLogger().info("Participants loaded: " + response.body());
        }
    } catch (Exception e) {
        plugin.getLogger().severe("Error loading participants: " + e.getMessage());
    }
});`,
      modCode: `// Mod-style fetch tournament participants list (Fabric/Quilt/Forge/NeoForge)
java.util.concurrent.CompletableFuture.runAsync(() -> {
    try {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://tournadash.vercel.app/api/plugin/participants"))
                .header("Authorization", "Bearer " + serverToken)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            System.out.println("[TournaDash] Participants loaded: " + response.body());
        }
    } catch (Exception e) {
        System.err.println("[TournaDash] Error loading participants: " + e.getMessage());
    }
});`
    }
  ]

  const getCodeSnippet = (ep) => {
    if (platform === 'bukkit') return ep.bukkitCode
    if (platform === 'folia') return ep.foliaCode
    return ep.modCode
  }

  const getPlatformLabel = () => {
    if (platform === 'bukkit') return '☕ Java Asynchronous Code Example (Paper / Spigot / Purpur)'
    if (platform === 'folia') return '⚡ Java Asynchronous Code Example (Folia)'
    return '⚙️ Java Asynchronous Code Example (Fabric / Quilt / Forge / NeoForge)'
  }

  return (
    <div id="api-docs-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner animate-on-scroll" 
        style={{ 
          background: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%)`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🖥️ Developer API Docs
          </h1>
          <p className="page-header-banner-desc">
            Integrate your custom servers, plugins, and web applications with the TournaDash network.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="flex flex-col gap-8">
          
          <Card className="p-6 animate-on-scroll">
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-3)' }}>
              API Base URL & Authentication
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-3)' }}>
              All game server requests are routed through our central API. Secure requests using your tournament&apos;s unique secret token.
            </p>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>API BASE URL:</div>
              <pre style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)'
              }}>https://tournadash.vercel.app/api/plugin</pre>
            </div>
            
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-3)' }}>
              <strong>How to get your Server Token:</strong> Log into your dashboard, navigate to your Organization page, select the specific tournament, and locate the <strong>Server Token</strong> field on the details view card. 
              <br />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                ⚠️ Note: The Server Token (prefixed with <code>tournament_tok_</code>) is only visible to the Organization <strong>OWNER</strong>. Other roles will see a padlock graphic to prevent key leaks.
              </span>
            </p>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>AUTHORIZATION HEADER EXAMPLE:</div>
            <pre style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)'
            }}>Authorization: Bearer tournament_tok_your_secret_key_here</pre>
          </Card>

          <Card className="p-6 animate-on-scroll">
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)' }}>
              API Endpoints
            </h2>

            {/* Platform Selector Bar */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: 'var(--space-6)',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '6px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              overflowX: 'auto'
            }}>
              <button 
                onClick={() => setPlatform('bukkit')}
                className={`btn btn-sm ${platform === 'bukkit' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
              >
                🧰 Paper / Spigot / Purpur
              </button>
              <button 
                onClick={() => setPlatform('folia')}
                className={`btn btn-sm ${platform === 'folia' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
              >
                ⚡ Folia
              </button>
              <button 
                onClick={() => setPlatform('mod')}
                className={`btn btn-sm ${platform === 'mod' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
              >
                ⚙️ Fabric / Quilt / Forge / NeoForge
              </button>
            </div>

            <div className="flex flex-col gap-6" style={{ fontSize: 'var(--text-sm)' }}>
              {endpoints.map((ep, idx) => (
                <div key={idx}>
                  {idx > 0 && <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)', marginBottom: 'var(--space-6)', marginTop: 'var(--space-6)' }} />}
                  
                  <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                    <Badge variant={ep.badgeVariant} style={{ fontFamily: 'var(--font-mono)' }}>{ep.method}</Badge>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>{ep.path}</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                    {ep.description}
                  </p>

                  {ep.requestBody && (
                    <>
                      <div style={{ fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Request Body:</div>
                      <pre style={{
                        backgroundColor: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-primary)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: '8px',
                        overflowX: 'auto'
                      }}>{ep.requestBody}</pre>
                    </>
                  )}

                  <div style={{ fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Response Example:</div>
                  <pre style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto'
                  }}>{ep.responseExample}</pre>

                  {/* Collapsible Sample Code */}
                  <details style={{
                    marginTop: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg-input)',
                    overflow: 'hidden'
                  }}>
                    <summary style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: 'var(--color-text-white)',
                      fontSize: 'var(--text-xs)',
                      userSelect: 'none',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      outline: 'none'
                    }}>
                      {getPlatformLabel()}
                    </summary>
                    <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>
                      <pre style={{
                        margin: 0,
                        color: 'var(--color-text-secondary)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>{getCodeSnippet(ep)}</pre>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <ScrollAnimationInit />
    </div>
  )
}
