package com.edefence.comptabia.dto.ia;

import java.util.List;

public final class ChatDto {

    private ChatDto() {}

    public record Request(
            List<Message> messages,
            boolean includeContext
    ) {}

    public record Message(String role, String content) {}

    public record Response(String content) {}
}
